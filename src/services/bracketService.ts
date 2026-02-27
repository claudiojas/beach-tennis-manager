import { db } from "@/lib/firebase";
import { Match, Team, Category } from "@/types/beach-tennis";
import { ref, push, set, query, orderByChild, equalTo, get } from "firebase/database";
import { courtService } from "./courtService";

const MATCHES_PATH = "matches";

export const bracketService = {
    /**
     * Generates a single elimination bracket for a tournament category.
     * Supports 4 or 8 teams for now.
     */
    generateBracket: async (tournamentId: string, category: Category, teams: Team[]) => {
        const teamCount = teams.length;
        if (teamCount !== 2 && teamCount !== 4 && teamCount !== 8) {
            throw new Error("O sistema atualmente suporta apenas chaves de 2, 4 ou 8 duplas.");
        }

        // Fetch available courts for this tournament
        const allCourts = await courtService.getByTournamentOnce(tournamentId);
        const existingMatchesSnapshot = await get(query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId)));
        const existingMatches = existingMatchesSnapshot.exists() ? Object.values(existingMatchesSnapshot.val()) as Match[] : [];

        const occupiedCourtIds = existingMatches
            .filter(m => m.status === 'planned' || m.status === 'ongoing')
            .map(m => m.courtId);

        let availableCourts = allCourts.filter(c => !occupiedCourtIds.includes(c.id));
        const getNextCourt = () => availableCourts.shift()?.id || null;

        const matchesRef = ref(db, MATCHES_PATH);

        if (teamCount === 2) {
            // Grande Final Direta
            const finalRef = push(matchesRef);
            const finalId = finalRef.key!;

            const matchData = {
                ...createPlaceholderMatch(finalId, tournamentId, category, 'final', 0),
                teamA: teams[0],
                teamB: teams[1],
                courtId: getNextCourt()
            };

            await set(ref(db, `${MATCHES_PATH}/${finalId}`), matchData);
            return { finalId };
        }

        if (teamCount === 4) {
            // Final
            const finalRef = push(matchesRef);
            const finalId = finalRef.key!;

            // Semis
            const semi1Ref = push(matchesRef);
            const semi2Ref = push(matchesRef);

            const matches: Record<string, Match> = {
                [finalId]: { ...createPlaceholderMatch(finalId, tournamentId, category, 'final', 0), courtId: getNextCourt() },
                [semi1Ref.key!]: {
                    ...createPlaceholderMatch(semi1Ref.key!, tournamentId, category, 'semi', 0),
                    teamA: teams[0],
                    teamB: teams[3],
                    nextMatchId: finalId,
                    courtId: getNextCourt()
                },
                [semi2Ref.key!]: {
                    ...createPlaceholderMatch(semi2Ref.key!, tournamentId, category, 'semi', 1),
                    teamA: teams[1],
                    teamB: teams[2],
                    nextMatchId: finalId,
                    courtId: getNextCourt()
                }
            };

            for (const [id, matchData] of Object.entries(matches)) {
                await set(ref(db, `${MATCHES_PATH}/${id}`), matchData);
            }
            return { finalId };
        }

        if (teamCount === 8) {
            // Final (1)
            const finalRef = push(matchesRef);
            const finalId = finalRef.key!;

            // Semis (2)
            const s1Ref = push(matchesRef);
            const s2Ref = push(matchesRef);

            // Quartas (4)
            const q1Ref = push(matchesRef);
            const q2Ref = push(matchesRef);
            const q3Ref = push(matchesRef);
            const q4Ref = push(matchesRef);

            const matches: Record<string, Match> = {
                [finalId]: { ...createPlaceholderMatch(finalId, tournamentId, category, 'final', 0), courtId: getNextCourt() },

                [s1Ref.key!]: { ...createPlaceholderMatch(s1Ref.key!, tournamentId, category, 'semi', 0), nextMatchId: finalId, courtId: getNextCourt() },
                [s2Ref.key!]: { ...createPlaceholderMatch(s2Ref.key!, tournamentId, category, 'semi', 1), nextMatchId: finalId, courtId: getNextCourt() },

                [q1Ref.key!]: { ...createPlaceholderMatch(q1Ref.key!, tournamentId, category, 'quartas', 0), teamA: teams[0], teamB: teams[7], nextMatchId: s1Ref.key!, courtId: getNextCourt() },
                [q2Ref.key!]: { ...createPlaceholderMatch(q2Ref.key!, tournamentId, category, 'quartas', 1), teamA: teams[3], teamB: teams[4], nextMatchId: s1Ref.key!, courtId: getNextCourt() },
                [q3Ref.key!]: { ...createPlaceholderMatch(q3Ref.key!, tournamentId, category, 'quartas', 2), teamA: teams[1], teamB: teams[6], nextMatchId: s2Ref.key!, courtId: getNextCourt() },
                [q4Ref.key!]: { ...createPlaceholderMatch(q4Ref.key!, tournamentId, category, 'quartas', 3), teamA: teams[2], teamB: teams[5], nextMatchId: s2Ref.key!, courtId: getNextCourt() },
            };

            for (const [id, matchData] of Object.entries(matches)) {
                await set(ref(db, `${MATCHES_PATH}/${id}`), matchData);
            }
            return { finalId };
        }
    }
};

/**
 * Helper to create a base match object with default values
 */
function createPlaceholderMatch(id: string, tournamentId: string, category: Category, round: Match['round'], position: number): Match {
    return {
        id,
        tournamentId,
        category,
        status: 'planned',
        setsA: 0,
        setsB: 0,
        pointsA: 0,
        pointsB: 0,
        historySets: [],
        serving: 'teamA',
        round,
        bracketPosition: position,
        // Empty teams for placeholders
        teamA: { player1: { id: 'placeholder-a', name: 'Aguardando...', category } },
        teamB: { player1: { id: 'placeholder-b', name: 'Aguardando...', category } },
    };
}
