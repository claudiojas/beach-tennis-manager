import { useState, useEffect } from 'react';
import { ArenaHeader } from '@/components/ArenaHeader';
import { ArenaCourtCard } from '@/components/ArenaCourtCard';
import { ResultsTicker } from '@/components/ResultsTicker';
import { SponsorBar } from '@/components/SponsorBar';
import { useCourtData } from '@/hooks/useCourtData';
import { Clock, Trophy, Star } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { matchService } from '@/services/matchService';
import { Tournament, Match } from '@/types/beach-tennis';
import { Badge } from '@/components/ui/badge';

const ArenaPanel = () => {
  const { courts, results } = useCourtData();
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Filter courts by active tournament and 'em_jogo' status
  const ongoingCourts = courts.filter(c =>
    c.status === 'em_jogo' &&
    activeTournament &&
    c.tournamentId === activeTournament.id
  );

  // Identify Champions
  const champions = matches
    .filter(m => m.round === 'final' && m.status === 'finished')
    .map(m => ({
      type: 'champion' as const,
      id: `champ-${m.id}`,
      category: m.category,
      winner: m.setsA > m.setsB ? m.teamA : m.teamB,
      score: `${m.setsA} x ${m.setsB}`
    }));

  // Combine slides: Ongoing matches OR Champions (if no matches, or just show both in sequence)
  const slides = [
    ...ongoingCourts.map(c => ({ type: 'court' as const, data: c, id: c.id })),
    ...champions.map(c => ({ type: 'champion' as const, data: c, id: c.id }))
  ];

  // Automatic Switcher (Carousel)
  useEffect(() => {
    if (slides.length <= 1) {
      setActiveIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 10000); // 10 seconds per slide
    return () => clearInterval(interval);
  }, [slides.length]);

  const getGridClass = () => {
    const count = courts.length;
    if (count === 1) return "max-w-4xl mx-auto flex items-center justify-center h-full";
    if (count <= 4) return "grid grid-cols-1 md:grid-cols-2 gap-6 h-full content-center";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white overflow-hidden font-inter">
      {/* Header */}
      <ArenaHeader tournamentName={activeTournament?.name || 'Beach Tennis Manager'} />

      {/* Sponsor Bar right below Header */}
      <SponsorBar />

      {/* Main Content with Transition */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-8 pb-32 overflow-hidden relative">
        {slides.length > 0 ? (
          <div className="w-full max-w-7xl h-full flex flex-col items-center justify-center relative -translate-y-12">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`transition-all duration-1000 absolute w-full flex justify-center
                  ${idx === activeIndex
                    ? 'opacity-100 scale-100 translate-x-0 z-10'
                    : 'opacity-0 scale-95 translate-x-32 z-0 pointer-events-none'}`}
              >
                {slide.type === 'court' ? (
                  <div className="w-full scale-110 sm:scale-125 lg:scale-150">
                    <ArenaCourtCard
                      court={slide.data as any}
                      isHighlighted={true}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-2xl relative group">
                    {/* Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>

                    <div className="relative bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 overflow-hidden shadow-2xl">
                      {/* Decoration Icons */}
                      <Star className="absolute top-6 left-6 text-yellow-500/10 w-8 h-8" />
                      <Star className="absolute bottom-6 right-6 text-yellow-500/10 w-8 h-8" />

                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                          <div className="bg-yellow-500/10 p-4 rounded-full border border-yellow-500/20 inline-block">
                            <Trophy className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                          </div>
                          <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black border-none animate-bounce px-2">
                            CAMPEÃO
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-yellow-500 font-black text-sm tracking-[0.3em] uppercase italic">Pódio das Estrelas</h3>
                          <h2 className="text-4xl font-black text-white tracking-tighter uppercase line-clamp-2">
                            {(slide.data as any).winner.player1.name}
                            {(slide.data as any).winner.player2 && <><span className="text-yellow-500 px-2">/</span>{(slide.data as any).winner.player2.name}</>}
                          </h2>
                        </div>

                        <div className="flex items-center gap-6 w-full max-w-xs">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">Categoria</span>
                            <Badge variant="outline" className="text-lg py-0 px-4 border-yellow-500/40 text-yellow-500 font-black italic">
                              {(slide.data as any).category}
                            </Badge>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                        </div>

                        <div className="pt-2">
                          <p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.4em] mb-2">Resultado da Final</p>
                          <div className="text-2xl font-mono font-black text-white bg-black/40 px-6 py-2 rounded-xl border border-white/5">
                            {(slide.data as any).score}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Indicators - Only if > 1 */}
            {slides.length > 1 && (
              <div className="absolute -bottom-12 flex gap-3">
                {slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3 rounded-full transition-all duration-500
                                ${idx === activeIndex ? 'bg-primary w-12' : 'bg-white/10 w-3'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-1000">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-primary/40 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Aguardando Próxima Partida</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Os jogos iniciados pelos árbitros aparecerão aqui</p>
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
