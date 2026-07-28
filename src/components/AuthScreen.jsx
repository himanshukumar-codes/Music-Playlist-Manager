import { useState } from 'react';

function getStoredUsers() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem('music-playlist-users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  window.localStorage.setItem('music-playlist-users', JSON.stringify(users));
}

export default function AuthScreen({ onAuthenticate }) {
  const [mode, setMode] = useState('signin');
  const [stage, setStage] = useState('request');
  const [formData, setFormData] = useState({ name: '', email: '', otp: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (info) setInfo('');
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const parseJsonResponse = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text.trim() || response.statusText };
    }
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedName = formData.name.trim();

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && trimmedName.length < 2) {
      setError('Please enter a name to create your account.');
      return;
    }

    try {
      const response = await fetch('/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName || trimmedEmail.split('@')[0],
          mode,
        }),
      });

      const result = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(result?.message || `Unable to send OTP (${response.status}).`);
      }

      setStage('verify');
      setInfo(result.message || `OTP sent to ${trimmedEmail}. Enter the code to continue.`);
    } catch (sendError) {
      setError(sendError.message || 'Unable to send OTP.');
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const enteredOtp = formData.otp.trim();

    if (!trimmedEmail || !enteredOtp) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, otp: enteredOtp }),
      });

      const result = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(result?.message || `OTP verification failed (${response.status}).`);
      }

      onAuthenticate(result.user);
    } catch (verifyError) {
      setError(verifyError.message || 'OTP verification failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(135deg,_#020617,_#111827_60%,_#0f172a)] px-3 py-8 sm:px-4 sm:py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-8 sm:px-8 sm:py-10 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="mb-4 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.35em] text-cyan-300">Secure login</p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold text-white">
            {mode === 'signin' ? 'Sign in with OTP' : 'Sign up with OTP'}
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-400">
            {mode === 'signin'
              ? "Enter your email and we'll send you a one-time code."
              : 'Enter your details to create your account.'}
          </p>
        </div>

        {stage === 'request' ? (
          <form className="space-y-5" onSubmit={handleRequestOtp}>
            {mode === 'signup' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_0_6px_rgba(56,189,248,0.16)]"
                  placeholder="Jane Doe"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_0_6px_rgba(56,189,248,0.16)]"
                placeholder="you@example.com"
              />
            </div>

            <div role="alert" className="rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100 shadow-sm shadow-amber-500/10">
              <p className="font-semibold text-amber-200">Warning: OTP may arrive in your spam or junk folder.</p>
              <p className="mt-1 leading-6 text-amber-100">
                If you don’t see the email immediately, please check spam/junk and allow messages from this sender before requesting a new code.
              </p>
            </div>

            {error ? <p className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}
            {info ? <p className="rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{info}</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-cyan-500/20 transition hover:brightness-110"
            >
              {mode === 'signin' ? 'Send login code' : 'Create account'}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="otp">
                Enter OTP code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleChange}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:shadow-[0_0_0_6px_rgba(56,189,248,0.16)]"
                placeholder="123456"
              />
            </div>

            {error ? <p className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}
            {info ? <p className="rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{info}</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:brightness-110"
            >
              Verify code
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('request');
                setFormData((prev) => ({ ...prev, otp: '' }));
                setInfo('');
                setError('');
              }}
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Use different email
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm text-slate-400">
          {mode === 'signin' ? (
            <>
              <p>New here? <button
                type="button"
                className="inline rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
                onClick={() => {
                  setMode('signup');
                  setStage('request');
                  setFormData({ name: '', email: '', otp: '' });
                  setError('');
                  setInfo('');
                }}
              >
                Create an account
              </button></p>
            </>
          ) : (
            <>
              <p>Already registered? <button
                type="button"
                className="inline rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
                onClick={() => {
                  setMode('signin');
                  setStage('request');
                  setFormData({ name: '', email: '', otp: '' });
                  setError('');
                  setInfo('');
                }}
              >
                Sign in instead
              </button></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
