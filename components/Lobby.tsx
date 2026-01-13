'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { TEAM_COLORS, WALL_NAMES, WallType } from '@/lib/types';

interface LobbyProps {
  isConnected: boolean;
  isHost: boolean;
  roomCode: string | null;
  error: string | null;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
}

export function Lobby({
  isConnected,
  isHost,
  roomCode,
  error,
  createRoom,
  joinRoom,
  startGame,
}: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [isCreating, setIsCreating] = useState(false);
  const joinInputRef = useRef<HTMLInputElement>(null);
  
  const { gameState, setWallType, setTeamCount, setMyPlayerName } = useGameStore();
  
  const handleHost = () => {
    setMyPlayerName(playerName || 'Host');
    setIsCreating(true);
    createRoom();
  };
  
  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Check both React state and DOM value (for browser automation compatibility)
    const code = joinCode.trim() || joinInputRef.current?.value.trim() || '';
    if (!code) return;
    setMyPlayerName(playerName || `Player`);
    setIsCreating(true);
    joinRoom(code.toUpperCase());
  };
  
  // Reset isCreating on error
  useEffect(() => {
    if (error) {
      setIsCreating(false);
    }
  }, [error]);
  
  const canStart = gameState.players.length >= 1;
  
  // Show lobby once connected
  if (isConnected && roomCode) {
    return (
      <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
        {/* Header */}
        <div className="w-full max-w-4xl mb-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">Room Code</h1>
              <p className="text-4xl font-mono font-bold tracking-widest text-white">
                {roomCode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400">
                {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} connected
              </p>
              {isHost && (
                <span className="inline-block px-3 py-1 bg-purple-600 rounded-full text-sm font-medium mt-1">
                  👑 You are the Host
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Wall Selection (Host only) */}
        {isHost && (
          <div className="w-full max-w-4xl mb-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">Select Wall</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(WALL_NAMES) as WallType[]).map((wall) => (
                  <button
                    key={wall}
                    onClick={() => setWallType(wall)}
                    className={`p-4 rounded-xl font-medium transition-all ${
                      gameState.wallType === wall
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {WALL_NAMES[wall]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Team Count Selection (Host only) */}
        {isHost && (
          <div className="w-full max-w-4xl mb-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-2">Number of Teams</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Players will be randomly assigned to teams when the game starts
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTeamCount(count)}
                    className={`w-14 h-14 rounded-xl font-bold text-xl transition-all ${
                      gameState.teamCount === count
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-110'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              
              {/* Preview of teams that will be used */}
              <div className="mt-4 flex gap-2 justify-center flex-wrap">
                {Array.from({ length: gameState.teamCount }).map((_, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${TEAM_COLORS[i].color}30`,
                      color: TEAM_COLORS[i].neonColor,
                      border: `1px solid ${TEAM_COLORS[i].neonColor}`,
                    }}
                  >
                    {TEAM_COLORS[i].name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Players List */}
        <div className="w-full max-w-4xl mb-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Players in Lobby</h2>
            <div className="flex flex-wrap gap-3">
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl"
                >
                  {player.isHost && <span className="text-yellow-500">👑</span>}
                  <span className="font-medium">{player.name}</span>
                </div>
              ))}
              {gameState.players.length === 0 && (
                <p className="text-zinc-500">Waiting for players to join...</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Start Button (Host only) */}
        {isHost && (
          <div className="w-full max-w-4xl">
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full py-5 rounded-2xl font-bold text-xl transition-all ${
                canStart
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/30 hover:scale-[1.02]'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {canStart ? '🎯 START GAME' : 'Waiting for players...'}
            </button>
          </div>
        )}
        
        {!isHost && (
          <div className="w-full max-w-4xl">
            <div className="glass-panel p-6 rounded-2xl text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-zinc-400">
                Waiting for host to start the game...
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                {gameState.teamCount} team{gameState.teamCount !== 1 ? 's' : ''} • {WALL_NAMES[gameState.wallType]}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Initial selection screen
  if (mode === 'select') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black tracking-tighter mb-2 graffiti-title">
            GRAFFITI
          </h1>
          <h2 className="text-4xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">
            MASTER
          </h2>
        </div>
        
        {/* Name input */}
        <div className="w-full max-w-sm mb-8">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-6 py-4 bg-zinc-900/80 backdrop-blur-xl border-2 border-zinc-700 rounded-xl text-white text-lg placeholder-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            onClick={() => setMode('host')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
          >
            🎨 HOST GAME
          </button>
          <button
            onClick={() => setMode('join')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-cyan-500/50"
          >
            🚀 JOIN GAME
          </button>
        </div>
      </div>
    );
  }
  
  // Host mode - creating room
  if (mode === 'host') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isCreating ? 'Creating Room...' : 'Host a Game'}
          </h2>
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}
          {isCreating ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button
              onClick={handleHost}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all"
            >
              Create Room
            </button>
          )}
          <button
            onClick={() => { setMode('select'); setIsCreating(false); }}
            className="w-full mt-4 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }
  
  // Join mode
  if (mode === 'join') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isCreating ? 'Joining Room...' : 'Join Game'}
          </h2>
          <form onSubmit={handleJoin}>
            <input
              ref={joinInputRef}
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code..."
              maxLength={6}
              disabled={isCreating}
              className="w-full px-6 py-4 bg-zinc-900/80 border-2 border-zinc-700 rounded-xl text-white text-2xl text-center tracking-widest font-mono placeholder-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors mb-4 disabled:opacity-50"
            />
            {error && (
              <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
            )}
            {isCreating ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg transition-all"
              >
                Join Room
              </button>
            )}
          </form>
          <button
            onClick={() => { setMode('select'); setIsCreating(false); setJoinCode(''); }}
            className="w-full mt-4 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}
