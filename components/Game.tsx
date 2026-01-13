'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { usePeerJS } from '@/lib/usePeerJS';
import { Lobby } from './Lobby';
import { GameCanvas } from './GameCanvas';
import { QuizPanel } from './QuizPanel';
import { PressureGauge } from './PressureGauge';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { SprayEvent, TEAM_COLORS } from '@/lib/types';

export function Game() {
  const { gameState, myPlayerId } = useGameStore();
  const [incomingSprayEvents, setIncomingSprayEvents] = useState<SprayEvent[]>([]);
  
  const handleSprayReceived = useCallback((event: SprayEvent) => {
    setIncomingSprayEvents((prev) => [...prev.slice(-100), event]);
  }, []);
  
  const { 
    isConnected, 
    isHost, 
    roomCode, 
    error, 
    createRoom,
    joinRoom,
    startGame, 
    sendSpray,
    returnToLobby,
  } = usePeerJS({
    onSprayReceived: handleSprayReceived,
  });
  
  const handleSpray = useCallback(
    (event: SprayEvent) => {
      sendSpray(event);
    },
    [sendSpray]
  );
  
  const handlePlayAgain = useCallback(() => {
    // Clear spray events
    setIncomingSprayEvents([]);
    // Return everyone to lobby
    returnToLobby();
  }, [returnToLobby]);
  
  const myTeamId = gameState.players.find((p) => p.id === myPlayerId)?.teamId ?? 0;
  const teamColor = TEAM_COLORS[myTeamId]?.neonColor ?? '#00ffff';
  
  // Lobby phase
  if (gameState.phase === 'lobby') {
    return (
      <Lobby
        isConnected={isConnected}
        isHost={isHost}
        roomCode={roomCode}
        error={error}
        createRoom={createRoom}
        joinRoom={joinRoom}
        startGame={startGame}
      />
    );
  }
  
  // Leaderboard phase
  if (gameState.phase === 'leaderboard') {
    return <Leaderboard onPlayAgain={handlePlayAgain} />;
  }
  
  // Playing phase
  return (
    <div className="flex flex-col h-screen p-2 sm:p-4 gap-3">
      {/* Top bar: Timer and team indicator */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div
          className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2"
          style={{
            borderColor: teamColor,
            borderWidth: 2,
            boxShadow: `0 0 20px ${teamColor}30`,
          }}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: teamColor, boxShadow: `0 0 10px ${teamColor}` }}
          />
          <span className="font-bold" style={{ color: teamColor }}>
            {TEAM_COLORS[myTeamId]?.name ?? 'Team'}
          </span>
        </div>
        
        <Timer />
        
        <div className="glass-panel px-4 py-2 rounded-xl text-sm text-zinc-400">
          {gameState.players.length} players
        </div>
      </div>
      
      {/* Canvas area - takes most of the space */}
      <div className="flex-grow min-h-0 relative">
        <GameCanvas onSpray={handleSpray} incomingSprayEvents={incomingSprayEvents} />
      </div>
      
      {/* Bottom panel: Pressure gauge and Quiz */}
      <div className="flex-shrink-0 space-y-3">
        <PressureGauge />
        <QuizPanel />
      </div>
    </div>
  );
}
