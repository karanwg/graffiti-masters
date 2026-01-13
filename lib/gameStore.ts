'use client';

import { create } from 'zustand';
import {
  GameState,
  GamePhase,
  WallType,
  Player,
  Team,
  LocalPlayerState,
  TEAM_COLORS,
  GRID_RESOLUTION,
  GAME_DURATION,
} from './types';
import { Question } from './types';
import { getShuffledQuestions } from './questions';

interface GameStore {
  // Game state (synced across players)
  gameState: GameState;
  
  // Local player state (not synced)
  localPlayer: LocalPlayerState;
  myPlayerId: string | null;
  myPlayerName: string;
  shuffledQuestions: Question[];
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setWallType: (wallType: WallType) => void;
  setTeamCount: (count: number) => void;
  setHostId: (hostId: string) => void;
  setMyPlayerId: (id: string) => void;
  setMyPlayerName: (name: string) => void;
  
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  
  joinTeam: (playerId: string, teamId: number) => void;
  randomizeTeams: () => void;
  
  initializeGame: () => void;
  updateTimeRemaining: (time: number) => void;
  
  // Local player actions
  answerQuestion: (isCorrect: boolean) => void;
  consumePressure: (amount: number) => void;
  
  // Grid actions
  initGrid: () => void;
  updateGridCell: (x: number, y: number, teamId: number) => void;
  calculateTerritories: () => void;
  
  // Full state sync
  syncGameState: (state: GameState) => void;
  getSerializableState: () => GameState;
  
  // Reset
  resetGame: () => void;
  resetToLobby: () => void;
}

const initialGameState: GameState = {
  phase: 'lobby',
  wallType: 'school',
  timeRemaining: GAME_DURATION,
  players: [],
  teams: TEAM_COLORS.map(t => ({ ...t, playerIds: [], territoryPercent: 0 })),
  hostId: null,
  grid: null,
  teamCount: 2, // Default to 2 teams
};

