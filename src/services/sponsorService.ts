import { db } from "@/lib/firebase";
import { Sponsor } from "@/types/beach-tennis";
import { ref, push, set, onValue, remove, get } from "firebase/database";

const SPONSORS_PATH = "sponsors";

// Configurações do Supabase extraídas das variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "sponsors";

export const sponsorService = {
    /**
     * Faz o upload da imagem para o Supabase Storage e cria o registro no Firebase
     */
    create: async (name: string, imageFile: File, tournamentId?: string) => {
        const sponsorsRef = ref(db, SPONSORS_PATH);
        const newSponsorRef = push(sponsorsRef);
        const sponsorId = newSponsorRef.key!;

        // 1. Preparar o Upload para o Supabase via REST API
        const fileName = `${sponsorId}.webp`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': imageFile.type
            },
            body: imageFile
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro no Supabase Upload:', errorData);
            throw new Error(`Falha no upload para o Supabase: ${errorData.message || response.statusText}`);
        }

        // 2. Gerar a URL Pública do Supabase
        const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileName}`;

        // 3. Salva no Realtime Database (Firebase)
        const newSponsor: Sponsor = {
            id: sponsorId,
            name,
            logoUrl,
            createdAt: Date.now()
        };

        if (tournamentId) {
            newSponsor.tournamentId = tournamentId;
        }

        await set(newSponsorRef, newSponsor);
        return newSponsor;
    },

    /**
     * Monitora patrocinadores (Realtime via Firebase)
     */
    subscribeAll: (callback: (sponsors: Sponsor[]) => void) => {
        return onValue(ref(db, SPONSORS_PATH), (snapshot) => {
            const data = snapshot.val();
            const sponsors: Sponsor[] = data ? Object.values(data) : [];
            callback(sponsors.sort((a, b) => b.createdAt - a.createdAt));
        });
    },

    /**
     * Remove um patrocinador (Imagem no Supabase + Registro no Firebase)
     */
    delete: async (sponsorId: string) => {
        const sponsorRef = ref(db, `${SPONSORS_PATH}/${sponsorId}`);
        const snapshot = await get(sponsorRef);

        if (snapshot.exists()) {
            const sponsor = snapshot.val() as Sponsor;

            // 1. Tenta deletar a imagem do Supabase Storage via REST
            try {
                const fileName = `${sponsorId}.webp`;
                const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${fileName}`;

                await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY
                    }
                });
            } catch (error) {
                console.warn("Erro ao deletar imagem do Supabase:", error);
            }

            // 2. Deleta do Database (Firebase)
            await remove(sponsorRef);
        }
    }
};
