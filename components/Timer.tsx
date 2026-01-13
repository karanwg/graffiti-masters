'use client';

import { useGameStore } from '@/lib/gameStore';

export function Timer() {
  const { gameState } = useGameStore();
  
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  
  const isLow = gameState.timeRemaining <= 30;
  const isCritical = gameState.timeRemaining <= 10;
  
  return (
    <div
      className={`glass-panel px-6 py-3 rounded-xl font-mono text-3xl font-bold tabular-nums transition-all ${
        isCritical
          ? 'text-red-500 animate-pulse shadow-lg shadow-red-500/50'
          : isLow
          ? 'text-yellow-500'
          : 'text-white'
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
