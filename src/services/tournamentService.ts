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
                ? (Object.values(data) as Tournament[]).sort((a, b) => a.createdAt - b.createdAt) // Older first
                : [];
            callback(tournaments);
        });
    },

    update: async (id: string, data: Partial<Tournament>) => {
        const tournamentRef = ref(db, `${DB_PATH}/${id}`);
        await update(tournamentRef, data);
    },

    delete: async (id: string) => {
        const updates: Record<string, null> = {};

        // 1. Mark tournament for deletion
        updates[`${DB_PATH}/${id}`] = null;

        // 2. Find and mark associated matches
        const matchesQuery = query(ref(db, "matches"), orderByChild("tournamentId"), equalTo(id));
        const matchesSnapshot = await get(matchesQuery);
        if (matchesSnapshot.exists()) {
            Object.keys(matchesSnapshot.val()).forEach(matchId => {
                updates[`matches/${matchId}`] = null;
            });
        }

        // 3. Find and mark associated courts
        const courtsQuery = query(ref(db, "courts"), orderByChild("tournamentId"), equalTo(id));
        const courtsSnapshot = await get(courtsQuery);
        if (courtsSnapshot.exists()) {
            Object.keys(courtsSnapshot.val()).forEach(courtId => {
                updates[`courts/${courtId}`] = null;
            });
        }

        // 4. Perform atomic update
        await update(ref(db), updates);
    },

    uploadLogo: async (id: string, file: File): Promise<string> => {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "sponsors";

        const fileName = `tournaments/${id}/logo_${Date.now()}.png`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': file.type
            },
            body: file
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Falha no upload para o Supabase: ${errorData.message || response.statusText}`);
        }

        return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileName}`;
    }
};
