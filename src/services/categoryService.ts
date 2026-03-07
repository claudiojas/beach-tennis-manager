import { db } from "@/lib/firebase";
import { ref, push, set, onValue, remove, get } from "firebase/database";

const DB_PATH = "categories";

export interface GlobalCategory {
    id: string;
    name: string;
    createdAt: number;
}

export const categoryService = {
    create: async (name: string) => {
        const categoriesRef = ref(db, DB_PATH);
        const newCategoryRef = push(categoriesRef);
        const nameUpper = name.trim().toUpperCase();

        // Check if already exists (basic client side check)
        const snapshot = await get(categoriesRef);
        const data = snapshot.val();
        if (data) {
            const exists = Object.values(data).some((cat: any) => cat.name === nameUpper);
            if (exists) {
                throw new Error("Categoria já existe");
            }
        }

        await set(newCategoryRef, {
            id: newCategoryRef.key,
            name: nameUpper,
            createdAt: Date.now()
        });
        return newCategoryRef.key;
    },

    ensureExists: async (name: string) => {
        const nameUpper = name.trim().toUpperCase();
        if (!nameUpper) return;

        const categoriesRef = ref(db, DB_PATH);
        const snapshot = await get(categoriesRef);
        const data = snapshot.val();

        const exists = data && Object.values(data).some((cat: any) => cat.name === nameUpper);

        if (!exists) {
            const newCategoryRef = push(categoriesRef);
            await set(newCategoryRef, {
                id: newCategoryRef.key,
                name: nameUpper,
                createdAt: Date.now()
            });
        }
    },

    getAllOnce: async (): Promise<GlobalCategory[]> => {
        const categoriesRef = ref(db, DB_PATH);
        const snapshot = await get(categoriesRef);
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data);
    },

    delete: async (id: string) => {
        // 1. Find the category name first
        const categoryRef = ref(db, `${DB_PATH}/${id}`);
        const categorySnapshot = await get(categoryRef);
        const categoryData = categorySnapshot.val();

        if (categoryData && categoryData.name) {
            const catName = categoryData.name;

            // 2. Fetch all athletes to perform cascading removal
            const athletesRef = ref(db, "athletes");
            const athletesSnapshot = await get(athletesRef);
            const athletesData = athletesSnapshot.val();

            if (athletesData) {
                const updates: Record<string, any> = {};

                Object.entries(athletesData).forEach(([athleteId, athlete]: [string, any]) => {
                    let hasChanged = false;
                    const newCategories = (athlete.categories || []).filter((c: string) => c !== catName);

                    if (newCategories.length !== (athlete.categories || []).length) {
                        updates[`athletes/${athleteId}/categories`] = newCategories;
                        // Also update primary 'category' field if it matches
                        if (athlete.category === catName) {
                            updates[`athletes/${athleteId}/category`] = newCategories[0] || "";
                        }
                    }
                });

                // Apply all updates in a single transaction-like operation if possible, 
                // or just use update() on root
                if (Object.keys(updates).length > 0) {
                    const rootRef = ref(db);
                    const { update } = await import("firebase/database");
                    await update(rootRef, updates);
                }
            }
        }

        // 3. Finally delete the global category entry
        await remove(categoryRef);
    },

    subscribe: (callback: (categories: GlobalCategory[]) => void) => {
        const categoriesRef = ref(db, DB_PATH);
        return onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }
            const categoryList: GlobalCategory[] = Object.values(data);
            callback(categoryList.sort((a, b) => a.name.localeCompare(b.name)));
        });
    },
};
