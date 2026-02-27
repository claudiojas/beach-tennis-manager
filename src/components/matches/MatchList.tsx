import { useEffect, useState } from "react";
import { Match, Court } from "@/types/beach-tennis";
import { matchService } from "@/services/matchService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, PlayCircle, Pencil, Trash2, MapPin, Unlock, Check, X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { shortenName } from "@/lib/utils/nameUtils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MatchListProps {
    tournamentId: string;
    courts: Court[];
    matches: Match[]; // Added matches prop
    onEdit: (match: Match) => void;
}

export function MatchList({ tournamentId, courts, matches, onEdit }: MatchListProps) {
    const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
    const [matchToRelease, setMatchToRelease] = useState<Match | null>(null);
    const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
    const [tempScore, setTempScore] = useState<{
        setsA: number;
        setsB: number;
        pointsA: string | number;
        pointsB: string | number;
    } | null>(null);

    const handleStartEditScore = (match: Match) => {
        setEditingScoreId(match.id);
        setTempScore({
            setsA: match.setsA,
            setsB: match.setsB,
            pointsA: match.pointsA,
            pointsB: match.pointsB
        });
    };

    const handleSaveScore = async (matchId: string) => {
        if (!tempScore) return;
        try {
            await matchService.update(matchId, {
                setsA: Number(tempScore.setsA),
                setsB: Number(tempScore.setsB),
                pointsA: tempScore.pointsA,
                pointsB: tempScore.pointsB
            });
            toast.success("Placar atualizado!");
            setEditingScoreId(null);
            setTempScore(null);
        } catch (error) {
            toast.error("Erro ao atualizar placar.");
        }
    };

    // Removed internal fetching


    const handleDelete = async () => {
        if (!matchToDelete) return;
        try {
            await matchService.remove(matchToDelete);
            toast.success("Partida removida com sucesso!");
        } catch (error) {
            toast.error("Erro ao remover partida.");
        } finally {
            setMatchToDelete(null);
        }
    };

    const getStatusInfo = (status: Match['status']) => {
        switch (status) {
            case 'ongoing':
                return { label: 'Em Andamento', color: 'bg-green-500', icon: PlayCircle };
            case 'finished':
                return { label: 'Finalizada', color: 'bg-gray-500', icon: CheckCircle2 };
            default:
                return { label: 'Planejada', color: 'bg-yellow-500', icon: CalendarClock };
        }
    };

    const getCourtName = (courtId?: string) => {
        if (!courtId) return "Não definida";
        return courts.find(c => c.id === courtId)?.name || "Não definida";
    };

    if (matches.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Nenhuma partida agendada.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {matches.map((match) => {
                    const status = getStatusInfo(match.status);
                    const StatusIcon = status.icon;

                    return (
                        <Card key={match.id} className="overflow-hidden group">
                            <div className={`h-2 w-full ${status.color}`} />
                            <CardContent className="p-4">
                                {/* Header Row: Status + Actions */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                            Cat {match.category}
                                        </Badge>
                                        {match.group && (
                                            <Badge variant="outline" className="font-bold border-primary/50 text-primary">
                                                Grupo {match.group}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-1">
                                        {editingScoreId === match.id ? (
                                            <>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSaveScore(match.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingScoreId(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {match.status === 'ongoing' && match.controlledBy && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                        onClick={() => setMatchToRelease(match)}
                                                        title="Forçar Liberação de Dispositivo"
                                                    >
                                                        <Unlock className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-primary"
                                                    onClick={() => handleStartEditScore(match)}
                                                    title="Editar Placar"
                                                >
                                                    <Trophy className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(match)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMatchToDelete(match.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Court & Time Info (if exists) */}
                                {(match.courtId || match.startTime) && (
                                    <div className="mb-4 flex justify-end">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {match.courtId && (
                                                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {getCourtName(match.courtId)}
                                                </span>
                                            )}
                                            {match.startTime && (
                                                <span className="text-xs text-muted-foreground border px-2 py-1 rounded flex items-center gap-1">
                                                    <CalendarClock className="h-3 w-3" />
                                                    {format(new Date(match.startTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Match Players & Score */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                                        {/* Team A */}
                                        <div className="text-right flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate uppercase">{shortenName(match.teamA.player1.name)}</p>
                                            {match.teamA.player2 && <p className="text-[10px] text-muted-foreground truncate uppercase">{shortenName(match.teamA.player2.name)}</p>}
                                            <div className="mt-1 flex justify-end items-center gap-1.5">
                                                {match.serving === 'teamA' && !editingScoreId && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                                                {editingScoreId === match.id ? (
                                                    <input
                                                        type="text"
                                                        className="w-12 h-10 bg-white border border-primary/20 rounded text-center text-xl font-black text-primary"
                                                        value={tempScore?.pointsA}
                                                        onChange={(e) => setTempScore(prev => prev ? { ...prev, pointsA: e.target.value } : null)}
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-black text-primary tabular-nums">{match.pointsA}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sets Indicator */}
                                        <div className="px-6 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Sets</span>
                                            <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                {editingScoreId === match.id ? (
                                                    <>
                                                        <input
                                                            type="number"
                                                            className="w-10 h-8 bg-white border border-black/10 rounded text-center font-black"
                                                            value={tempScore?.setsA}
                                                            onChange={(e) => setTempScore(prev => prev ? { ...prev, setsA: parseInt(e.target.value) || 0 } : null)}
                                                        />
                                                        <span className="text-muted-foreground/30 text-xs">/</span>
                                                        <input
                                                            type="number"
                                                            className="w-10 h-8 bg-white border border-black/10 rounded text-center font-black"
                                                            value={tempScore?.setsB}
                                                            onChange={(e) => setTempScore(prev => prev ? { ...prev, setsB: parseInt(e.target.value) || 0 } : null)}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xl font-black">{match.setsA}</span>
                                                        <span className="text-muted-foreground/30 text-xs">/</span>
                                                        <span className="text-xl font-black">{match.setsB}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Team B */}
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate uppercase">{shortenName(match.teamB.player1.name)}</p>
                                            {match.teamB.player2 && <p className="text-[10px] text-muted-foreground truncate uppercase">{shortenName(match.teamB.player2.name)}</p>}
                                            <div className="mt-1 flex justify-start items-center gap-1.5">
                                                {editingScoreId === match.id ? (
                                                    <input
                                                        type="text"
                                                        className="w-12 h-10 bg-white border border-primary/20 rounded text-center text-xl font-black text-primary"
                                                        value={tempScore?.pointsB}
                                                        onChange={(e) => setTempScore(prev => prev ? { ...prev, pointsB: e.target.value } : null)}
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-black text-primary tabular-nums">{match.pointsB}</span>
                                                )}
                                                {match.serving === 'teamB' && !editingScoreId && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* History Sets */}
                                    {match.historySets && match.historySets.length > 0 && (
                                        <div className="flex justify-center gap-2">
                                            {match.historySets.map((s, i) => (
                                                <span key={i} className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                    {s.scoreA}-{s.scoreB}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={!!matchToDelete} onOpenChange={() => setMatchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A partida será removida permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!matchToRelease} onOpenChange={() => setMatchToRelease(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Forçar Liberação de Dispositivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá remover a trava de segurança do celular do árbitro sem encerrar a partida e sem perder o placar atual. Utilize apenas se o dispositivo original estiver inacessível.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (matchToRelease) {
                                    await matchService.releaseMatch(matchToRelease.id);
                                    toast.success("Partida liberada para novos dispositivos!");
                                    setMatchToRelease(null);
                                }
                            }}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                            Liberar Controle
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
