import { Court } from '@/types/beach-tennis';

interface ArenaCourtCardProps {
  court: Court;
  isHighlighted?: boolean;
}

export const ArenaCourtCard = ({ court, isHighlighted = false }: ArenaCourtCardProps) => {
  const match = court.currentMatch;
  
  const getTeamDisplay = (team: { player1: { name: string }; player2: { name: string } }) => {
    return `${team.player1.name} / ${team.player2.name}`;
  };

  const cardClasses = `
    relative rounded-xl p-4 transition-all duration-300
    ${isHighlighted 
      ? 'bg-card ring-4 ring-success shadow-lg shadow-success/20' 
      : 'bg-card/50 border border-border/50'
    }
  `;

  return (
    <div className={cardClasses}>
      {/* Court name */}
      <h3 className="text-lg font-bold text-muted-foreground mb-2 uppercase tracking-wider">
        {court.name}
      </h3>

      {court.status === 'manutencao' ? (
        <div className="flex items-center justify-center h-32">
          <span className="text-2xl font-bold text-warning uppercase">Manutenção</span>
        </div>
      ) : court.status === 'livre' ? (
        <div className="flex items-center justify-center h-32">
          <span className="text-2xl font-bold text-muted-foreground uppercase">Livre</span>
        </div>
      ) : match ? (
        <>
          {/* Live indicator */}
          {court.status === 'em_jogo' && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="text-xs font-bold text-success uppercase">Agora:</span>
            </div>
          )}

          {/* Teams */}
          <p className="text-base font-medium text-foreground/90 mb-3">
            {getTeamDisplay(match.teamA)} vs {getTeamDisplay(match.teamB)}
          </p>

          {/* Score - Large Display */}
          <div className="flex items-center justify-center gap-6">
            <span className="score-display score-tv text-foreground">{match.scoreA}</span>
            <span className="text-4xl text-muted-foreground font-light">-</span>
            <span className="score-display score-tv text-foreground">{match.scoreB}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <span className="text-xl text-muted-foreground">Aguardando</span>
        </div>
      )}
    </div>
  );
};
