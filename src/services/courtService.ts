import { db } from "@/lib/firebase";
import { Court, MatchResult } from "@/types/beach-tennis";
import { ref, onValue, update, set } from "firebase/database";

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

    // Helper to initialize courts if empty (can be part of Admin setup later)
    initializeCourts: async (courts: Court[]) => {
        const courtsRef = ref(db, COURTS_PATH);
        const updates: Record<string, any> = {};
        courts.forEach(court => {
            updates[court.id] = court;
        });
        await update(courtsRef, updates);
    }
};
