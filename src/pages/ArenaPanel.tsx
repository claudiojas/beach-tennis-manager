import { useState, useEffect, useMemo } from 'react';
import { ArenaHeader } from '@/components/ArenaHeader';
import { ResultsTicker } from '@/components/ResultsTicker';
import { SponsorBar } from '@/components/SponsorBar';
import { useCourtData } from '@/hooks/useCourtData';
import { Clock } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { matchService } from '@/services/matchService';
import { Tournament, Match } from '@/types/beach-tennis';
import { ArenaCategoryDashboard } from '@/components/arena/ArenaCategoryDashboard';

const ArenaPanel = () => {
  const { results, courts } = useCourtData();
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Fetch active tournament and matches
  useEffect(() => {
    const unsubTournament = tournamentService.subscribe((tournaments) => {
      const active = tournaments.find(t => t.status === 'active') || tournaments[0];
      setActiveTournament(active);
    });
    return () => unsubTournament();
  }, []);

  useEffect(() => {
    if (activeTournament) {
      const unsubMatches = matchService.subscribeByTournament(activeTournament.id, setMatches);
      return () => unsubMatches();
    }
  }, [activeTournament]);

  // Group everything by category for the "Airport" slides
  const categorySlides = useMemo(() => {
    if (!activeTournament || matches.length === 0) return [];

    // Fallback para torneios antigos que não tem categorias no banco
    const activeCategories = activeTournament.categories && activeTournament.categories.length > 0
      ? activeTournament.categories
      : Array.from(new Set(matches.map(m => m.category))).filter(Boolean);

    return activeCategories.map(cat => {
      const catMatches = matches.filter(m => m.category.toUpperCase() === cat.toUpperCase());
      if (catMatches.length === 0) return null;

      // Sort matches for the airport list: Ongoing first, then Planned, then Finished
      const sortedMatches = [...catMatches].sort((a, b) => {
        const order = { ongoing: 0, planned: 1, finished: 2 };
        return order[a.status] - order[b.status];
      });

      return {
        category: cat,
        matches: sortedMatches.map(m => ({
          ...m,
          courtName: courts.find(c => c.id === m.courtId)?.name
        }))
      };
    }).filter(Boolean) || [];
  }, [activeTournament, matches, courts]);

  // Automatic Rotation between categories
  useEffect(() => {
    if (categorySlides.length <= 1) {
      setActiveCategoryIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveCategoryIndex(prev => (prev + 1) % categorySlides.length);
    }, 30000); // 30 seconds per category dashboard for enough analysis
    return () => clearInterval(interval);
  }, [categorySlides.length]);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white overflow-hidden font-inter arena-theme">
      {/* Header */}
      <ArenaHeader tournamentName={activeTournament?.name || 'Beach Tennis Manager'} />
      <SponsorBar />

      <main className="flex-1 flex flex-col p-4 sm:p-8 pt-4 overflow-hidden relative">
        {categorySlides.length > 0 ? (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Transition Container */}
            {categorySlides.map((slide, idx) => (
              <div
                key={slide!.category}
                className={`
                    absolute inset-0 transition-all duration-1000 flex flex-col
                    ${idx === activeCategoryIndex
                    ? 'opacity-100 translate-x-0 z-10 scale-100'
                    : 'opacity-0 -translate-x-full z-0 scale-95 pointer-events-none'}
                `}
              >
                <ArenaCategoryDashboard
                  category={slide!.category}
                  matches={slide!.matches}
                  tournamentId={activeTournament!.id}
                />
              </div>
            ))}


          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-1000">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              <div className="w-32 h-32 rounded-[2rem] border-4 border-dashed border-primary/20 flex items-center justify-center relative z-10">
                <Clock className="w-14 h-14 text-primary/40 animate-[spin_10s_linear_infinite]" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Processando Terminal</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm leading-relaxed">
                Sincronizando todas as categorias e grupos.<br />
                O telão de operações aparecerá em segundos.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Results Ticker */}
      <ResultsTicker results={results} />
    </div>
  );
};

export default ArenaPanel;
