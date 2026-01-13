'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useGameStore } from './gameStore';
import { SprayEvent, GameState, Player, GAME_DURATION } from './types';

type MessageType =
  | { type: 'sync_state'; state: GameState }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string }
  | { type: 'spray'; event: SprayEvent }
  | { type: 'start_game'; state: GameState }
  | { type: 'time_update'; time: number }
  | { type: 'game_end' }
  | { type: 'request_state' };

interface UsePeerJSOptions {
  onSprayReceived?: (event: SprayEvent) => void;
}

export function usePeerJS(options: UsePeerJSOptions = {}) {
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const timerRef = useRef<number | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  
  const {
    gameState,
    myPlayerId,
    myPlayerName,
    setMyPlayerId,
    setHostId,
    addPlayer,
    removePlayer,
    setPhase,
    updateTimeRemaining,
    syncGameState,
    getSerializableState,
    initializeGame,
    calculateTerritories,
    randomizeTeams,
  } = useGameStore();
  
  const isHost = gameState.hostId === myPlayerId;
  
  // Broadcast message to all connections (host only)
  const broadcast = useCallback((message: MessageType) => {
    console.log('Broadcasting message:', message.type, 'to', connectionsRef.current.size, 'connections');
    connectionsRef.current.forEach((conn, id) => {
      console.log('  -> Connection', id, 'open:', conn.open);
      if (conn.open) {
        try {
          conn.send(message);
          console.log('  -> Sent successfully to', id);
        } catch (err) {
          console.error('  -> Failed to send to', id, err);
        }
      }
    });
  }, []);
  
  // Send message to host (client only)
  const sendToHost = useCallback((message: MessageType) => {
    const hostConn = connectionsRef.current.get('host');
    if (hostConn?.open) {
      hostConn.send(message);
    }
  }, []);
  
  // Handle incoming messages
  const handleMessage = useCallback(
    (message: MessageType, fromId: string) => {
      const store = useGameStore.getState();
      const currentIsHost = store.gameState.hostId === store.myPlayerId;
      
      switch (message.type) {
        case 'sync_state':
          syncGameState(message.state);
          break;
          
        case 'player_joined':
          addPlayer(message.player);
          // If host, broadcast updated state to all clients
          if (currentIsHost) {
            setTimeout(() => {
              const updatedState = useGameStore.getState().getSerializableState();
              broadcast({ type: 'sync_state', state: updatedState });
            }, 50);
          }
          break;
          
        case 'player_left':
          removePlayer(message.playerId);
          break;
          
        case 'spray':
          options.onSprayReceived?.(message.event);
          // If host, relay to all other clients
          if (currentIsHost) {
            connectionsRef.current.forEach((conn, id) => {
              if (id !== fromId && conn.open) {
                conn.send(message);
              }
            });
          }
          break;
          
        case 'start_game':
          // Client receives game start with full state including team assignments
          syncGameState(message.state);
          initializeGame();
          setPhase('playing');
          break;
          
        case 'time_update':
          updateTimeRemaining(message.time);
          break;
          
        case 'game_end':
          calculateTerritories();
          setPhase('leaderboard');
          break;
          
        case 'request_state':
          if (currentIsHost) {
            const conn = connectionsRef.current.get(fromId);
            if (conn?.open) {
              conn.send({ type: 'sync_state', state: useGameStore.getState().getSerializableState() });
            }
          }
          break;
      }
    },
    [
      syncGameState,
      addPlayer,
      removePlayer,
      setPhase,
      updateTimeRemaining,
      calculateTerritories,
      initializeGame,
      broadcast,
      options,
    ]
  );
  
  // Set up connection handlers
  const setupConnection = useCallback(
    (conn: DataConnection, isHostConnection: boolean = false) => {
      const handleOpen = () => {
        console.log('Connection opened:', conn.peer);
        
        if (isHostConnection) {
          // Client connected to host
          connectionsRef.current.set('host', conn);
          
          // Get current player info
          const store = useGameStore.getState();
          const playerName = store.myPlayerName || `Player ${store.myPlayerId?.slice(-4)}`;
          
          // Send join request
          conn.send({
            type: 'player_joined',
            player: {
              id: store.myPlayerId!,
              name: playerName,
              teamId: -1,
              score: 0,
              isHost: false,
            },
          } as MessageType);
          
          // Request current state
          conn.send({ type: 'request_state' } as MessageType);
          
          setIsConnected(true);
        } else {
          // Host: new client connected
          connectionsRef.current.set(conn.peer, conn);
          console.log('Host stored connection for:', conn.peer, 'Total connections:', connectionsRef.current.size);
        }
      };
      
      // Handle case where connection is already open
      if (conn.open) {
        handleOpen();
      } else {
        conn.on('open', handleOpen);
      }
      
      conn.on('data', (data) => {
        handleMessage(data as MessageType, conn.peer);
      });
      
      conn.on('close', () => {
        console.log('Connection closed:', conn.peer);
        connectionsRef.current.delete(isHostConnection ? 'host' : conn.peer);
        
        const store = useGameStore.getState();
        const currentIsHost = store.gameState.hostId === store.myPlayerId;
        
        if (!isHostConnection && currentIsHost) {
          // Host: broadcast player left
          removePlayer(conn.peer);
          broadcast({ type: 'player_left', playerId: conn.peer });
        }
      });
      
      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setError(`Connection error: ${err.message}`);
      });
    },
    [handleMessage, broadcast, removePlayer]
  );
  
  // Create room (become host)
  const createRoom = useCallback(() => {
    // Generate a random 6-character room code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const peer = new Peer(code, {
      debug: 2,
    });
    
    peer.on('open', (id) => {
      console.log('Host peer opened with ID:', id);
      peerRef.current = peer;
      
      const store = useGameStore.getState();
      const playerName = store.myPlayerName || 'Host';
      
      setMyPlayerId(id);
      setHostId(id);
      setRoomCode(id);
      setIsConnected(true);
      
      // Add self as player
      addPlayer({
        id,
        name: playerName,
        teamId: -1,
        score: 0,
        isHost: true,
      });
    });
    
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      setupConnection(conn);
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(`Failed to create room: ${err.message}`);
    });
    
    return code;
  }, [setMyPlayerId, setHostId, addPlayer, setupConnection]);
  
  // Join room (become client)
  const joinRoom = useCallback(
    (code: string) => {
      setError(null);
      const myId = Math.random().toString(36).substring(2, 10);
      
      const peer = new Peer(myId, {
        debug: 2,
      });
      
      peer.on('open', (id) => {
        console.log('Client peer opened with ID:', id);
        peerRef.current = peer;
        setMyPlayerId(id);
        setRoomCode(code.toUpperCase());
        
        // Connect to host
        const conn = peer.connect(code.toUpperCase(), {
          reliable: true,
        });
        
        setupConnection(conn, true);
      });
      
      peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'peer-unavailable') {
          setError('Room not found. Check the code and try again.');
        } else {
          setError(`Failed to join room: ${err.message}`);
        }
      });
    },
    [setMyPlayerId, setupConnection]
  );
  
  // Start game (host only)
  const startGame = useCallback(() => {
    // Get fresh state from store
    const state = useGameStore.getState();
    const currentIsHost = state.gameState.hostId === state.myPlayerId;
    
    if (!currentIsHost) {
      return;
    }
    
    // Randomize team assignments first
    randomizeTeams();
    
    // Initialize game
    initializeGame();
    setPhase('playing');
    
    // Get updated state with team assignments and broadcast
    setTimeout(() => {
      const gameState = useGameStore.getState().getSerializableState();
      console.log('Broadcasting start_game to', connectionsRef.current.size, 'connections');
      broadcast({ type: 'start_game', state: gameState });
      
      // Start timer using window.setInterval for reliability
      let timeRemaining = GAME_DURATION;
      
      const tick = () => {
        timeRemaining--;
        useGameStore.getState().updateTimeRemaining(timeRemaining);
        broadcast({ type: 'time_update', time: timeRemaining });
        
        if (timeRemaining <= 0) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          useGameStore.getState().calculateTerritories();
          useGameStore.getState().setPhase('leaderboard');
          broadcast({ type: 'game_end' });
        }
      };
      
      timerRef.current = window.setInterval(tick, 1000);
    }, 50);
  }, [initializeGame, setPhase, broadcast, randomizeTeams]);
  
  // Send spray event
  const sendSpray = useCallback(
    (event: SprayEvent) => {
      const message: MessageType = { type: 'spray', event };
      const state = useGameStore.getState();
      const currentIsHost = state.gameState.hostId === state.myPlayerId;
      
      if (currentIsHost) {
        // Broadcast to all clients
        broadcast(message);
      } else {
        // Send to host for relay
        sendToHost(message);
      }
    },
    [broadcast, sendToHost]
  );
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      connectionsRef.current.forEach((conn) => conn.close());
      peerRef.current?.destroy();
    };
  }, []);
  
  return {
    isConnected,
    isHost,
    roomCode,
    error,
    createRoom,
    joinRoom,
    startGame,
    sendSpray,
  };
}
