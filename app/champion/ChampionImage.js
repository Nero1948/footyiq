'use client';

import { useState } from 'react';
import Image from 'next/image';

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
    <Image
      src={`/api/champion?date=${date}`}
      alt="Today's Set For Six champion card"
      width={1200}
      height={630}
      priority
      onError={() => setImageError(true)}
      className="w-full rounded-xl"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    />
  );
}
