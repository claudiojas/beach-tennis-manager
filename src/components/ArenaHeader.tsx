import { Palmtree, Clock } from 'lucide-react';

interface ArenaHeaderProps {
  tournamentName: string;
  location?: string;
  logoUrl?: string;
  currentTime: Date;
}

export const ArenaHeader = ({ tournamentName, location, logoUrl, currentTime }: ArenaHeaderProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-black/95 backdrop-blur-2xl px-12 py-6 flex items-center justify-between border-b border-white/5 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
      {/* Left Decoration / Spacer */}
      <div className="w-1/4 hidden lg:flex items-center gap-3">
        <div className="h-0.5 w-12 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Arena Live</span>
      </div>

      {/* Center Branding */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden w-16 h-16 shadow-2xl relative group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain relative z-10" />
          ) : (
            <Palmtree className="text-primary relative z-10" size={32} />
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-tight drop-shadow-2xl">
            {tournamentName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-px w-6 bg-primary/50" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.6em]">
              {location || 'Arena Management System'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Stats / Clock */}
      <div className="w-1/4 flex items-center justify-end gap-8">
        <div className="hidden xl:flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Em Tempo Real</span>
          </div>
          <div className="bg-white/[0.03] px-6 py-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-4xl font-black text-white font-mono tabular-nums tracking-tighter">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
