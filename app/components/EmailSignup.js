'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';

const GREEN = '#00e676';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle');

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        track('email_signup', { location: 'homepage' });
      }
      setEmailState(res.ok ? 'done' : 'error');
    } catch {
      setEmailState('error');
    }
  }

  if (emailState === 'done') {
    return (
      <p className="font-bold text-lg" style={{ color: GREEN }}>
        You&apos;re in! See you tomorrow at 7am Sydney / 9am NZ.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="email-signup" className="sr-only">Email address</label>
        <input
          id="email-signup"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        />
        <button
          type="submit"
          disabled={emailState === 'loading'}
          className="font-bold px-5 py-3 rounded-xl text-sm text-white disabled:opacity-50 transition-colors whitespace-nowrap"
          style={{ background: '#1e2f45', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {emailState === 'loading' ? '…' : "Get tomorrow's game"}
        </button>
      </form>
      {emailState === 'error' && (
        <p className="text-red-400 text-xs mt-3">Something went wrong. Try again.</p>
      )}
    </>
  );
}
