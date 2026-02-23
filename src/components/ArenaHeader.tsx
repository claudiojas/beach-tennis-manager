import { Palmtree } from 'lucide-react';

interface ArenaHeaderProps {
  tournamentName: string;
}

export const ArenaHeader = ({ tournamentName }: ArenaHeaderProps) => {
  return (
    <header className="header-gradient px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
          <Palmtree className="text-accent-foreground" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary-foreground tracking-tighter italic">BEACH TENNIS</h1>
          <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em] -mt-1">Arena Panel</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2 mb-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Live Stream</p>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-sm">{tournamentName}</h2>
      </div>
    </header>
  );
};
