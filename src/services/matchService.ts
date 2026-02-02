import { db } from "@/lib/firebase";
import { Match, Team, Player } from "@/types/beach-tennis";
import { ref, push, set, onValue, query, orderByChild, equalTo, update } from "firebase/database";

const MATCHES_PATH = "matches";

export const matchService = {
    create: async (match: Omit<Match, "id" | "status" | "scoreA" | "scoreB">) => {
        const matchesRef = ref(db, MATCHES_PATH);
        const newMatchRef = push(matchesRef);
        const newMatch: Match = {
            ...match,
            id: newMatchRef.key!,
            status: 'planned',
            scoreA: 0,
            scoreB: 0,
        };
        await set(newMatchRef, newMatch);
        return newMatchRef.key;
    },

    subscribeByTournament: (tournamentId: string, callback: (matches: Match[]) => void) => {
        const matchesQuery = query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        return onValue(matchesQuery, (snapshot) => {
            const data = snapshot.val();
            const matches: Match[] = data ? Object.values(data) : [];
            callback(matches.reverse()); // Newest first
        });
    },

    // Assign match to a court and start it
    startMatch: async (matchId: string, courtId: string) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        await update(matchRef, {
            status: 'ongoing',
            courtId,
            startTime: Date.now()
        });

        // Also update court status
        const courtRef = ref(db, `courts/${courtId}`);
        await update(courtRef, {
            status: 'em_jogo',
            currentMatch: matchId // Store ID or object? Type says object but storing ID is better for ref. Type says Match object. 
            // For simplicity let's stick to updating the court with the full match object for now as per type definition, 
            // OR update type to Reference. Let's update type to Match object snapshot for the Court.
        });
    },

    update: async (matchId: string, match: Partial<Match>) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        await update(matchRef, match);
    },

    remove: async (matchId: string) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        await set(matchRef, null);
    }
};
