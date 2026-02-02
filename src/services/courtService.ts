import { db } from "@/lib/firebase";
import { Court, MatchResult } from "@/types/beach-tennis";
import { ref, onValue, update, set, push, query, orderByChild, equalTo } from "firebase/database";

const COURTS_PATH = "courts";
const RESULTS_PATH = "results";

export const courtService = {
    subscribeToCourts: (callback: (data: Court[]) => void) => {
        const courtsRef = ref(db, COURTS_PATH);
        return onValue(courtsRef, (snapshot) => {
            const data = snapshot.val();
            const courts: Court[] = data ? Object.values(data) : [];
            callback(courts);
        });
    },

    subscribeByTournament: (tournamentId: string, callback: (data: Court[]) => void) => {
        const courtsQuery = query(ref(db, COURTS_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        return onValue(courtsQuery, (snapshot) => {
            const data = snapshot.val();
            const courts: Court[] = data ? Object.values(data) : [];
            callback(courts);
        });
    },

    getByTournamentOnce: async (tournamentId: string): Promise<Court[]> => {
        const courtsQuery = query(ref(db, COURTS_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        return new Promise((resolve) => {
            onValue(courtsQuery, (snapshot) => {
                const data = snapshot.val();
                const courts: Court[] = data ? Object.values(data) : [];
                resolve(courts);
            }, { onlyOnce: true });
        });
    },

    create: async (court: Omit<Court, "id" | "status" | "currentMatch">) => {
        const courtsRef = ref(db, COURTS_PATH);
        const newCourtRef = push(courtsRef);
        const newCourt: Court = {
            ...court,
            id: newCourtRef.key!,
            status: 'livre',
        };
        await set(newCourtRef, newCourt);
        return newCourtRef.key;
    },

    subscribeToResults: (callback: (data: MatchResult[]) => void) => {
        const resultsRef = ref(db, RESULTS_PATH);
        return onValue(resultsRef, (snapshot) => {
            const data = snapshot.val();
            const results: MatchResult[] = data ? Object.values(data) : [];
            callback(results.reverse()); // Show newest first
        });
    },

    updateScore: async (courtId: string, updates: Partial<Court['currentMatch']>) => {
        if (!updates) return;
        const matchRef = ref(db, `${COURTS_PATH}/${courtId}/currentMatch`);
        await update(matchRef, updates);
    },

    updateStatus: async (courtId: string, status: Court['status']) => {
        const statusRef = ref(db, `${COURTS_PATH}/${courtId}`);
        await update(statusRef, { status });
    },

    updateName: async (courtId: string, name: string) => {
        const nameRef = ref(db, `${COURTS_PATH}/${courtId}`);
        await update(nameRef, { name });
    },

    validatePin: async (pin: string): Promise<Court | null> => {
        const courtsQuery = query(ref(db, COURTS_PATH), orderByChild("pin"), equalTo(pin));
        return new Promise((resolve) => {
            onValue(courtsQuery, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Return the first matching court
                    const courts = Object.values(data) as Court[];
                    resolve(courts[0]);
                } else {
                    resolve(null);
                }
            }, { onlyOnce: true });
        });
    },

    // Helper to initialize courts if empty (can be part of Admin setup later)
    initializeCourts: async (courts: Court[]) => {
        const courtsRef = ref(db, COURTS_PATH);
        const updates: Record<string, any> = {};
        courts.forEach(court => {
            updates[court.id] = court;
        });
        await update(courtsRef, updates);
    },

    remove: async (courtId: string) => {
        const courtRef = ref(db, `${COURTS_PATH}/${courtId}`);
        await set(courtRef, null);
    }
};
