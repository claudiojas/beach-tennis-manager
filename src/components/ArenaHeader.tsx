import { Palmtree, Clock } from 'lucide-react';

interface ArenaHeaderProps {
  tournamentName: string;
  currentTime: Date;
}

export const ArenaHeader = ({ tournamentName, currentTime }: ArenaHeaderProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-white/5 z-50">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-2xl border border-primary/20">
          <Palmtree className="text-primary" size={28} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">
            {tournamentName}
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Arena Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Arena</span>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/10 shadow-inner">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-3xl font-black text-white font-mono tabular-nums leading-none">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
