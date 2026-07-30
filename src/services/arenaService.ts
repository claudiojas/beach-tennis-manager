import { db } from "@/lib/firebase";
import { Arena } from "@/types/beach-tennis";
import { ref, push, set, onValue, query, orderByChild, update, remove } from "firebase/database";

const DB_PATH = "arenas";

export const arenaService = {
    create: async (arena: Omit<Arena, "id" | "createdAt">) => {
        const arenasRef = ref(db, DB_PATH);
        const newArenaRef = push(arenasRef);
        const newArena: Arena = {
            ...arena,
            id: newArenaRef.key!,
            createdAt: Date.now(),
        };

        // Firebase Realtime DB não aceita 'undefined', removemos essas chaves:
        const safeArena = Object.fromEntries(
            Object.entries(newArena).filter(([_, v]) => v !== undefined)
        );

        await set(newArenaRef, safeArena);
        return newArenaRef.key;
    },

    update: async (id: string, data: Partial<Arena>) => {
        const arenaRef = ref(db, `${DB_PATH}/${id}`);
        await update(arenaRef, data);
    },

    delete: async (id: string) => {
        const arenaRef = ref(db, `${DB_PATH}/${id}`);
        await remove(arenaRef);
    },

    subscribe: (callback: (data: Arena[]) => void) => {
        const arenasRef = query(ref(db, DB_PATH), orderByChild("name"));
        return onValue(arenasRef, (snapshot) => {
            const data = snapshot.val();
            const arenas: Arena[] = data
                ? Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name)) as Arena[]
                : [];
            callback(arenas);
        });
    },

    getAllOnce: async (): Promise<Arena[]> => {
        return new Promise((resolve) => {
            const arenasRef = query(ref(db, DB_PATH), orderByChild("name"));
            onValue(arenasRef, (snapshot) => {
                const data = snapshot.val();
                const arenas: Arena[] = data
                    ? Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name)) as Arena[]
                    : [];
                resolve(arenas);
            }, { onlyOnce: true });
        });
    },

    uploadLogo: async (id: string, file: File): Promise<string> => {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "sponsors";

        const fileName = `arenas/${id}/logo_${Date.now()}.png`;
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
