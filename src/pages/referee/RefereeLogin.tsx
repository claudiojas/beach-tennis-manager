import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { courtService } from "@/services/courtService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function RefereeLogin() {
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length < 4) {
            toast.error("O PIN deve ter 4 dígitos.");
            return;
        }

        setIsLoading(true);
        try {
            const court = await courtService.validatePin(pin);
            if (court) {
                toast.success(`Acesso liberado: ${court.name}`);
                // Save court info to localStorage (simple auth for now)
                localStorage.setItem("referee_court", JSON.stringify(court));
                navigate("/arbitro/painel");
            } else {
                toast.error("PIN inválido. Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao validar acesso.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
            <div className="mb-8 scale-150">
                <Logo />
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Área do Árbitro</CardTitle>
                    <CardDescription>
                        Digite o PIN da quadra para acessar o painel de controle.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0000"
                                    className="pl-10 text-center text-2xl tracking-widest h-14"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.slice(0, 4))}
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                "Entrar na Quadra"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
