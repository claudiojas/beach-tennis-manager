import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function RefereeDashboard() {
    const navigate = useNavigate();

    // Quick auth retrieval (should ideally be in a context)
    const getAuth = () => {
        const stored = localStorage.getItem("beach-tennis-court-auth");
        return stored ? JSON.parse(stored) : null;
    };

    const court = getAuth();

    const handleLogout = () => {
        localStorage.removeItem("beach-tennis-court-auth");
        navigate("/arbitro");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-primary">Painel do Árbitro</h1>
                    <p className="text-sm text-slate-400">{court ? court.name : "Quadra Desconhecida"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white">
                    <LogOut className="w-5 h-5" />
                </Button>
            </header>

            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                    <span className="text-4xl">🦓</span>
                </div>
                <h2 className="text-2xl font-bold">Aguardando Jogo...</h2>
                <p className="text-slate-400 max-w-xs">
                    Nenhuma partida ativa nesta quadra no momento.
                </p>
            </div>
        </div>
    );
}
