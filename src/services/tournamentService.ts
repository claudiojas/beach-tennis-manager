import { db } from "@/lib/firebase";
import { Tournament } from "@/types/beach-tennis";
import { ref, push, set, onValue, query, orderByChild } from "firebase/database";

const DB_PATH = "tournaments";

export const tournamentService = {
    create: async (tournament: Omit<Tournament, "id" | "createdAt" | "status">) => {
        const tournamentsRef = ref(db, DB_PATH);
        const newTournamentRef = push(tournamentsRef);
        const newTournament: Tournament = {
            ...tournament,
            id: newTournamentRef.key!,
            status: 'planning',
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
                ? Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt) // Newest first
                : [];
            callback(tournaments);
        });
    }
};
