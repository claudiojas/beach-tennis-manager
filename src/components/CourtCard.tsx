import { Court } from '@/types/beach-tennis';
import { CourtStatusBadge } from './CourtStatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  onClick: (court: Court) => void;
}

export const CourtCard = ({ court, onClick }: CourtCardProps) => {
  const getTeamDisplay = (team: { player1: { name: string }; player2: { name: string } }) => {
    return `${team.player1.name} & ${team.player2.name}`;
  };

  return (
    <Card 
      className="glass-card cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
      onClick={() => onClick(court)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary">{court.name}</h3>
          <CourtStatusBadge status={court.status} />
        </div>
      </CardHeader>
      <CardContent>
        {court.currentMatch ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dupla A:</span>
              <span className="text-sm font-medium">{getTeamDisplay(court.currentMatch.teamA)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dupla B:</span>
              <span className="text-sm font-medium">{getTeamDisplay(court.currentMatch.teamB)}</span>
            </div>
            {court.status === 'em_jogo' && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-center gap-4">
                  <span className="score-display text-3xl font-bold">{court.currentMatch.scoreA}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="score-display text-3xl font-bold">{court.currentMatch.scoreB}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma partida em andamento
          </p>
        )}
        <div className="flex items-center justify-end mt-3 text-primary">
          <span className="text-sm font-medium">Detalhes</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
};
