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

const ArenaPanel = () => {
  const { courts } = useCourtData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [searchParams] = useSearchParams();
  const forcedTournamentId = searchParams.get('id');

  // 1. Subscribe to active tournaments
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

  // 2. Subscribe to ALL matches and filter by active tournaments
  useEffect(() => {
    if (activeTournaments.length > 0) {
      const activeIds = activeTournaments.map(t => t.id);
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
  }, [activeTournaments]);

  // 3. Current active tournament logic
  const currentTournament = activeTournaments[currentTournamentIndex];

  // 4. Group matches by categories for the current tournament
  const categoryData = useMemo(() => {
    if (!currentTournament) return [];

    const tMatches = allMatches.filter(m => m.tournamentId === currentTournament.id);
    const officialCategories = currentTournament.categories || [];
    const tCats = officialCategories.length > 0
      ? Array.from(new Set(officialCategories))
      : Array.from(new Set(tMatches.map(m => m.category))).filter(Boolean);

    return tCats.map(cat => {
      const matches = tMatches.filter(m =>
        m.category && cat && m.category.trim().toUpperCase() === cat.trim().toUpperCase()
      ).map(m => ({
        ...m,
        courtName: courts.find(c => c.id === m.courtId)?.name
      }));

      if (matches.length === 0) return null;

      return { category: cat, matches };
    }).filter(Boolean) as { category: string, matches: any[] }[];
  }, [currentTournament, allMatches, courts]);

  // 5. Pagination logic (3 categories per page)
  const pages = useMemo(() => {
    const p = [];
    for (let i = 0; i < categoryData.length; i += 3) {
      p.push(categoryData.slice(i, i + 3));
    }
    return p;
  }, [categoryData]);

  // 6. Automatic cycling (Page -> Tournament)
  useEffect(() => {
    if (pages.length === 0) return;

    const interval = setInterval(() => {
      if (currentPageIndex < pages.length - 1) {
        // Next page of categories
        setCurrentPageIndex(prev => prev + 1);
      } else {
        // End of categories for this tournament, switch tournament
        setCurrentPageIndex(0);
        if (activeTournaments.length > 1) {
          setCurrentTournamentIndex(prev => (prev + 1) % activeTournaments.length);
        }
      }
    }, 40000); // 40 seconds per page

    return () => clearInterval(interval);
  }, [pages.length, currentPageIndex, activeTournaments.length]);

  // Reset page index if tournament changes manually or via effect
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [currentTournamentIndex]);

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden font-inter arena-theme relative">
      {/* Header - Fixed on top */}
      <div className="relative z-[100] shadow-2xl bg-[#020617]">
        <ArenaHeader
          tournamentName={currentTournament?.name || 'Beach Tennis Manager'}
          currentTime={currentTime}
        />
      </div>

      <main className="flex-1 overflow-hidden relative z-0">
        {pages.length > 0 ? (
          <div className="w-full h-full relative">
            {pages.map((page, pIdx) => (
              <div
                key={pIdx}
                className={`
                                    absolute inset-0 grid grid-cols-3 divide-x divide-white/5
                                    ${pIdx === currentPageIndex
                    ? 'animate-slide-down-in z-20'
                    : pIdx === (currentPageIndex === 0 ? pages.length - 1 : currentPageIndex - 1)
                      ? 'animate-slide-down-out z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }
                                `}
              >
                {page.map((catPage, idx) => (
                  <div key={`${catPage.category}-${idx}`} className="h-full">
                    <ArenaGridColumn
                      category={catPage.category}
                      tournamentName={currentTournament?.name || ''}
                      matches={catPage.matches}
                    />
                  </div>
                ))}

                {page.length < 3 && Array.from({ length: 3 - page.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-slate-900/10 flex items-center justify-center border-l border-white/5 opacity-5">
                    <Trophy size={60} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center space-y-8 text-center bg-slate-950/50">
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <Loader2 className="w-20 h-20 text-primary animate-spin relative z-10" />
            </div>
            <div className="space-y-4 max-w-2xl px-6">
              <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                Carregando Arena
              </h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-sm leading-relaxed">
                Sincronizando categorias, grupos e chaves em tempo real.<br />
                Por favor, aguarde o processamento inicial.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer - Fixed on bottom */}
      <div className="relative z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] bg-[#020617]">
        <SponsorBar />
      </div>
    </div>
  );
};

export default ArenaPanel;
