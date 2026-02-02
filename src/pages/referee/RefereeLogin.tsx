import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { courtService } from "@/services/courtService";
import { toast } from "sonner";
import { Court } from "@/types/beach-tennis";
import { CheckCircle2, Delete, Lock, ArrowLeft } from "lucide-react";

export default function RefereeLogin() {
    const navigate = useNavigate();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin((prev) => prev + num);
        }
    };

    const handleDelete = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length !== 4) return;

        setLoading(true);
        try {
            const court = await courtService.validatePin(pin);

            if (court) {
                // Save session
                localStorage.setItem("beach-tennis-court-auth", JSON.stringify({
                    courtId: court.id,
                    pin: court.pin,
                    name: court.name
                }));

                toast.success(`Bem-vindo à ${court.name}!`);
                navigate("/arbitro/painel");
            } else {
                toast.error("PIN inválido. Tente novamente.");
                setPin("");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao validar PIN.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>

                <div className="p-8 text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Acesso do Árbitro</h1>
                    <p className="text-slate-400 text-sm">Digite o PIN de 4 dígitos da quadra</p>
                </div>

                <div className="p-8 pt-0 space-y-8">
                    {/* PIN Display */}
                    <div className="flex justify-center gap-4 mb-8">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${pin[i]
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-slate-700 bg-slate-800/50 text-slate-500"
                                    }`}
                            >
                                {pin[i] ? "•" : ""}
                            </div>
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <Button
                                key={num}
                                variant="outline"
                                className="h-16 text-2xl font-semibold bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={loading}
                            >
                                {num}
                            </Button>
                        ))}
                        <div className="flex items-center justify-center">
                            {/* Empty space or special char */}
                        </div>
                        <Button
                            variant="outline"
                            className="h-16 text-2xl font-semibold bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                            onClick={() => handleNumberClick("0")}
                            disabled={loading}
                        >
                            0
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-16 text-slate-400 hover:text-white hover:bg-slate-800/50"
                            onClick={handleDelete}
                            disabled={loading || pin.length === 0}
                        >
                            <Delete className="w-6 h-6" />
                        </Button>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold"
                        size="lg"
                        onClick={handleLogin}
                        disabled={pin.length !== 4 || loading}
                    >
                        {loading ? "Validando..." : "Acessar Quadra"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
