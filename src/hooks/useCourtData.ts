import { useState, useEffect, useCallback } from 'react';
import { Court, MatchResult } from '@/types/beach-tennis';
import { courtService } from '@/services/courtService';

export const useCourtData = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeCourts = courtService.subscribeToCourts((data) => {
      setCourts(data);
      setLoading(false);
    });

    const unsubscribeResults = courtService.subscribeToResults((data) => {
      setResults(data);
    });

    return () => {
      unsubscribeCourts();
      unsubscribeResults();
    };
  }, []);

  const updateScore = useCallback((courtId: string, team: 'A' | 'B', delta: number) => {
    const court = courts.find(c => c.id === courtId);
    if (!court?.currentMatch) return;

    const scoreKey = team === 'A' ? 'scoreA' : 'scoreB';
    const newScore = Math.max(0, (court.currentMatch[scoreKey] || 0) + delta);

    courtService.updateScore(courtId, {
      [scoreKey]: newScore
    });
  }, [courts]);

  const togglePause = useCallback((courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;

    const newStatus = court.status === 'pausada' ? 'em_jogo' : 'pausada';
    courtService.updateStatus(courtId, newStatus);
  }, [courts]);

  const resetScore = useCallback((courtId: string) => {
    courtService.updateScore(courtId, {
      scoreA: 0,
      scoreB: 0
    });
  }, []);

  return {
    courts,
    results,
    loading,
    updateScore,
    togglePause,
    resetScore,
  };
};
