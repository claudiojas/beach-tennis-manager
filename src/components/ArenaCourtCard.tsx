import { Court } from '@/types/beach-tennis';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ArenaCourtCardProps {
  court: Court;
  isHighlighted?: boolean;
}

export const ArenaCourtCard = ({ court, isHighlighted = false }: ArenaCourtCardProps) => {
  const match = court.currentMatch;
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (match?.status !== 'ongoing' || !match.actualStartTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - match.actualStartTime!;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [match?.status, match?.actualStartTime]);

  const shortenName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    // If the name is too long, shorten it wisely
    if (name.length > 18) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
    }
    return name;
  };

  const getTeamDisplay = (team: { player1: { name: string }; player2?: { name: string } }) => {
    const p1 = shortenName(team.player1.name);
    if (!team.player2) return p1;
    const p2 = shortenName(team.player2.name);
    return `${p1} / ${p2}`;
  };

  const cardClasses = `
    relative rounded-[2rem] p-6 sm:p-8 transition-all duration-500 overflow-hidden w-full max-w-[800px] mx-auto
    ${isHighlighted
      ? 'bg-slate-950 ring-[6px] ring-primary/20 border border-primary/50 shadow-[0_20px_50px_rgba(206,253,3,0.2)]'
      : 'bg-slate-900 border border-white/5 shadow-2xl'
    }
  `;

  return (
    <div className={cardClasses}>
      {/* Background Decor - Subtle gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

      {/* Court details */}
      <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white/90 uppercase tracking-tighter leading-none">
            {court.name}
          </h3>
          {match && (
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase px-2 h-5">
                Cat. {match.category}
              </Badge>
              {match.status === 'ongoing' && (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {elapsed}
                </span>
              )}
            </div>
          )}
        </div>

        {court.status === 'em_jogo' && (
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {court.status === 'manutencao' ? (
        <div className="flex items-center justify-center h-48">
          <span className="text-3xl font-black text-slate-700 uppercase italic">Manutenção</span>
        </div>
      ) : court.status === 'livre' ? (
        <div className="flex items-center justify-center h-48">
          <span className="text-3xl font-black text-slate-800 uppercase italic">Quadra Livre</span>
        </div>
      ) : match ? (
        <div className="space-y-6">
          {/* Match Score Area */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {/* Team A */}
            <div className="text-right space-y-2">
              <p className="text-xl sm:text-3xl font-black text-white leading-none uppercase tracking-tighter">
                {getTeamDisplay(match.teamA)}
              </p>
            </div>

            {/* Score Indicator */}
            <div className="flex flex-col items-center gap-1 bg-white/[0.08] px-4 sm:px-8 py-3 sm:py-5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Placar</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="text-5xl sm:text-8xl font-black text-primary tabular-nums drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">{match.setsA}</span>
                <span className="text-3xl sm:text-5xl font-thin text-slate-700">|</span>
                <span className="text-5xl sm:text-8xl font-black text-primary tabular-nums drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">{match.setsB}</span>
              </div>
            </div>

            {/* Team B */}
            <div className="text-left space-y-2">
              <p className="text-xl sm:text-3xl font-black text-white leading-none uppercase tracking-tighter">
                {getTeamDisplay(match.teamB)}
              </p>
            </div>
          </div>

          {/* Previous Sets History */}
          {match.historySets && match.historySets.length > 0 && (
            <div className="flex justify-center gap-3 pt-4">
              {match.historySets.map((set, idx) => (
                <div key={idx} className="flex gap-2 text-xs font-black bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                  <span className={set.scoreA > set.scoreB ? "text-primary" : "text-slate-500"}>{set.scoreA}</span>
                  <span className="text-slate-800 font-thin">-</span>
                  <span className={set.scoreB > set.scoreA ? "text-primary" : "text-slate-500"}>{set.scoreB}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <span className="text-xl text-slate-500 font-medium">Aguardando Próxima Partida</span>
        </div>
      )}
    </div>
  );
};
