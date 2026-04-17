'use client';

import { useState } from 'react';
import Image from 'next/image';

function formatSeconds(ms) { return (ms / 1000).toFixed(1) + 's'; }
function formatClues(n) { return n === 1 ? '1 clue' : `${n} clues`; }
function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function WallOfFame({ entries, todayAEST, winnerCounts }) {
  const [expandedDate, setExpandedDate] = useState(null);

  if (!entries.length) {
    return <p className="text-gray-600 text-sm mt-4">No games played yet.</p>;
  }

  return (
    <div className="space-y-2 mt-4">
      {entries.map(({ date, gameNumber: gNum, champion: c }, i) => {
        const isToday = date === todayAEST;
        const isMultiWinner = c && winnerCounts[c.name] > 1;
        const isTopEntry = i === 0 && !!c;
        const isExpanded = expandedDate === date;
        const isClickable = !!c;

        return (
          <div key={date}>
            <div
              onClick={() => isClickable && setExpandedDate(isExpanded ? null : date)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isClickable ? 'cursor-pointer hover:bg-white/5' : ''
              }`}
              style={{
                background: isToday ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.03)',
                borderTop:    '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                borderRight:  '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                borderBottom: '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                borderLeft: isTopEntry
                  ? '3px solid #f6b91f'
                  : '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
              }}
            >
              <div className="flex-shrink-0 w-8 text-center">
                {isMultiWinner
                  ? <span className="text-lg">👑</span>
                  : c
                    ? <span className="text-base">🏅</span>
                    : <span className="text-gray-700 text-xs">—</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {isToday ? 'Today' : formatDisplayDate(date)}
                </p>
                <p className="text-xs text-gray-600">Game #{gNum}</p>
              </div>

              {c ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isToday ? 'text-[#00e676]' : 'text-white'}`}>
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatClues(c.cluesUsed)} · {formatSeconds(c.totalTimeMs)}
                    </p>
                  </div>
                  <span className="text-gray-600 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 flex-shrink-0">No scores yet</p>
              )}
            </div>

            {/* Expanded champion card */}
            {isExpanded && (
              <div className="mt-1 mb-1 rounded-xl overflow-hidden">
                <Image
                  src={`/api/champion?date=${date}`}
                  alt={`Champion card for ${formatDisplayDate(date)}`}
                  width={1200}
                  height={630}
                  unoptimized
                  className="w-full rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
