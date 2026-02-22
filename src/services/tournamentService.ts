import { db } from "@/lib/firebase";
import { Tournament } from "@/types/beach-tennis";
import { ref, push, set, onValue, query, orderByChild, update, get, equalTo } from "firebase/database";

const DB_PATH = "tournaments";

export const tournamentService = {
    create: async (tournament: Omit<Tournament, "id" | "createdAt" | "status">) => {
        const tournamentsRef = ref(db, DB_PATH);
        const newTournamentRef = push(tournamentsRef);
        const newTournament: Tournament = {
            ...tournament,
            id: newTournamentRef.key!,
            status: 'planning',
            type: tournament.type,
            createdAt: Date.now(),
        };
        await set(newTournamentRef, newTournament);
        return newTournamentRef.key;
    },

    subscribe: (callback: (data: Tournament[]) => void) => {
        const tournamentsRef = query(ref(db, DB_PATH), orderByChild("createdAt"));
        return onValue(tournamentsRef, (snapshot) => {
            const data = snapshot.val();
            const tournaments: Tournament[] = data
                ? (Object.values(data) as Tournament[]).sort((a, b) => b.createdAt - a.createdAt) // Newest first
                : [];
            callback(tournaments);
        });
    },

    update: async (id: string, data: Partial<Tournament>) => {
        const tournamentRef = ref(db, `${DB_PATH}/${id}`);
        await update(tournamentRef, data);
    },

    delete: async (id: string) => {
        const updates: Record<string, any> = {};

        // 1. Prepare matches for deletion (Fetch all and filter locally to avoid indexing issues)
        const matchesSnapshot = await get(ref(db, "matches"));
        if (matchesSnapshot.exists()) {
            const matches = matchesSnapshot.val();
            Object.keys(matches).forEach(matchId => {
                if (matches[matchId].tournamentId === id) {
                    updates[`matches/${matchId}`] = null;
                }
            });
        }

        // 2. Prepare courts for deletion
        const courtsSnapshot = await get(ref(db, "courts"));
        if (courtsSnapshot.exists()) {
            const courts = courtsSnapshot.val();
            Object.keys(courts).forEach(courtId => {
                if (courts[courtId].tournamentId === id) {
                    updates[`courts/${courtId}`] = null;
                }
            });
        }

        // 3. Prepare results for deletion
        const resultsSnapshot = await get(ref(db, "results"));
        if (resultsSnapshot.exists()) {
            const results = resultsSnapshot.val();
            Object.keys(results).forEach(resultId => {
                if (results[resultId].tournamentId === id) {
                    updates[`results/${resultId}`] = null;
                }
            });
        }

        // 4. Delete the tournament itself
        updates[`${DB_PATH}/${id}`] = null;

        // 5. Execute all deletions atomically
        await update(ref(db), updates);
    }

};
