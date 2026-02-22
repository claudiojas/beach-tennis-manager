import { db, storage } from "@/lib/firebase";
import { Sponsor } from "@/types/beach-tennis";
import { ref, push, set, onValue, remove, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const SPONSORS_PATH = "sponsors";

export const sponsorService = {
    /**
     * Faz o upload da imagem e cria o registro do patrocinador
     */
    create: async (name: string, imageFile: File, tournamentId?: string) => {
        const sponsorsRef = ref(db, SPONSORS_PATH);
        const newSponsorRef = push(sponsorsRef);
        const sponsorId = newSponsorRef.key!;

        // 1. Upload para o Firebase Storage
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${sponsorId}.${fileExtension}`;
        const fileRef = storageRef(storage, `sponsors/${fileName}`);

        const uploadResult = await uploadBytes(fileRef, imageFile);
        const logoUrl = await getDownloadURL(uploadResult.ref);

        // 2. Salva no Realtime Database
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
     * Monitora patrocinadores (Realtime)
     */
    subscribeAll: (callback: (sponsors: Sponsor[]) => void) => {
        return onValue(ref(db, SPONSORS_PATH), (snapshot) => {
            const data = snapshot.val();
            const sponsors: Sponsor[] = data ? Object.values(data) : [];
            callback(sponsors.sort((a, b) => b.createdAt - a.createdAt));
        });
    },

    /**
     * Remove um patrocinador (Imagem + Registro)
     */
    delete: async (sponsorId: string) => {
        // 1. Pega os dados para saber a URL da imagem
        const sponsorRef = ref(db, `${SPONSORS_PATH}/${sponsorId}`);
        const snapshot = await get(sponsorRef);

        if (snapshot.exists()) {
            const sponsor = snapshot.val() as Sponsor;

            // 2. Tenta deletar a imagem do Storage
            try {
                // Extrai o nome do arquivo da URL do Firebase Storage
                const fileRef = storageRef(storage, sponsor.logoUrl);
                await deleteObject(fileRef);
            } catch (error) {
                console.warn("Erro ao deletar imagem do storage (ou imagem fixa):", error);
            }

            // 3. Deleta do Database
            await remove(sponsorRef);
        }
    }
};
