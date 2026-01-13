// Game Types for Graffiti Master

export type WallType = 'school' | 'subway' | 'police' | 'parking';

export type GamePhase = 'lobby' | 'playing' | 'leaderboard';

export type CanType = 'fat' | 'skinny';

export interface Player {
  id: string;
  name: string;
  teamId: number;
  score: number;
  isHost: boolean;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  neonColor: string;
  playerIds: string[];
  territoryPercent: number;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SprayEvent {
  playerId: string;
  teamId: number;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  canType: CanType;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  wallType: WallType;
  timeRemaining: number;
  players: Player[];
  teams: Team[];
  hostId: string | null;
  grid: Uint8Array | null; // Territory ownership grid
  teamCount: number; // Number of teams (1-6), host selected
}

export interface LocalPlayerState {
  currentQuestionIndex: number;
  canType: CanType | null;
  canPressure: number; // 0-100
  hasAnswered: boolean;
  questionsAnswered: number;
  correctAnswers: number;
}

// Team colors with neon variants
export const TEAM_COLORS: Team[] = [
  { id: 0, name: 'Crimson Crew', color: '#dc2626', neonColor: '#ff4444', playerIds: [], territoryPercent: 0 },
  { id: 1, name: 'Cyan Squad', color: '#0891b2', neonColor: '#00ffff', playerIds: [], territoryPercent: 0 },
  { id: 2, name: 'Lime Gang', color: '#65a30d', neonColor: '#aaff00', playerIds: [], territoryPercent: 0 },
  { id: 3, name: 'Violet Vandals', color: '#7c3aed', neonColor: '#bf00ff', playerIds: [], territoryPercent: 0 },
  { id: 4, name: 'Amber Alliance', color: '#d97706', neonColor: '#ffaa00', playerIds: [], territoryPercent: 0 },
  { id: 5, name: 'Pink Panthers', color: '#db2777', neonColor: '#ff44aa', playerIds: [], territoryPercent: 0 },
];

export const WALL_NAMES: Record<WallType, string> = {
  school: '🏫 School Bricks',
  subway: '🚇 Subway Tiles',
  police: '🚔 Police Station',
  parking: '🅿️ Parking Lot',
};

// Game constants
export const GRID_RESOLUTION = 128;
export const GAME_DURATION = 120; // seconds
export const FAT_CAP_RADIUS_MULTIPLIER = 3;
export const SKINNY_CAP_RADIUS_MULTIPLIER = 1;
export const FAT_CAP_DURATION = 5; // seconds worth of pressure
export const SKINNY_CAP_DURATION = 2;
