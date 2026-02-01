import { Court } from '@/types/beach-tennis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Minus, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import { CourtStatusBadge } from './CourtStatusBadge';

interface ScorePanelProps {
  court: Court;
  onBack: () => void;
  onScoreChange: (courtId: string, team: 'A' | 'B', delta: number) => void;
  onTogglePause: (courtId: string) => void;
  onResetScore: (courtId: string) => void;
}

export const ScorePanel = ({ 
  court, 
  onBack, 
  onScoreChange, 
  onTogglePause,
  onResetScore 
}: ScorePanelProps) => {
  const match = court.currentMatch;
  const isPaused = court.status === 'pausada';

  if (!match) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhuma partida ativa nesta quadra</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTeamDisplay = (team: { player1: { name: string }; player2: { name: string } }) => {
    return `${team.player1.name} & ${team.player2.name}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="touch-manipulation">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <CourtStatusBadge status={court.status} />
      </div>

      <Card className="glass-card">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-bold text-primary">{court.name}</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team A */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Dupla A: {getTeamDisplay(match.teamA)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="score-button bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onScoreChange(court.id, 'A', -1)}
                disabled={match.scoreA <= 0 || isPaused}
              >
                <Minus className="h-8 w-8" />
              </Button>
              <span className="score-display text-7xl font-bold min-w-[100px] text-center">
                {match.scoreA}
              </span>
              <Button
                variant="default"
                size="icon"
                className="score-button"
                onClick={() => onScoreChange(court.id, 'A', 1)}
                disabled={isPaused}
              >
                <Plus className="h-8 w-8" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Team B */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Dupla B: {getTeamDisplay(match.teamB)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="score-button bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onScoreChange(court.id, 'B', -1)}
                disabled={match.scoreB <= 0 || isPaused}
              >
                <Minus className="h-8 w-8" />
              </Button>
              <span className="score-display text-7xl font-bold min-w-[100px] text-center">
                {match.scoreB}
              </span>
              <Button
                variant="default"
                size="icon"
                className="score-button"
                onClick={() => onScoreChange(court.id, 'B', 1)}
                disabled={isPaused}
              >
                <Plus className="h-8 w-8" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant={isPaused ? 'default' : 'outline'}
              className="flex-1 h-14 touch-manipulation"
              onClick={() => onTogglePause(court.id)}
            >
              {isPaused ? (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Retomar
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pausar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-14 touch-manipulation"
              onClick={() => onResetScore(court.id)}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
