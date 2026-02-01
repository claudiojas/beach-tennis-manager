import { useState, useCallback } from 'react';
import { Court, MatchResult } from '@/types/beach-tennis';

// Mock data for demonstration
const initialCourts: Court[] = [
  {
    id: '1',
    name: 'Quadra 1',
    status: 'em_jogo',
    currentMatch: {
      id: 'm1',
      teamA: {
        player1: { id: 'p1', name: 'João' },
        player2: { id: 'p2', name: 'Maria' },
      },
      teamB: {
        player1: { id: 'p3', name: 'Pedro' },
        player2: { id: 'p4', name: 'Ana' },
      },
      scoreA: 15,
      scoreB: 12,
      startTime: new Date(),
    },
  },
  {
    id: '2',
    name: 'Quadra 2',
    status: 'em_jogo',
    currentMatch: {
      id: 'm2',
      teamA: {
        player1: { id: 'p5', name: 'Lucas' },
        player2: { id: 'p6', name: 'Sofia' },
      },
      teamB: {
        player1: { id: 'p7', name: 'Bruno' },
        player2: { id: 'p8', name: 'Clara' },
      },
      scoreA: 21,
      scoreB: 18,
      startTime: new Date(),
    },
  },
  {
    id: '3',
    name: 'Quadra 3',
    status: 'manutencao',
  },
  {
    id: '4',
    name: 'Quadra 4',
    status: 'livre',
  },
];

const initialResults: MatchResult[] = [
  {
    courtId: '4',
    courtName: 'Q4',
    teamANames: 'Dupla E',
    teamBNames: 'Dupla F',
    scoreA: 6,
    scoreB: 4,
    endTime: new Date(),
  },
  {
    courtId: '3',
    courtName: 'Q3',
    teamANames: 'Dupla G',
    teamBNames: 'Dupla H',
    scoreA: 7,
    scoreB: 5,
    endTime: new Date(),
  },
];

export const useCourtData = () => {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [results] = useState<MatchResult[]>(initialResults);

  const updateScore = useCallback((courtId: string, team: 'A' | 'B', delta: number) => {
    setCourts((prevCourts) =>
      prevCourts.map((court) => {
        if (court.id !== courtId || !court.currentMatch) return court;
        
        const scoreKey = team === 'A' ? 'scoreA' : 'scoreB';
        const newScore = Math.max(0, court.currentMatch[scoreKey] + delta);
        
        return {
          ...court,
          currentMatch: {
            ...court.currentMatch,
            [scoreKey]: newScore,
          },
        };
      })
    );
  }, []);

  const togglePause = useCallback((courtId: string) => {
    setCourts((prevCourts) =>
      prevCourts.map((court) => {
        if (court.id !== courtId) return court;
        
        return {
          ...court,
          status: court.status === 'pausada' ? 'em_jogo' : 'pausada',
        };
      })
    );
  }, []);

  const resetScore = useCallback((courtId: string) => {
    setCourts((prevCourts) =>
      prevCourts.map((court) => {
        if (court.id !== courtId || !court.currentMatch) return court;
        
        return {
          ...court,
          currentMatch: {
            ...court.currentMatch,
            scoreA: 0,
            scoreB: 0,
          },
        };
      })
    );
  }, []);

  return {
    courts,
    results,
    updateScore,
    togglePause,
    resetScore,
  };
};
