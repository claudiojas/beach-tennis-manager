export type CourtStatus = 'livre' | 'em_jogo' | 'pausada' | 'manutencao';

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  player1: Player;
  player2: Player;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  startTime?: Date;
}

export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  currentMatch?: Match;
}

export interface MatchResult {
  courtId: string;
  courtName: string;
  teamANames: string;
  teamBNames: string;
  scoreA: number;
  scoreB: number;
  endTime: Date;
}
