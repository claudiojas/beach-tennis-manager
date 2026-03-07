import { db } from "@/lib/firebase";
import { ref, set, remove } from "firebase/database";

const DB_PATH = "athletes";

const maleNames = [
    "Ricardo Silva", "Marcelo Santos", "Gustavo Oliveira", "Felipe Almeida", "Bruno Costa",
    "André Ferreira", "Rafael Gomes", "Rodrigo Rocha", "Thiago Martins", "Lucas Pereira",
    "Eduardo Souza", "Renato Lima", "Carlos Júnior", "Marcos Paulo", "Sérgio Magalhães",
    "Daniel Borba", "Hugo Viana", "Otávio Neto", "Vinícius Cruz", "Gabriel Medeiros",
    "Alexandre Pires", "Caio Castro", "Diego Hipólito", "Enzo Celulari", "Fabiano Oliveira",
    "Gilberto Gil", "Igor Rickli", "João Guilherme", "Kleber Toledo", "Luan Santana"
];

const femaleNames = [
    "Beatriz Ramos", "Camila Nunes", "Fernanda Borges", "Juliana Paes", "Larissa Porto",
    "Mariana Viegas", "Natália Duarte", "Patrícia Melo", "Sabrina Mendes", "Tatiana Carvalho",
    "Vanessa Lima", "Carolina Ferraz", "Aline Moraes", "Isabela Rios", "Letícia Castro",
    "Renata Arantes", "Priscila Vaz", "Monique Dias", "Clarissa Lins", "Helena Farias",
    "Adriana Esteves", "Bianca Bin", "Cleo Pires", "Deborah Secco", "Emanuelle Araújo",
    "Flávia Alessandra", "Grazi Massafera", "Ísis Valverde", "Juliana Paiva", "Paolla Oliveira"
];

const kidsNames = [
    "Léo Silva", "Dudu Santos", "Gabi Oliveira", "Biel Almeida", "Juninho Costa",
    "Zeca Ferreira", "Tico Gomes", "Kiko Rocha", "Lulu Martins", "Didi Pereira",
    "Nina Souza", "Tati Lima", "Bia Júnior", "Mimi Paulo", "Pipa Magalhães",
    "Duda Borba", "Lili Viana", "Soso Neto", "Tutu Cruz", "Guga Medeiros"
];

const adultCategories = ["A", "B", "C", "D", "Iniciante", "40+", "50+"];
const kidsCategories = ["Sub-12", "Sub-14", "Sub-16", "Kids Iniciante"];

export const seedService = {
    seedAthletes: async () => {
        const athletesRef = ref(db, DB_PATH);
        await remove(athletesRef);

        const newAthletes: any = {};
        let regCount = 1;

        // Generate Men (30)
        maleNames.forEach((name, index) => {
            const id = `seed_m_${index}`;
            const cat = adultCategories[index % adultCategories.length];
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat, "Mista"],
                createdAt: Date.now()
            };
        });

        // Generate Women (30)
        femaleNames.forEach((name, index) => {
            const id = `seed_f_${index}`;
            const cat = adultCategories[index % adultCategories.length];
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat, "Mista"],
                createdAt: Date.now()
            };
        });

        // Generate Kids (20)
        kidsNames.forEach((name, index) => {
            const id = `seed_k_${index}`;
            const cat = kidsCategories[index % kidsCategories.length];
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat],
                createdAt: Date.now()
            };
        });

        await set(athletesRef, newAthletes);
        return true;
    }
};
