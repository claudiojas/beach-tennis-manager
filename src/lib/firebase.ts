import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "http://127.0.0.1:9000?ns=demo-project"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Conectar aos emuladores se estiver em modo de simulação/local
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("🚀 Conectado aos Emuladores do Firebase (Local)");
}

