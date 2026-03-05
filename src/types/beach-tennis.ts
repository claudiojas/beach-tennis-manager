export type CourtStatus = 'livre' | 'em_jogo' | 'pausada' | 'manutencao';


export type Category = string;

export const TOURNAMENT_CATEGORIES = [
  "PRO",
  "A",
  "B",
  "C",
  "D",
  "INICIANTE",
  "MISTA",
  "SUB-12",
  "SUB-14",
  "+40",
  "+50"
] as const;

export interface Player {
  id: string;
  name: string;
  phone?: string;
  category: Category; // Keep for backward compatibility
  categories?: Category[]; // NEW: Support for multiple categories
  email?: string; // Optional for now
  photoUrl?: string;
  registrationNumber?: string;
}

export interface Team {
  player1: Player;
  player2?: Player;
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface GroupData {
  name: string; // e.g., "Group A"
  standings: GroupStanding[];
  matches: Match[];
}

export interface Match {
  id: string;
  tournamentId: string;
  courtId?: string;
  category: Category;
  teamA: Team;
  teamB: Team;
  // Professional Scoring
  setsA: number; // Sets won
  setsB: number;
  pointsA: string | number; // 0, 15, 30, 40, 'AD'
  pointsB: string | number;
  historySets: Array<{ scoreA: number; scoreB: number }>; // Past sets results
  serving: 'teamA' | 'teamB'; // Who is serving
  status: 'planned' | 'ongoing' | 'finished';
  notes?: string; // Match notes / sumula
  startTime?: number; // Scheduled time
  actualStartTime?: number; // REAL absolute start time
  endTime?: number;
  // Bracket specific
  round?: 'oitavas' | 'quartas' | 'semi' | 'final' | 'Grupos';
  bracketPosition?: number; // 0 to N-1
  nextMatchId?: string; // ID of the match the winner goes to
  group?: string; // NEW: "A", "B", "C"...
  controlledBy?: string | null; // ID of the device locking this match
  courtName?: string; // Cache of court name for display
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
  id: string;
  tournamentId: string;
  matchId: string;
  courtId: string;
  courtName: string;
  teamANames: string;
  teamBNames: string;
  scoreA: number;
  scoreB: number;
  endTime: number;
}

export interface TournamentSettings {
  setsToWin: number;
  gamesPerSet: number;
  noAd: boolean; // Ponto de Ouro
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  time: string;
  status: 'planning' | 'active' | 'finished' | 'cancelled';
  type: 'Simples' | 'Duplas';
  location?: string;
  createdAt: number;
  participatingAthleteIds?: string[]; // IDs of athletes in this tournament
  categories?: string[]; // Categories active in this tournament
  settings?: TournamentSettings;
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

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tournamentId?: string; // Se quiser vincular a um torneio específico
  createdAt: number;
}
