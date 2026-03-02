import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArenaHeader } from '@/components/ArenaHeader';
import { SponsorBar } from '@/components/SponsorBar';
import { useCourtData } from '@/hooks/useCourtData';
import { Clock } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { matchService } from '@/services/matchService';
import { Tournament, Match } from '@/types/beach-tennis';
import { ArenaCategoryDashboard } from '@/components/arena/ArenaCategoryDashboard';
import { HeadCategorie } from '@/components/arena/HeadCategorie';
import { ref, onValue } from 'firebase/database'; // Added for direct Firebase DB access
import { db } from '@/lib/firebase'; // Assuming db is exported from here

const ArenaPanel = () => {
  const { courts } = useCourtData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [searchParams] = useSearchParams();
  const forcedTournamentId = searchParams.get('id');

  // 1. Monitorar todos os torneios ativos
  useEffect(() => {
    const unsubTournament = tournamentService.subscribe((tournaments) => {
      let selected: Tournament[] = [];

      if (forcedTournamentId) {
        const found = tournaments.find(t => t.id === forcedTournamentId);
        if (found) selected = [found];
      }

      if (selected.length === 0) {
        selected = tournaments.filter(t => t.status === 'active');
        // Se não houver nenhum "active", pegamos o mais recente como fallback
        if (selected.length === 0 && tournaments.length > 0) {
          selected = [tournaments[0]];
        }
      }

      setActiveTournaments(selected);
    });
    return () => unsubTournament();
  }, [forcedTournamentId]);

  // 2. Monitorar TODAS as partidas e filtrar pelos torneios ativos
  useEffect(() => {
    if (activeTournaments.length > 0) {
      const activeIds = activeTournaments.map(t => t.id);
      // Aqui usamos um subscribe geral de partidas e filtramos
      // Para manter a performance, buscamos apenas uma vez e deixamos o onValue agir
      // const unsubMatches = matchService.subscribeByTournament('', (matches) => { // Original line, commented out
      // Como o subscribeByTournament sem ID retorna vazio ou falha dependendo da regra, 
      // vamos subscrever ao nó raiz de matches para o telão
      const matchesRef = ref(db, 'matches');
      const unsubscribe = onValue(matchesRef, (snapshot) => {
        const data = snapshot.val();
        const list: Match[] = data ? Object.values(data) : [];
        const filtered = list.filter(m => activeIds.includes(m.tournamentId));
        setAllMatches(filtered);
      });
      // }); // Original line, commented out
      return () => unsubscribe(); // Changed to unsubscribe from onValue
    } else {
      setAllMatches([]); // Clear matches if no active tournaments
    }
  }, [activeTournaments]);

  // 3. Agrupar slides por Torneio + Categoria
  const categorySlides = useMemo(() => {
    if (activeTournaments.length === 0 || allMatches.length === 0) return [];

    return activeTournaments.flatMap(t => {
      const tMatches = allMatches.filter(m => m.tournamentId === t.id);
      if (tMatches.length === 0) return [];

      const officialCategories = t.categories || [];
      const tCats = officialCategories.length > 0
        ? Array.from(new Set(officialCategories))
        : Array.from(new Set(tMatches.map(m => m.category))).filter(Boolean);

      const allCatsJoined = tCats.join(' / ');

      return tCats.map(cat => {
        const catMatches = tMatches.filter(m =>
          m.category && cat && m.category.trim().toUpperCase() === cat.trim().toUpperCase()
        );

        if (catMatches.length === 0) return null;

        const sortedMatches = [...catMatches].sort((a, b) => {
          const order = { ongoing: 0, planned: 1, finished: 2 };
          return (order[a.status] || 0) - (order[b.status] || 0);
        });

        return {
          tournamentName: t.name,
          category: cat,
          displayCategory: allCatsJoined,
          matches: sortedMatches.map(m => ({
            ...m,
            courtName: courts.find(c => c.id === m.courtId)?.name
          }))
        };
      }).filter(Boolean);
    }).filter(Boolean) as { tournamentName: string, category: string, displayCategory: string, matches: any[] }[];
  }, [activeTournaments, allMatches, courts]);

  // Automatic Rotation between categories
  useEffect(() => {
    if (categorySlides.length <= 1) {
      setActiveCategoryIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveCategoryIndex(prev => (prev + 1) % categorySlides.length);
    }, 30000); // Back to 30 seconds as requested
    return () => clearInterval(interval);
  }, [categorySlides.length]);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white overflow-hidden font-inter arena-theme">
      {/* Header */}
      <ArenaHeader tournamentName={activeTournaments?.[0]?.name || 'Beach Tennis Manager'} />
      {categorySlides.length > 0 && (
        <HeadCategorie
          currentTime={currentTime}
          category={categorySlides[activeCategoryIndex]?.displayCategory || categorySlides[activeCategoryIndex]?.category || ''}
          tournamentName={categorySlides[activeCategoryIndex]?.tournamentName || ''}
        />
      )}

      <main className="flex-1 flex flex-col p-2 overflow-hidden relative">
        {categorySlides.length > 0 ? (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Transition Container */}
            {categorySlides.map((slide, idx) => (
              <div
                key={slide!.category}
                className={`
                    absolute inset-0 transition-all duration-1000 flex flex-col
                    ${idx === activeCategoryIndex
                    ? 'opacity-100 translate-x-0 z-50 scale-100'
                    : 'opacity-0 -translate-x-full -z-10 scale-95 pointer-events-none'}
                `}
              >
                <ArenaCategoryDashboard
                  category={slide!.category}
                  matches={slide!.matches}
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

      <SponsorBar />
    </div>
  );
};

export default ArenaPanel;