const initialLocalState: LocalPlayerState = {
  currentQuestionIndex: 0,
  canType: null,
  canPressure: 0,
  hasAnswered: false,
  questionsAnswered: 0,
  correctAnswers: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: { ...initialGameState },
  localPlayer: { ...initialLocalState },
  myPlayerId: null,
  myPlayerName: '',
  shuffledQuestions: [],
  
  setPhase: (phase) =>
    set((state) => ({
      gameState: { ...state.gameState, phase },
    })),
  
  setWallType: (wallType) =>
    set((state) => ({
      gameState: { ...state.gameState, wallType },
    })),
  
  setTeamCount: (teamCount) =>
    set((state) => ({
      gameState: { ...state.gameState, teamCount: Math.max(1, Math.min(6, teamCount)) },
    })),
  
  setHostId: (hostId) =>
    set((state) => ({
      gameState: { ...state.gameState, hostId },
    })),
  
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  
  setMyPlayerName: (name) => set({ myPlayerName: name }),
  
  addPlayer: (player) =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        players: [...state.gameState.players, player],
      },
    })),
  
  removePlayer: (playerId) =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        players: state.gameState.players.filter((p) => p.id !== playerId),
        teams: state.gameState.teams.map((t) => ({
          ...t,
          playerIds: t.playerIds.filter((id) => id !== playerId),
        })),
      },
    })),
  
  updatePlayer: (playerId, updates) =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        players: state.gameState.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        ),
      },
    })),
  
  joinTeam: (playerId, teamId) =>
    set((state) => {
      // Remove player from all teams first
      const updatedTeams = state.gameState.teams.map((t) => ({
        ...t,
        playerIds: t.playerIds.filter((id) => id !== playerId),
      }));
      
      // Add to new team
      updatedTeams[teamId] = {
        ...updatedTeams[teamId],
        playerIds: [...updatedTeams[teamId].playerIds, playerId],
      };
      
      // Update player's teamId
      const updatedPlayers = state.gameState.players.map((p) =>
        p.id === playerId ? { ...p, teamId } : p
      );
      
      return {
        gameState: {
          ...state.gameState,
          teams: updatedTeams,
          players: updatedPlayers,
        },
      };
    }),
  
  // Randomly assign all players to teams based on teamCount
  randomizeTeams: () =>
    set((state) => {
      const { players, teamCount } = state.gameState;
      
      // Shuffle players
      const shuffledPlayers = [...players];
      for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
      }
      
      // Reset all teams
      const updatedTeams = state.gameState.teams.map((t) => ({
        ...t,
        playerIds: [] as string[],
      }));
      
      // Assign players to teams (round-robin for fair distribution)
      const updatedPlayers = shuffledPlayers.map((player, index) => {
        const teamId = index % teamCount;
        updatedTeams[teamId].playerIds.push(player.id);
        return { ...player, teamId };
      });
      
      return {
        gameState: {
          ...state.gameState,
          teams: updatedTeams,
          players: updatedPlayers,
        },
      };
    }),
  
  initializeGame: () => {
    const questions = getShuffledQuestions();
    set({
      shuffledQuestions: questions,
      localPlayer: { ...initialLocalState },
    });
    get().initGrid();
  },
  
  updateTimeRemaining: (time) =>
    set((state) => ({
      gameState: { ...state.gameState, timeRemaining: time },
    })),
  
  answerQuestion: (isCorrect) =>
    set((state) => ({
      localPlayer: {
        ...state.localPlayer,
        canType: isCorrect ? 'fat' : 'skinny',
        canPressure: 100,
        hasAnswered: true,
        questionsAnswered: state.localPlayer.questionsAnswered + 1,
        correctAnswers: state.localPlayer.correctAnswers + (isCorrect ? 1 : 0),
      },
    })),
  
  consumePressure: (amount) =>
    set((state) => {
      const newPressure = Math.max(0, state.localPlayer.canPressure - amount);
      const needsNextQuestion = newPressure <= 0 && state.localPlayer.canType !== null;
      
      return {
        localPlayer: {
          ...state.localPlayer,
          canPressure: newPressure,
          canType: needsNextQuestion ? null : state.localPlayer.canType,
          hasAnswered: needsNextQuestion ? false : state.localPlayer.hasAnswered,
          currentQuestionIndex: needsNextQuestion
            ? state.localPlayer.currentQuestionIndex + 1
            : state.localPlayer.currentQuestionIndex,
        },
      };
    }),
  
  initGrid: () =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        grid: new Uint8Array(GRID_RESOLUTION * GRID_RESOLUTION).fill(255), // 255 = unowned
      },
    })),
  
  updateGridCell: (x, y, teamId) =>
    set((state) => {
      if (!state.gameState.grid) return state;
      
      const grid = new Uint8Array(state.gameState.grid);
      const index = y * GRID_RESOLUTION + x;
      grid[index] = teamId;
      
      return {
        gameState: { ...state.gameState, grid },
      };
    }),
  
  calculateTerritories: () =>
    set((state) => {
      if (!state.gameState.grid) return state;
      
      const counts: number[] = new Array(6).fill(0);
      const total = GRID_RESOLUTION * GRID_RESOLUTION;
      
      for (let i = 0; i < state.gameState.grid.length; i++) {
        const teamId = state.gameState.grid[i];
        if (teamId < 6) {
          counts[teamId]++;
        }
      }
      
      const updatedTeams = state.gameState.teams.map((t, i) => ({
        ...t,
        territoryPercent: Math.round((counts[i] / total) * 1000) / 10, // 1 decimal
      }));
      
      return {
        gameState: { ...state.gameState, teams: updatedTeams },
      };
    }),
  
  syncGameState: (newState) =>
    set((state) => ({
      gameState: {
        ...newState,
        // Preserve grid as Uint8Array
        grid: newState.grid
          ? new Uint8Array(newState.grid)
          : state.gameState.grid,
      },
    })),
  
  getSerializableState: () => {
    const state = get().gameState;
    // Exclude grid from serialization - it's too large and causes stack overflow
    // Each client initializes their own grid, and spray events sync the updates
    return {
      ...state,
      grid: null, // Don't send grid - clients initialize their own
    } as GameState;
  },
  
  resetGame: () =>
    set({
      gameState: { ...initialGameState },
      localPlayer: { ...initialLocalState },
      shuffledQuestions: [],
    }),
    
  resetToLobby: () =>
    set((state) => ({
      gameState: {
        ...state.gameState,
        phase: 'lobby',
        timeRemaining: GAME_DURATION,
        grid: null,
        // Reset teams but keep players
        teams: TEAM_COLORS.map(t => ({ ...t, playerIds: [], territoryPercent: 0 })),
      },
      localPlayer: { ...initialLocalState },
      shuffledQuestions: [],
    })),
}));
