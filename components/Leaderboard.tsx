'use client';

import { useGameStore } from '@/lib/gameStore';
import { TEAM_COLORS } from '@/lib/types';

interface LeaderboardProps {
  onPlayAgain?: () => void;
}

export function Leaderboard({ onPlayAgain }: LeaderboardProps) {
  const { gameState, localPlayer } = useGameStore();
  
  // Sort teams by territory percentage
  const sortedTeams = [...gameState.teams]
    .filter((t) => t.playerIds.length > 0)
    .sort((a, b) => b.territoryPercent - a.territoryPercent);
  
  const winner = sortedTeams[0];
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      {/* Winner announcement */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-black mb-4 graffiti-title">
          GAME OVER
        </h1>
        {winner && winner.territoryPercent > 0 && (
          <div className="glass-panel p-6 rounded-2xl inline-block">
            <div className="text-lg text-zinc-400 mb-2">🏆 Winner</div>
            <div
              className="text-3xl sm:text-4xl font-bold"
              style={{
                color: TEAM_COLORS[winner.id]?.neonColor,
                textShadow: `0 0 30px ${TEAM_COLORS[winner.id]?.neonColor}80`,
              }}
            >
              {winner.name}
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {winner.territoryPercent}% territory
            </div>
          </div>
        )}
      </div>
      
      {/* Team rankings */}
      <div className="w-full max-w-2xl mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 text-center">Territory Control</h2>
          <div className="space-y-3">
            {sortedTeams.map((team, index) => {
              const teamColor = TEAM_COLORS[team.id];
              const isWinner = index === 0;
              
              return (
                <div
                  key={team.id}
                  className="relative overflow-hidden rounded-xl p-4"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor.color}30, transparent)`,
                    boxShadow: isWinner ? `inset 0 0 0 2px ${teamColor.neonColor}` : 'none',
                  }}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-zinc-500">
                        #{index + 1}
                      </span>
                      <div>
                        <div
                          className="font-bold"
                          style={{ color: teamColor.neonColor }}
                        >
                          {team.name}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {team.playerIds.length} player{team.playerIds.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: teamColor.neonColor }}>
                        {team.territoryPercent}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${team.territoryPercent}%`,
                        background: teamColor.neonColor,
                        boxShadow: `0 0 10px ${teamColor.neonColor}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Personal stats */}
      <div className="w-full max-w-2xl mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 text-center">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-cyan-400">
                {localPlayer.questionsAnswered}
              </div>
              <div className="text-sm text-zinc-500">Questions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {localPlayer.correctAnswers}
              </div>
              <div className="text-sm text-zinc-500">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {localPlayer.questionsAnswered > 0
                  ? Math.round((localPlayer.correctAnswers / localPlayer.questionsAnswered) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-zinc-500">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Play again button */}
      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
        >
          🎨 PLAY AGAIN
        </button>
      )}
    </div>
  );
}
