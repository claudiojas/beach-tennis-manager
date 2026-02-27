import { db } from "@/lib/firebase";
import { Player } from "@/types/beach-tennis";
import { ref, push, set, onValue, remove, update, get } from "firebase/database";

const DB_PATH = "athletes";

export const athleteService = {
    create: async (athlete: Omit<Player, "id">) => {
        const athletesRef = ref(db, DB_PATH);

        let registrationNumber = athlete.registrationNumber;

        // Só gera automático se não foi passado manualmente
        if (!registrationNumber) {
            const snapshot = await get(athletesRef);
            const data = snapshot.val();
            let nextNumber = 1;

            if (data) {
                const players = Object.values(data) as Player[];
                const numbers = players
                    .map(p => parseInt(p.registrationNumber || "0"))
                    .filter(n => !isNaN(n));
                if (numbers.length > 0) {
                    nextNumber = Math.max(...numbers) + 1;
                }
            }
            registrationNumber = nextNumber.toString().padStart(2, '0');
        }

        const newAthleteRef = push(athletesRef);
        await set(newAthleteRef, {
            ...athlete,
            id: newAthleteRef.key,
            registrationNumber
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
