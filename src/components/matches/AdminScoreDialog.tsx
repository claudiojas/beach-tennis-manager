import { useState, useEffect } from "react";
import { Match, Court } from "@/types/beach-tennis";
import { matchService } from "@/services/matchService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Clock, CheckCircle2, PlayCircle } from "lucide-react";

interface AdminScoreDialogProps {
    match: Match | null;
    courts: Court[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdminScoreDialog({ match, courts, open, onOpenChange }: AdminScoreDialogProps) {
    const [setsA, setSetsA] = useState(0);
    const [setsB, setSetsB] = useState(0);
    const [status, setStatus] = useState<Match['status']>('planned');
    const [courtId, setCourtId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (match) {
            setSetsA(match.setsA || 0);
            setSetsB(match.setsB || 0);
            setStatus(match.status || 'planned');
            setCourtId(match.courtId || "");
        }
    }, [match]);

    const handleSave = async () => {
        if (!match) return;

        // Validação obrigatória de quadra
        if (!courtId || courtId === "none" || courtId === "") {
            toast.warning("Selecione uma quadra para este jogo antes de salvar.");
            return;
        }

        setIsSubmitting(true);
        try {
            await matchService.update(match.id, {
                setsA: Number(setsA),
                setsB: Number(setsB),
                status,
                courtId: courtId
            });
            toast.success("Placar e status atualizados!");
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao atualizar partida. Verifique os dados.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!match) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Lançar Resultado
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Teams and Scores */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-dashed text-center">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time A</p>
                                <p className="font-bold text-sm leading-tight mb-2 truncate">
                                    {match.teamA.player1.name}
                                    {match.teamA.player2 && <><br /><span className="text-muted-foreground font-medium text-[11px] font-mono">{match.teamA.player2.name}</span></>}
                                </p>
                                <Input
                                    type="number"
                                    className="text-center font-black text-2xl h-12"
                                    value={setsA}
                                    onChange={(e) => setSetsA(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-primary/20 italic">VS</span>
                            </div>

                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time B</p>
                                <p className="font-bold text-sm leading-tight mb-2 truncate">
                                    {match.teamB.player1.name}
                                    {match.teamB.player2 && <><br /><span className="text-muted-foreground font-medium text-[11px] font-mono">{match.teamB.player2.name}</span></>}
                                </p>
                                <Input
                                    type="number"
                                    className="text-center font-black text-2xl h-12"
                                    value={setsB}
                                    onChange={(e) => setSetsB(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Status do Jogo</Label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planned" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 mr-2" /> Planejado
                                    </SelectItem>
                                    <SelectItem value="ongoing" className="flex items-center gap-2">
                                        <PlayCircle className="h-4 w-4 mr-2" /> Em Jogo
                                    </SelectItem>
                                    <SelectItem value="finished" className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizado
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Quadra</Label>
                            <Select value={courtId} onValueChange={setCourtId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {courts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Salvar Resultado"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
