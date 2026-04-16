'use client';

import { useState } from 'react';

export default function ChampionImage({ date }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div
        className="rounded-xl flex items-center justify-center h-40 text-gray-600 text-sm"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        Card unavailable
      </div>
    );
  }

  return (
    <img
      src={`/api/champion?date=${date}`}
      alt="Today's Set For Six champion card"
      onError={() => setImageError(true)}
      className="w-full rounded-xl"
      style={{ aspectRatio: '1200 / 630', border: '1px solid rgba(255,255,255,0.08)' }}
    />
  );
}
