import { describe, it, expect, vi } from 'vitest';
import { Player, Team, Match } from '../types/beach-tennis';

// Mocking Firebase to isolate logic
vi.mock('@/lib/firebase', () => ({
    db: {}
}));

// We'll extract the sorting logic into a testable function or just mock the environment
// Since promoteGroupWinners is complex and async, let's look at how we can test the sorting core.

type TeamStats = {
    id: string;
    team: Team;
    won: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    matches: Match[];
};

/**
 * Standard Tie-breaker sort function for Beach Tennis
 */
export const sortTeams = (stats: TeamStats[]): TeamStats[] => {
    return [...stats].sort((a, b) => {
        // 1. Number of Victories
        if (b.won !== a.won) return b.won - a.won;

        // 2. Head-to-head (Confronto Direto) - ONLY for 2 teams tie
        const tiedTeams = stats.filter(s => s.won === a.won);
        if (tiedTeams.length === 2) {
            const match = a.matches.find(m =>
                (m.teamA?.player1.id === b.team.player1.id || m.teamB?.player1.id === b.team.player1.id)
            );
            if (match && match.status === 'finished') {
                const aIsTeamA = match.teamA?.player1.id === a.team.player1.id;
                const aWonMatch = aIsTeamA ? (match.setsA > match.setsB) : (match.setsB > match.setsA);
                return aWonMatch ? -1 : 1;
            }
        }

        // 3. Sets Balance
        const balanceSetsA = a.setsWon - a.setsLost;
        const balanceSetsB = b.setsWon - b.setsLost;
        if (balanceSetsB !== balanceSetsA) return balanceSetsB - balanceSetsA;

        // 4. Games Balance
        const balanceGamesA = a.gamesWon - a.gamesLost;
        const balanceGamesB = b.gamesWon - b.gamesLost;
        if (balanceGamesB !== balanceGamesA) return balanceGamesB - balanceGamesA;

        // 5. Game Average
        const avgA = a.gamesWon / (a.gamesWon + a.gamesLost || 1);
        const avgB = b.gamesWon / (b.gamesWon + b.gamesLost || 1);
        if (avgB !== avgA) return avgB - avgA;

        return 0;
    });
};

describe('Tournament Classification Logic', () => {
    const p1: Player = { id: '1', name: 'Player 1', category: 'A' };
    const p2: Player = { id: '2', name: 'Player 2', category: 'A' };
    const p3: Player = { id: '3', name: 'Player 3', category: 'A' };

    const team1: Team = { player1: p1 };
    const team2: Team = { player1: p2 };
    const team3: Team = { player1: p3 };

    it('should rank by victories first', () => {
        const stats: TeamStats[] = [
            { id: '1', team: team1, won: 1, setsWon: 1, setsLost: 0, gamesWon: 6, gamesLost: 0, matches: [] },
            { id: '2', team: team2, won: 2, setsWon: 2, setsLost: 0, gamesWon: 12, gamesLost: 0, matches: [] },
        ];
        const sorted = sortTeams(stats);
        expect(sorted[0].id).toBe('2');
    });

    it('should use Head-to-head (Confronto Direto) for 2-way ties', () => {
        // Team 1 defeated Team 2
        // Team 2 has better overall balance
        const match1vs2: Match = {
            id: 'm1', tournamentId: 't1', category: 'A', status: 'finished',
            teamA: team1, teamB: team2, setsA: 1, setsB: 0, pointsA: 0, pointsB: 0,
            serving: 'teamA',
            historySets: [{ scoreA: 6, scoreB: 4 }], round: 'Grupos'
        };

        const stats: TeamStats[] = [
            { id: '1', team: team1, won: 1, setsWon: 1, setsLost: 1, gamesWon: 10, gamesLost: 10, matches: [match1vs2] },
            { id: '2', team: team2, won: 1, setsWon: 1, setsLost: 1, gamesWon: 15, gamesLost: 6, matches: [match1vs2] },
        ];

        const sorted = sortTeams(stats);
        expect(sorted[0].id).toBe('1'); // Team 1 should be first because it won the match against Team 2
    });

    it('should use Sets Balance for 3-way ties', () => {
        // A beats B, B beats C, C beats A
        const stats: TeamStats[] = [
            { id: 'A', team: team1, won: 1, setsWon: 2, setsLost: 1, gamesWon: 12, gamesLost: 10, matches: [] },
            { id: 'B', team: team2, won: 1, setsWon: 3, setsLost: 1, gamesWon: 20, gamesLost: 15, matches: [] },
            { id: 'C', team: team3, won: 1, setsWon: 1, setsLost: 1, gamesWon: 10, gamesLost: 10, matches: [] },
        ];
        const sorted = sortTeams(stats);
        expect(sorted[0].id).toBe('B'); // B has +2 set balance, A has +1, C has 0
    });
});
