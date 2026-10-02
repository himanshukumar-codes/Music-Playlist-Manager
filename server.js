import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const usersFile = path.join(__dirname, 'users.json');
const loadUsers = () => {
  if (!fs.existsSync(usersFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8')) || [];
  } catch {
    return [];
  }
};

const users = new Map(loadUsers().map((user) => [user.email, user]));
const saveUsers = () => {
  fs.writeFileSync(usersFile, JSON.stringify(Array.from(users.values()), null, 2));
};

const app = express();
const port = process.env.PORT || 4000;

const otpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendEmail({ email, subject, text }) {
  const fallbackEnabled = process.env.DEV_EMAIL_FALLBACK === 'true';

  if (fallbackEnabled) {
    console.warn('DEV_EMAIL_FALLBACK is enabled. OTP is being logged to the server console instead of sent by email.');
    console.log(`OTP for ${email}: ${text}`);
    return Promise.resolve({ fallback: true });
  }

  const emailProvider = (process.env.EMAIL_PROVIDER || 'sendgrid').trim().toLowerCase();
  const emailUser = process.env.EMAIL_USER;

  if (!emailUser) {
    throw new Error('EMAIL_USER must be set in .env');
  }

  if (emailProvider === 'smtp') {
    const emailPassword = process.env.EMAIL_PASSWORD;
    if (!emailPassword) {
      throw new Error('EMAIL_PASSWORD must be set when EMAIL_PROVIDER=smtp');
    }

    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465;
    const transporter = nodemailer.createTransport({
      ...(process.env.SMTP_HOST
        ? { host: process.env.SMTP_HOST, port: smtpPort, secure: smtpSecure }
        : { service: process.env.EMAIL_SERVICE || 'gmail' }),
      auth: { user: emailUser, pass: emailPassword },
    });

    await transporter.sendMail({
      from: { name: 'Music Playlist Manager', address: emailUser },
      to: email,
      subject,
      text,
    });
    return { success: true };
  }

  if (emailProvider !== 'sendgrid') {
    throw new Error('EMAIL_PROVIDER must be either sendgrid or smtp');
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY and EMAIL_USER must be set in .env');
  }

  // Use SendGrid HTTP API (works on Render; doesn't require SMTP port 587)
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject,
          },
        ],
        from: {
          email: emailUser,
          name: 'Music Playlist Manager',
        },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error('SendGrid HTTP API send failed:', error);
    throw error;
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/request-otp', async (req, res) => {
  const { email, name, mode } = req.body;
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const trimmedName = String(name || '').trim();

  if (!trimmedEmail || !mode) {
    return res.status(400).json({ message: 'Email and mode are required.' });
  }

  const user = users.get(trimmedEmail);
  if (mode === 'signup' && user) {
    return res.status(400).json({ message: 'An account already exists for this email. Please sign in.' });
  }
  if (mode === 'signin' && !user) {
    return res.status(400).json({ message: 'No account found for this email. Please sign up first.' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(trimmedEmail, { otp, expiresAt, mode, name: trimmedName || user?.name || trimmedEmail.split('@')[0] });

  try {
    const result = await sendEmail({
      email: trimmedEmail,
      subject: 'Your Music Playlist Manager OTP',
      text: `Hello ${trimmedName || user?.name || trimmedEmail.split('@')[0]},\n\nYour OTP code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    if (result?.fallback) {
      return res.json({ success: true, message: 'OTP fallback enabled; code logged on server.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ message: 'Failed to send OTP email.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const trimmedEmail = String(email || '').trim().toLowerCase();

  if (!trimmedEmail || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const record = otpStore.get(trimmedEmail);
  if (!record) {
    return res.status(400).json({ message: 'No OTP request found for this email.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(trimmedEmail);
    return res.status(400).json({ message: 'OTP has expired. Request a new code.' });
  }

  if (otp !== record.otp) {
    return res.status(400).json({ message: 'Invalid OTP code.' });
  }

  otpStore.delete(trimmedEmail);

  if (record.mode === 'signup') {
    const newUser = { email: trimmedEmail, name: record.name };
    users.set(trimmedEmail, newUser);
    saveUsers();
    return res.json({ success: true, user: newUser });
  }

  const existingUser = users.get(trimmedEmail);
  if (!existingUser) {
    return res.status(400).json({ message: 'No account found for this email.' });
  }

  return res.json({ success: true, user: existingUser });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
