import { db } from "@/lib/firebase";
import { Player } from "@/types/beach-tennis";
import { ref, push, set, onValue, remove, update } from "firebase/database";

const DB_PATH = "athletes";

export const athleteService = {
    create: async (athlete: Omit<Player, "id">) => {
        const athletesRef = ref(db, DB_PATH);
        const newAthleteRef = push(athletesRef);
        await set(newAthleteRef, {
            ...athlete,
            id: newAthleteRef.key,
        });
        return newAthleteRef.key;
    },

    update: async (id: string, startData: Partial<Player>) => {
        const athleteRef = ref(db, `${DB_PATH}/${id}`);
        await update(athleteRef, startData);
    },

    delete: async (id: string) => {
        const athleteRef = ref(db, `${DB_PATH}/${id}`);
        await remove(athleteRef);
    },

    subscribe: (callback: (athletes: Player[]) => void) => {
        const athletesRef = ref(db, DB_PATH);
        return onValue(athletesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }
            const playerList: Player[] = Object.values(data);
            callback(playerList);
        });
    },
};
