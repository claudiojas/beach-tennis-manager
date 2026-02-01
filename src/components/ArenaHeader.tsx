import { Palmtree } from 'lucide-react';

interface ArenaHeaderProps {
  tournamentName: string;
}

export const ArenaHeader = ({ tournamentName }: ArenaHeaderProps) => {
  return (
    <header className="header-gradient px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
          <Palmtree className="text-accent-foreground" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-foreground">Beach Tennis Manager</h1>
          <p className="text-xs text-primary-foreground/80">Cadastro e gestão de atletas</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-primary-foreground/80">PLACAR AO VIVO</p>
        <h2 className="text-xl font-bold text-primary-foreground uppercase">{tournamentName}</h2>
      </div>
    </header>
  );
};
