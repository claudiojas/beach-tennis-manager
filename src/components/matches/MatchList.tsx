import { useEffect, useState } from "react";
import { Match, Court } from "@/types/beach-tennis";
import { matchService } from "@/services/matchService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, PlayCircle, Pencil, Trash2, MapPin, Check, X, Trophy, MoreVertical } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MatchListProps {
    tournamentId: string;
    courts: Court[];
    matches: Match[]; // Added matches prop
    onEdit: (match: Match) => void;
}

export function MatchList({ tournamentId, courts, matches, onEdit }: MatchListProps) {
    const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
    const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
    const [tempScore, setTempScore] = useState<{
        setsA: number;
        setsB: number;
        pointsA: string | number;
        pointsB: string | number;
        status: Match['status'];
        courtId?: string;
    } | null>(null);

    const handleStartEditScore = (match: Match) => {
        setEditingScoreId(match.id);
        setTempScore({
            setsA: match.setsA,
            setsB: match.setsB,
            pointsA: match.pointsA,
            pointsB: match.pointsB,
            status: match.status,
            courtId: match.courtId
        });
    };

    const handleSaveScore = async (matchId: string) => {
        if (!tempScore) return;

        /* Removed strict courtId check for Admin */

        try {
            await matchService.update(matchId, {
                setsA: Number(tempScore.setsA),
                setsB: Number(tempScore.setsB),
                pointsA: tempScore.pointsA,
                pointsB: tempScore.pointsB,
                status: tempScore.status,
                courtId: tempScore.courtId
            });
            toast.success("Partida atualizada!");
            setEditingScoreId(null);
            setTempScore(null);
        } catch (error) {
            toast.error("Erro ao atualizar partida. Verifique a conexão.");
        }
    };
    const handleQuickFinish = async (matchId: string) => {
        try {
            await matchService.update(matchId, { status: 'finished' });
            toast.success("Partida marcada como finalizada!");
        } catch (error) {
            toast.error("Erro ao finalizar partida.");
        }
    };

    const handleQuickStart = async (matchId: string) => {
        try {
            await matchService.update(matchId, { status: 'ongoing' });
            toast.success("Partida iniciada!");
        } catch (error) {
            toast.error("Erro ao iniciar partida.");
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
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                {matches.map((match) => {
                    const status = getStatusInfo(match.status);
                    const StatusIcon = status.icon;

                    return (
                        <Card key={match.id} className={`overflow-hidden group transition-all duration-300 ${match.status === 'finished' ? 'opacity-70 bg-muted/30 scale-[0.98]' : ''}`}>
                            <div className={`h-2 w-full ${status.color}`} />
                            <CardContent className="p-4">
                                {/* Header Row: Status + Actions */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <Badge variant="outline" className="flex items-center gap-1 text-[9px] px-1.5 h-5 bg-background shadow-sm border-muted-foreground/20">
                                            <StatusIcon className="h-2.5 w-2.5" />
                                            <span className="font-bold">{status.label}</span>
                                        </Badge>
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[9px] px-1.5 h-5 font-black uppercase">
                                            Cat {match.category}
                                        </Badge>
                                        {match.group && (
                                            <Badge variant="outline" className="font-black border-primary/30 text-primary text-[9px] px-1.5 h-5 bg-primary/5 uppercase">
                                                Gr {match.group}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-1.5 items-center">
                                        {editingScoreId === match.id ? (
                                            <div className="flex bg-white/50 backdrop-blur rounded-full p-0.5 border shadow-sm">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full" onClick={() => handleSaveScore(match.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-red-50 rounded-full" onClick={() => setEditingScoreId(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur rounded-full p-0.5 border shadow-sm">
                                                {/* Common quick action based on status */}
                                                {match.status === 'planned' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                                                        onClick={() => handleQuickStart(match.id)}
                                                    >
                                                        <PlayCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {match.status === 'ongoing' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50"
                                                        onClick={() => handleQuickFinish(match.id)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => handleStartEditScore(match)}>
                                                            <Trophy className="mr-2 h-4 w-4 text-primary" /> Editar Placar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onEdit(match)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar Jogo
                                                        </DropdownMenuItem>
                                                        {match.status === 'planned' && (
                                                            <DropdownMenuItem onClick={() => handleQuickStart(match.id)}>
                                                                <PlayCircle className="mr-2 h-4 w-4 text-blue-500" /> Iniciar Agora
                                                            </DropdownMenuItem>
                                                        )}
                                                        {match.status === 'ongoing' && (
                                                            <DropdownMenuItem onClick={() => handleQuickFinish(match.id)}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Finalizar Agora
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setMatchToDelete(match.id)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Partida
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Court & Time Info (if exists) */}
                                {editingScoreId === match.id ? (
                                    <div className="mb-4 flex flex-col gap-3 bg-primary/5 p-3 rounded-xl border border-primary/10">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Status do Jogo</label>
                                                <select
                                                    className="w-full h-9 bg-white border border-primary/20 rounded-lg text-xs font-bold px-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={tempScore?.status}
                                                    onChange={(e) => setTempScore(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                                                >
                                                    <option value="planned">Planejado (WAIT)</option>
                                                    <option value="ongoing">Em Jogo (LIVE)</option>
                                                    <option value="finished">Finalizado (FIM)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Local (Quadra)</label>
                                                <select
                                                    className="w-full h-9 bg-white border border-primary/20 rounded-lg text-xs font-bold px-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={tempScore?.courtId || ""}
                                                    onChange={(e) => setTempScore(prev => prev ? { ...prev, courtId: e.target.value } : null)}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {courts.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {match.startTime && (
                                            <div className="text-[10px] text-muted-foreground bg-white/50 p-1.5 rounded-lg border border-dashed flex items-center justify-center gap-2">
                                                <CalendarClock className="h-3 w-3" />
                                                Agendado para: {format(new Date(match.startTime), "dd/MM HH:mm")}
                                            </div>
                                        )}
                                    </div>
                                ) : (match.courtId || match.startTime) && (
                                    <div className="mb-4 flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-dashed border-muted-foreground/10">
                                        <div className="flex flex-wrap gap-2 w-full justify-between items-center">
                                            {match.startTime && (
                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-tight">
                                                    <CalendarClock className="h-3 w-3 text-primary/50" />
                                                    {format(new Date(match.startTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            )}
                                            {match.courtId && (
                                                <Badge variant="outline" className="text-[10px] font-black border-none bg-primary/5 text-primary rounded-lg flex items-center gap-1.5 shadow-sm">
                                                    <MapPin className="h-3 w-3" />
                                                    {getCourtName(match.courtId)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Match Players & Score */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 md:bg-secondary/5 p-4 rounded-[20px] border border-muted/30 shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 md:hidden" />

                                        {/* Team A */}
                                        <div className="text-right flex-1 min-w-0 pr-2">
                                            <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamA.player1.name)}</p>
                                            {match.teamA.player2 && <p className="text-[10px] text-muted-foreground truncate uppercase font-bold opacity-70 leading-tight">{shortenName(match.teamA.player2.name)}</p>}
                                            <div className="mt-2 flex justify-end items-center gap-2">
                                                {match.serving === 'teamA' && !editingScoreId && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_12px_rgba(234,179,8,0.8)] border border-yellow-200" />}
                                                {editingScoreId === match.id ? (
                                                    <input
                                                        type="text"
                                                        className="w-14 h-12 bg-white border-2 border-primary/20 rounded-xl text-center text-2xl font-black text-primary shadow-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        value={tempScore?.pointsA}
                                                        onChange={(e) => setTempScore(prev => prev ? { ...prev, pointsA: e.target.value } : null)}
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-black text-primary tabular-nums tracking-tighter drop-shadow-sm">{match.pointsA}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sets Indicator */}
                                        <div className="px-3 md:px-6 flex flex-col items-center bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-muted shadow-sm flex-shrink-0">
                                            <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Sets</span>
                                            <div className="flex items-center gap-1.5">
                                                {editingScoreId === match.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            className="w-12 h-10 bg-white border-2 border-black/5 rounded-xl text-center font-black text-lg focus:border-primary/30 outline-none"
                                                            value={tempScore?.setsA}
                                                            onChange={(e) => setTempScore(prev => prev ? { ...prev, setsA: parseInt(e.target.value) || 0 } : null)}
                                                        />
                                                        <span className="text-muted-foreground/40 font-black">-</span>
                                                        <input
                                                            type="number"
                                                            className="w-12 h-10 bg-white border-2 border-black/5 rounded-xl text-center font-black text-lg focus:border-primary/30 outline-none"
                                                            value={tempScore?.setsB}
                                                            onChange={(e) => setTempScore(prev => prev ? { ...prev, setsB: parseInt(e.target.value) || 0 } : null)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-slate-800 leading-none">{match.setsA}</span>
                                                        <div className="w-px h-6 bg-muted-foreground/20 rotate-12" />
                                                        <span className="text-2xl font-black text-slate-800 leading-none">{match.setsB}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Team B */}
                                        <div className="text-left flex-1 min-w-0 pl-2">
                                            <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamB.player1.name)}</p>
                                            {match.teamB.player2 && <p className="text-[10px] text-muted-foreground truncate uppercase font-bold opacity-70 leading-tight">{shortenName(match.teamB.player2.name)}</p>}
                                            <div className="mt-2 flex justify-start items-center gap-2">
                                                {editingScoreId === match.id ? (
                                                    <input
                                                        type="text"
                                                        className="w-14 h-12 bg-white border-2 border-primary/20 rounded-xl text-center text-2xl font-black text-primary shadow-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        value={tempScore?.pointsB}
                                                        onChange={(e) => setTempScore(prev => prev ? { ...prev, pointsB: e.target.value } : null)}
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-black text-primary tabular-nums tracking-tighter drop-shadow-sm">{match.pointsB}</span>
                                                )}
                                                {match.serving === 'teamB' && !editingScoreId && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_12px_rgba(234,179,8,0.8)] border border-yellow-200" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* History Sets */}
                                    {match.historySets && match.historySets.length > 0 && (
                                        <div className="flex justify-center flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-300">
                                            {match.historySets.map((s, i) => (
                                                <Badge key={i} variant="secondary" className="text-[9px] font-black tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-2 rounded-lg">
                                                    SET {i + 1}: {s.scoreA}-{s.scoreB}
                                                </Badge>
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

        </>
    );
}
