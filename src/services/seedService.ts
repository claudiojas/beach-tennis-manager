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

        const shirtSizes = ["P", "M", "G", "GG"];
        const shoeSizes = ["37", "38", "39", "40", "41", "42", "43", "44"];
        const femaleShoeSizes = ["34", "35", "36", "37", "38", "39"];

        // Generate Men (120)
        for (let i = 0; i < 120; i++) {
            const index = i % maleNames.length;
            const name = i < maleNames.length ? maleNames[index] : `${maleNames[index]} ${Math.floor(i / maleNames.length) + 1}`;
            const id = `seed_m_${i}`;
            const cat = adultCategories[i % adultCategories.length];
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat],
                gender: "Masculino",
                shirtSize: shirtSizes[i % shirtSizes.length],
                shoeSize: shoeSizes[i % shoeSizes.length],
                createdAt: Date.now()
            };
        }

        // Generate Women (120)
        for (let i = 0; i < 120; i++) {
            const index = i % femaleNames.length;
            const name = i < femaleNames.length ? femaleNames[index] : `${femaleNames[index]} ${Math.floor(i / femaleNames.length) + 1}`;
            const id = `seed_f_${i}`;
            const cat = adultCategories[i % adultCategories.length];
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat],
                gender: "Feminino",
                shirtSize: shirtSizes[i % shirtSizes.length],
                shoeSize: femaleShoeSizes[i % femaleShoeSizes.length],
                createdAt: Date.now()
            };
        }

        // Generate Kids (60)
        for (let i = 0; i < 60; i++) {
            const index = i % kidsNames.length;
            const name = i < kidsNames.length ? kidsNames[index] : `${kidsNames[index]} ${Math.floor(i / kidsNames.length) + 1}`;
            const id = `seed_k_${i}`;
            const cat = kidsCategories[i % kidsCategories.length];
            const isFemale = i % 2 === 0;
            newAthletes[id] = {
                id,
                name,
                registrationNumber: (regCount++).toString().padStart(3, '0'),
                categories: [cat],
                gender: isFemale ? "Feminino" : "Masculino",
                shirtSize: "PP",
                shoeSize: (30 + (i % 5)).toString(),
                createdAt: Date.now()
            };
        }

        await set(athletesRef, newAthletes);
        return true;
    }
};
