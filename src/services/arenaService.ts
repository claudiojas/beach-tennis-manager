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
        await set(newArenaRef, newArena);
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
                ? Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name))
                : [];
            callback(arenas);
        });
    },

    // Get Once for dropdowns/usage
    getAllOnce: async (): Promise<Arena[]> => {
        return new Promise((resolve) => {
            const arenasRef = query(ref(db, DB_PATH), orderByChild("name"));
            onValue(arenasRef, (snapshot) => {
                const data = snapshot.val();
                const arenas: Arena[] = data
                    ? Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name))
                    : [];
                resolve(arenas);
            }, { onlyOnce: true });
        });
    }
};
