'use client';

import { useGameStore } from '@/lib/gameStore';
import { TEAM_COLORS } from '@/lib/types';

export function PressureGauge() {
  const { localPlayer, myPlayerId, gameState } = useGameStore();
  
  const myTeamId = gameState.players.find((p) => p.id === myPlayerId)?.teamId ?? 0;
  const teamColor = TEAM_COLORS[myTeamId]?.neonColor ?? '#00ffff';
  
  const { canPressure, canType } = localPlayer;
  
  if (!canType) {
    return (
      <div className="glass-panel p-3 rounded-xl">
        <div className="text-sm text-zinc-400 text-center">
          Answer a question to get paint!
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-3 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              canType === 'fat' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-zinc-500 to-zinc-600'
            }`}
          >
            {canType === 'fat' ? '🔥' : '💨'}
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400 uppercase tracking-wide">
              {canType === 'fat' ? 'Fat Cap' : 'Skinny Cap'}
            </span>
            <span style={{ color: teamColor }}>{Math.round(canPressure)}%</span>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden relative">
            {/* Animated background stripes */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 5px,
                  ${teamColor} 5px,
                  ${teamColor} 10px
                )`,
                animation: 'slide 1s linear infinite',
              }}
            />
            {/* Pressure fill */}
            <div
              className="h-full rounded-full transition-all duration-100 relative"
              style={{
                width: `${canPressure}%`,
                background: `linear-gradient(90deg, ${teamColor}, ${teamColor}cc)`,
                boxShadow: `0 0 20px ${teamColor}80`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
