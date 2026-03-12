import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArenaHeader } from '@/components/ArenaHeader';
import { SponsorBar } from '@/components/SponsorBar';
import { useCourtData } from '@/hooks/useCourtData';
import { Loader2, Trophy } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { Tournament, Match } from '@/types/beach-tennis';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { ArenaGridColumn } from '@/components/ArenaGridColumn';
import { motion, AnimatePresence } from 'framer-motion';

const ArenaPanel = () => {
  const { courts } = useCourtData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);
  const [runIndex, setRunIndex] = useState(0);
  const [arenaLogo, setArenaLogo] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [searchParams] = useSearchParams();
  const forcedTournamentId = searchParams.get('id');

  useEffect(() => {
    const unsubTournament = tournamentService.subscribe((tournaments) => {
      let selected: Tournament[] = [];
      if (forcedTournamentId) {
        const found = tournaments.find(t => t.id === forcedTournamentId);
        if (found) selected = [found];
      }
      if (selected.length === 0) {
        selected = tournaments.filter(t => t.status === 'active');
        if (selected.length === 0 && tournaments.length > 0) {
          selected = [tournaments[0]];
        }
      }
      setActiveTournaments(selected);
    });
    return () => unsubTournament();
  }, [forcedTournamentId]);

  const activeIdsStr = useMemo(() => activeTournaments.map(t => t.id).sort().join(','), [activeTournaments]);

  useEffect(() => {
    if (activeIdsStr) {
      const activeIds = activeIdsStr.split(',');
      const matchesRef = ref(db, 'matches');
      const unsubscribe = onValue(matchesRef, (snapshot) => {
        const data = snapshot.val();
        const list: Match[] = data ? Object.values(data) : [];
        const filtered = list.filter(m => activeIds.includes(m.tournamentId));
        setAllMatches(filtered);
      });
      return () => unsubscribe();
    } else {
      setAllMatches([]);
    }
  }, [activeIdsStr]);

  const currentTournament = activeTournaments[currentTournamentIndex];

  // Fetch Arena Logo for the current tournament
  useEffect(() => {
    if (currentTournament?.arenaId || currentTournament?.location) {
      // Se não temos arenaId, buscamos no nó raiz de arenas para tentar o match por nome
      const arenaPath = currentTournament.arenaId
        ? `arenas/${currentTournament.arenaId}`
        : 'arenas';

      const arenaRef = ref(db, arenaPath);
      const unsubscribe = onValue(arenaRef, (snapshot) => {
        const data = snapshot.val();
        if (currentTournament.arenaId) {
          setArenaLogo(data?.logoUrl || null);
        } else if (data) {
          // Fallback legado: buscar arena pelo nome da localização
          const arenas = Object.values(data) as any[];
          const matchedArena = arenas.find(a => a.name === currentTournament.location);
          setArenaLogo(matchedArena?.logoUrl || null);
        } else {
          setArenaLogo(null);
        }
      });
      return () => unsubscribe();
    } else {
      setArenaLogo(null);
    }
  }, [currentTournament?.arenaId, currentTournament?.location]);

  const categoryData = useMemo(() => {
    if (!currentTournament) return [];
    const tMatches = allMatches.filter(m => m.tournamentId === currentTournament.id);
    const officialCategories = currentTournament.categories || [];
    const tCats = officialCategories.length > 0
      ? Array.from(new Set(officialCategories))
      : Array.from(new Set(tMatches.map(m => m.category))).filter(Boolean);

    return tCats.map(cat => {
      const normalizedCat = cat.trim().toUpperCase();
      const matches = tMatches.filter(m => {
        if (!m.category) return false;
        const mCat = m.category.trim().toUpperCase();
        return mCat === normalizedCat || mCat.includes(normalizedCat) || normalizedCat.includes(mCat);
      }).map(m => ({
        ...m,
        courtName: courts.find(c => c.id === m.courtId)?.name
      }));
      if (matches.length === 0) return null;
      return { category: cat, matches };
    }).filter(Boolean) as { category: string, matches: any[] }[];
  }, [currentTournament, allMatches, courts]);

  // Todas as linhas de categorias do torneio (cada linha = até 3 colunas)
  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < categoryData.length; i += 3) {
      r.push(categoryData.slice(i, i + 3));
    }
    return r;
  }, [categoryData]);

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden font-inter arena-theme relative">
      <div className="relative z-[100] shadow-2xl bg-[#020617]">
        <ArenaHeader
          tournamentName={currentTournament?.name || 'Beach Tennis Manager'}
          location={currentTournament?.location}
          logoUrl={arenaLogo || undefined}
          currentTime={currentTime}
        />
      </div>

      <main className="flex-1 overflow-hidden relative z-0">
        <AnimatePresence mode="wait">
          {rows.length > 0 ? (
            <motion.div
              key={`arena-${currentTournament?.id ?? 'none'}-${runIndex}`}
              initial={{ y: 0 }}
              animate={{ y: '-100%' }}
              transition={{
                duration: 30,
                delay: 3,
                ease: 'linear',
              }}
              onAnimationComplete={() => {
                if (activeTournaments.length > 1) {
                  setCurrentTournamentIndex(prev => (prev + 1) % activeTournaments.length);
                } else {
                  setRunIndex(prev => prev + 1);
                }
              }}
              className="w-full flex flex-col"
            >
              {rows.map((row, rowIdx) => (
                <div
                  key={`row-${rowIdx}`}
                  className="grid grid-cols-3"
                >
                  {row.map((catPage, idx) => (
                    <div key={`${catPage.category}-${idx}`} className="h-full">
                      <ArenaGridColumn
                        category={catPage.category}
                        tournamentName={currentTournament?.name || ''}
                        matches={catPage.matches}
                      />
                    </div>
                  ))}
                  {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                    <div key={`empty-${rowIdx}-${i}`} className="bg-slate-900/10 flex items-center justify-center opacity-5">
                      <Trophy size={60} />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : (
            <div key="loading" className="flex-1 h-full flex flex-col items-center justify-center space-y-8 text-center bg-slate-950/50">
              <div className="relative">
                <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <Loader2 className="w-20 h-20 text-primary animate-spin relative z-10" />
              </div>
              <div className="space-y-4 max-w-2xl px-6">
                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                  Carregando Arena
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-sm leading-relaxed">
                  Sincronizando categorias, grupos e chaves em tempo real.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <div className="relative z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] bg-[#020617]">
        <SponsorBar />
      </div>
    </div>
  );
};

export default ArenaPanel;
