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
  player2?: Player;
}

export interface Match {
  id: string;
  tournamentId: string;
  courtId?: string; // Optional, assigned when match starts
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status: 'planned' | 'ongoing' | 'finished';
  startTime?: number; // timestamp
  endTime?: number;
}

export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  currentMatch?: Match;
  pin: string; // 4-digit code for referee access
  tournamentId: string;
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
export interface ArenaCourt {
  id: string; // Internal ID for the template
  name: string;
}

export interface Arena {
  id: string;
  name: string;
  location?: string;
  courts: ArenaCourt[];
  createdAt: number;
}
