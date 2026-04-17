'use client';

export default function Error({ reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0e13' }}>
      <div className="text-center">
        <p className="text-2xl font-black text-white mb-3">Set For Six</p>
        <p className="text-gray-400 mb-6">Something went wrong loading the game.</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
          style={{ background: '#00e676' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
