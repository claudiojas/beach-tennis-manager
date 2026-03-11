import { db } from "@/lib/firebase";
import { Match, Team, Category } from "@/types/beach-tennis";
import { ref, push, set, query, orderByChild, equalTo, get, update } from "firebase/database";
import { courtService } from "./courtService";

const MATCHES_PATH = "matches";

export const bracketService = {
    /**
     * Generates a single elimination bracket for a tournament category.
     * Supports 4 or 8 teams for now.
     */
    generateBracket: async (tournamentId: string, category: Category, teams: Team[]) => {
        const N = teams.length;
        if (N < 2) throw new Error("Mínimo de 2 duplas para gerar chave.");

        // --- SAFEGUARD: Prevent Duplicate Brackets ---
        const existingSnapshot = await get(query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId)));
        if (existingSnapshot.exists()) {
            const existingMatches = Object.values(existingSnapshot.val()) as Match[];
            const alreadyHasBracket = existingMatches.some(m => m.category === category && m.round && m.round !== 'Grupos');
            if (alreadyHasBracket) {
                throw new Error(`As chaves (mata-mata) para a categoria ${category} já foram geradas.`);
            }
        }

        // 1. Find the target power of 2 (P) such that P <= N < 2P
        // P will be the number of slots in the "Base Round" (e.g., Quartas = 8)
        let P = 2;
        while (P * 2 <= N) P *= 2;

        const round1MatchesCount = N - P; // Number of play-in matches
        const teamsInRound1 = round1MatchesCount * 2;
        const byeTeamsCount = N - teamsInRound1;

        // Round Mapping
        const ROUND_NAMES: Record<number, Match['round']> = {
            2: 'final',
            4: 'semi',
            8: 'quartas',
            16: 'oitavas'
        };

        const baseRoundName = ROUND_NAMES[P];
        const prelimRoundName = ROUND_NAMES[P * 2];

        if (!baseRoundName) throw new Error(`O sistema não suporta chaves para ${N} equipes no momento.`);

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
        const matchUpdates: Record<string, any> = {};

        // Helper to get bracket indices for standard seeding
        const getSeeding = (size: number) => {
            let seeding = [0, 1];
            while (seeding.length < size) {
                const next: number[] = [];
                for (let i = 0; i < seeding.length; i++) {
                    next.push(seeding[i]);
                    next.push(seeding.length * 2 - 1 - seeding[i]);
                }
                seeding = next;
            }
            return seeding;
        };

        const baseSeeding = getSeeding(P);

        // 2. Generate the tree backwards from Final
        const createRound = async (size: number, nextRoundMatches?: string[]) => {
            const currentRoundIds: string[] = [];
            const rName = ROUND_NAMES[size];

            for (let i = 0; i < size / 2; i++) {
                const mRef = push(matchesRef);
                const mId = mRef.key!;
                currentRoundIds.push(mId);

                const data = createPlaceholderMatch(mId, tournamentId, category, rName, i);
                if (nextRoundMatches) {
                    data.nextMatchId = nextRoundMatches[Math.floor(i / 2)];
                }
                data.courtId = getNextCourt();

                matchUpdates[mId] = data;
            }
            return currentRoundIds;
        };

        // Create Final
        const finalId = (await createRound(2))[0];

        // Create levels down to Base Round
        let currentLevelSize = 4;
        let lastLevelIds = [finalId];

        while (currentLevelSize <= P) {
            lastLevelIds = await createRound(currentLevelSize, lastLevelIds);
            currentLevelSize *= 2;
        }

        // Now lastLevelIds contains the IDs for the Base Round (e.g., the 4 matches of Quartas)
        // We need to fill them with teams or links to Prelim Round
        const byeTeams = teams.slice(0, byeTeamsCount);
        const playInTeams = teams.slice(byeTeamsCount);

        const baseRoundMatches = lastLevelIds.map(id => matchUpdates[id]);

        // Distribute teams into the Base Round slots based on seeding
        // For P=8, seeding is [0, 7, 3, 4, 1, 6, 2, 5]
        // But we fill them into the 4 matches (8 slots)
        // Match 0: Slot 0 & 1 -> Teams baseSeeding[0] vs baseSeeding[P-1]
        // Match 1: Slot 2 & 3 -> Teams baseSeeding[P/2-1] vs baseSeeding[P/2]

        // Simplified Distribution for Beach Tennis (1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6)
        let byeIndex = 0;
        let playInPairIndex = 0;

        for (let i = 0; i < P / 2; i++) {
            const match = baseRoundMatches[i];

            // Slot A
            if (byeIndex < byeTeamsCount) {
                match.teamA = byeTeams[byeIndex++];
            } else {
                // Must be a play-in link
                const piRef = push(matchesRef);
                const piId = piRef.key!;
                const piData = {
                    ...createPlaceholderMatch(piId, tournamentId, category, prelimRoundName, playInPairIndex * 2),
                    teamA: playInTeams[playInPairIndex * 2],
                    teamB: playInTeams[playInPairIndex * 2 + 1],
                    nextMatchId: match.id,
                    courtId: getNextCourt()
                };
                matchUpdates[piId] = piData;
                playInPairIndex++;
            }

            // Slot B
            if (byeIndex < byeTeamsCount) {
                match.teamB = byeTeams[byeIndex++];
            } else {
                // Must be a play-in link
                const piRef = push(matchesRef);
                const piId = piRef.key!;
                const piData = {
                    ...createPlaceholderMatch(piId, tournamentId, category, prelimRoundName, playInPairIndex * 2),
                    teamA: playInTeams[playInPairIndex * 2],
                    teamB: playInTeams[playInPairIndex * 2 + 1],
                    nextMatchId: match.id,
                    courtId: getNextCourt()
                };
                matchUpdates[piId] = piData;
                playInPairIndex++;
            }
        }

        // Save everything to DB
        const dbRef = ref(db);
        const finalUpdates: Record<string, any> = {};
        Object.entries(matchUpdates).forEach(([id, data]) => {
            // Clean undefined values for Firebase safety
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            finalUpdates[`${MATCHES_PATH}/${id}`] = cleanData;
        });

        await update(dbRef, finalUpdates);
        return { finalId };
    },
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
