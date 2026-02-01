export type CourtStatus = 'livre' | 'em_jogo' | 'pausada' | 'manutencao';


export type Category = 'A' | 'B' | 'C' | 'Iniciante' | 'Pro' | 'Mista';

export interface Player {
  id: string;
  name: string;
  phone?: string;
  category: Category;
  email?: string; // Optional for now
  photoUrl?: string;
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

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: 'planning' | 'active' | 'finished';
  location?: string;
  createdAt: number;
}
