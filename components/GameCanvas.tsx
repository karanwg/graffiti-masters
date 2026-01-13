'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { generateWall } from '@/lib/wallGenerator';
import {
  spray,
  updateDrips,
  initSprayEngine,
  clearDrips,
} from '@/lib/sprayEngine';
import {
  startSpraySound,
  stopSpraySound,
  updateSpraySound,
  triggerHaptic,
} from '@/lib/audioEngine';
import { SprayEvent, TEAM_COLORS } from '@/lib/types';

interface GameCanvasProps {
  onSpray?: (event: SprayEvent) => void;
  incomingSprayEvents?: SprayEvent[];
}

export function GameCanvas({ onSpray, incomingSprayEvents = [] }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);
  const processedEventsRef = useRef<Set<number>>(new Set());
  const sprayHistoryRef = useRef<SprayEvent[]>([]); // Store all spray events for replay on resize
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  const {
    gameState,
    localPlayer,
    myPlayerId,
    consumePressure,
    updateGridCell,
  } = useGameStore();
  
  const myTeamId = gameState.players.find((p) => p.id === myPlayerId)?.teamId ?? 0;
  const teamColor = TEAM_COLORS[myTeamId]?.neonColor ?? '#00ffff';
  
  // Initialize canvas and wall
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Generate wall texture when dimensions or wall type change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    wallCanvasRef.current = generateWall(
      gameState.wallType,
      dimensions.width,
      dimensions.height
    );
    
    initSprayEngine(gameState.wallType, dimensions.height);
    clearDrips();
    
    // Draw initial wall
    const canvas = canvasRef.current;
    if (canvas && wallCanvasRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(wallCanvasRef.current, 0, 0);
        
        // Replay all spray history after resize
        sprayHistoryRef.current.forEach((event) => {
          const x = event.x * canvas.width;
          const y = event.y * canvas.height;
          const eventTeamColor = TEAM_COLORS[event.teamId]?.neonColor ?? '#ffffff';
          
          spray(ctx, x, y, event.canType, eventTeamColor, gameState.wallType, true, 0.016);
        });
      }
    }
  }, [dimensions, gameState.wallType]);
  
  // Handle incoming spray events from other players
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    incomingSprayEvents.forEach((event) => {
      // Skip already processed events
      if (processedEventsRef.current.has(event.timestamp)) return;
      processedEventsRef.current.add(event.timestamp);
      
      // Store in history for replay on resize
      sprayHistoryRef.current.push(event);
      
      // Limit history size to prevent memory issues
      if (sprayHistoryRef.current.length > 5000) {
        sprayHistoryRef.current = sprayHistoryRef.current.slice(-4000);
      }
      
      // Limit processed events set size
      if (processedEventsRef.current.size > 1000) {
        const oldest = Array.from(processedEventsRef.current).slice(0, 500);
        oldest.forEach((t) => processedEventsRef.current.delete(t));
      }
      
      const x = event.x * canvas.width;
      const y = event.y * canvas.height;
      const eventTeamColor = TEAM_COLORS[event.teamId]?.neonColor ?? '#ffffff';
      
      spray(ctx, x, y, event.canType, eventTeamColor, gameState.wallType, true, 0.016);
    });
  }, [incomingSprayEvents, gameState.wallType]);
  
  // Get mouse/touch position relative to canvas
  const getPosition = useCallback(
    (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );
  
  // Handle spray painting
  const handleSpray = useCallback(
    (x: number, y: number, isStart: boolean = false) => {
      const canvas = canvasRef.current;
      if (!canvas || !localPlayer.canType || localPlayer.canPressure <= 0) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      
      // Spray effect
      const { gridUpdates } = spray(
        ctx,
        x,
        y,
        localPlayer.canType,
        teamColor,
        gameState.wallType,
        true,
        0.016
      );
      
      // Update grid ownership
      gridUpdates.forEach(({ gx, gy }) => {
        updateGridCell(gx, gy, myTeamId);
      });
      
      // Consume pressure - both caps last ~1.5 seconds
      const drainRate = 1.1;
      consumePressure(drainRate);
      
      // Haptic feedback
      triggerHaptic([5]);
      
      // Create spray event
      const event: SprayEvent = {
        playerId: myPlayerId!,
        teamId: myTeamId,
        x: x / canvas.width, // Normalize to 0-1
        y: y / canvas.height,
        canType: localPlayer.canType,
        timestamp: Date.now(),
      };
      
      // Store in history for replay on resize
      sprayHistoryRef.current.push(event);
      
      // Limit history size
      if (sprayHistoryRef.current.length > 5000) {
        sprayHistoryRef.current = sprayHistoryRef.current.slice(-4000);
      }
      
      // Send spray event to other players
      if (onSpray) {
        onSpray(event);
      }
    },
    [
      localPlayer.canType,
      localPlayer.canPressure,
      teamColor,
      gameState.wallType,
      updateGridCell,
      myTeamId,
      consumePressure,
      onSpray,
      myPlayerId,
    ]
  );
  
  // Mouse/touch handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isMouseDownRef.current = true;
      
      const pos = getPosition(e.nativeEvent);
      if (pos) {
        handleSpray(pos.x, pos.y, true);
        startSpraySound(localPlayer.canType === 'fat' ? 1 : 0.6);
      }
    },
    [getPosition, handleSpray, localPlayer.canType]
  );
  
  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMouseDownRef.current) return;
      e.preventDefault();
      
      const pos = getPosition(e.nativeEvent);
      if (pos) {
        handleSpray(pos.x, pos.y, false);
        updateSpraySound(localPlayer.canPressure / 100);
      }
    },
    [getPosition, handleSpray, localPlayer.canPressure]
  );
  
  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    stopSpraySound();
  }, []);
  
  // Animation loop for drips
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = (time: number) => {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      // Update and draw drips
      updateDrips(ctx, deltaTime, gameState.wallType);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.wallType]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpraySound();
    };
  }, []);
  
  const canPaint = localPlayer.canType !== null && localPlayer.canPressure > 0;
  
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden"
      style={{
        boxShadow: canPaint ? `0 0 30px ${teamColor}40` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`w-full h-full ${canPaint ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        onMouseDown={canPaint ? handleMouseDown : undefined}
        onMouseMove={canPaint ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={canPaint ? handleMouseDown : undefined}
        onTouchMove={canPaint ? handleMouseMove : undefined}
        onTouchEnd={handleMouseUp}
      />
      
      {/* Overlay when can't paint */}
      {!canPaint && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="glass-panel px-6 py-3 rounded-xl text-zinc-300 text-sm">
            Answer a question to spray!
          </div>
        </div>
      )}
    </div>
  );
}
