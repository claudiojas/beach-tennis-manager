import { useState } from "react";
import { Match, Court } from "@/types/beach-tennis";
import { matchService } from "@/services/matchService";
import { courtService } from "@/services/courtService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Edit,
    Trash2,
    MapPin,
    Trophy,
    MoreVertical,
    Calculator
} from "lucide-react";
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
    matches: Match[];
    onEdit: (match: Match) => void;
    showDescriptions?: boolean;
}

export function MatchList({ tournamentId, courts, matches, onEdit, showDescriptions }: MatchListProps) {
    const [editingMatchToDelete, setEditingMatchToDelete] = useState<Match | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
    const [tempScore, setTempScore] = useState<{
        setsA: number;
        setsB: number;
    } | null>(null);

    const handleUpdateScore = async (matchId: string) => {
        if (!tempScore) return;

        try {
            // Automatic Finish Logic (CBT Rules)
            let newStatus = 'ongoing' as Match['status'];
            const { setsA, setsB } = tempScore;
            const diff = Math.abs(setsA - setsB);
            const max = Math.max(setsA, setsB);

            // Win conditions: (6 with 2 diff) OR (7 with 1 or 2 diff)
            if ((max >= 6 && diff >= 2) || (max >= 7)) {
                newStatus = 'finished';
            }

            const updateData: any = {
                setsA,
                setsB,
                status: newStatus,
            };

            const match = matches.find(m => m.id === matchId);

            if (newStatus === 'finished') {
                updateData.endTime = Date.now();
                // Liberar quadra
                if (match?.courtId) {
                    await courtService.finishMatch(match.courtId);
                }
            } else if (match?.courtId) {
                // Sincronizar com a quadra no Arena Panel
                await courtService.updateScore(match.courtId, { setsA, setsB, status: newStatus });
            }

            await matchService.update(matchId, updateData);
            setEditingScoreId(null);
            setTempScore(null);
            toast.success(newStatus === 'finished' ? "Partida finalizada!" : "Placar atualizado!");
        } catch (error) {
            toast.error("Erro ao atualizar placar");
        }
    };

    const handleUpdateCourt = async (matchId: string, courtId: string) => {
        try {
            const match = matches.find(m => m.id === matchId);
            const oldCourtId = match?.courtId;

            // Brindagem: Verificação de segurança adicional
            if (courtId) {
                const court = courts.find(c => c.id === courtId);
                if (court?.status === 'em_jogo' && court.id !== oldCourtId) {
                    toast.error("Esta quadra já está sendo usada por outro jogo!");
                    return;
                }
            }

            // Se for "null" ou vazio, libera a quadra antiga e volta para planejado
            if (!courtId) {
                if (oldCourtId) await courtService.finishMatch(oldCourtId);
                await matchService.update(matchId, {
                    courtId: null,
                    status: 'planned',
                    actualStartTime: null
                });
                toast.success("Quadra removida e jogo zerado.");
                return;
            }

            // Se mudou de quadra
            if (oldCourtId && oldCourtId !== courtId) {
                await courtService.finishMatch(oldCourtId);
            }

            // Atualiza status para ongoing e reserva nova quadra
            const newStatus = 'ongoing';
            const actualStartTime = match?.actualStartTime || Date.now();

            // Sincroniza com a quadra
            const updatedMatch = { ...match, courtId, status: newStatus, actualStartTime } as Match;
            await courtService.updateStatus(courtId, 'em_jogo');
            // Coloca o match inteiro no currentMatch da quadra para o Arena Panel ver
            const courtRef = courtService.updateScore(courtId, updatedMatch as any);

            await matchService.update(matchId, {
                courtId,
                status: newStatus,
                actualStartTime
            });

            toast.success("Quadra definida e jogo iniciado!");
        } catch (error) {
            toast.error("Erro ao atualizar quadra");
        }
    };

    const handleDelete = async () => {
        if (!editingMatchToDelete) return;
        try {
            await matchService.remove(editingMatchToDelete.id);
            toast.success("Partida removida!");
            setOpenDeleteConfirm(false);
            setEditingMatchToDelete(null);
        } catch (error) {
            toast.error("Erro ao remover partida");
        }
    };

    const getMatchPurpose = (round: string, pos: number) => {
        const displayPos = pos + 1;
        const nextPos = Math.floor(pos / 2) + 1;

        switch (round) {
            case 'final': return "Grande Final - Vale o título!";
            case 'semi': return `Semifinal ${displayPos} - Vale vaga na Grande Final`;
            case 'quartas': return `Quartas ${displayPos} - Vale vaga na Semifinal ${nextPos}`;
            case 'oitavas': return `Oitavas ${displayPos} - Vale vaga nas Quartas ${nextPos}`;
            default: return null;
        }
    };

    if (matches.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Nenhuma partida agendada.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {matches.map((match) => (
                <Card key={match.id} className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-shadow rounded-3xl">
                    <div className="p-4 md:p-6 space-y-4">
                        {/* Header: Cat, Group & Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {match.group && (
                                    <Badge variant="outline" className="text-[9px] font-black bg-primary/5 text-primary border-primary/10 uppercase px-2 h-5">
                                        Grupo {match.group}
                                    </Badge>
                                )}
                                {showDescriptions && match.round && (
                                    <Badge variant="secondary" className="text-[9px] font-black bg-yellow-500/10 text-yellow-700 border-none px-2 h-5 flex items-center gap-1">
                                        <Trophy className="w-2.5 h-2.5" />
                                        {getMatchPurpose(match.round, match.bracketPosition || 0)}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Status Badge */}
                                {match.status === 'planned' && <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none text-[8px] font-black uppercase tracking-widest px-2">Planejado</Badge>}
                                {match.status === 'ongoing' && (
                                    <Badge className="bg-red-500 text-white hover:bg-red-600 border-none text-[8px] font-black uppercase tracking-widest px-2 animate-pulse">
                                        Ao Vivo
                                    </Badge>
                                )}
                                {match.status === 'finished' && <Badge className="bg-green-100 text-green-600 hover:bg-green-100 border-none text-[8px] font-black uppercase tracking-widest px-2">Finalizado</Badge>}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => onEdit(match)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar Atletas/Hora
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditingMatchToDelete(match); setOpenDeleteConfirm(true); }} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Partida
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Court Selector - Moved to Card */}
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 ml-1" />
                            <select
                                className="bg-transparent text-[11px] font-black uppercase tracking-tight text-slate-600 focus:outline-none flex-1 cursor-pointer"
                                value={match.courtId || ''}
                                onChange={(e) => handleUpdateCourt(match.id, e.target.value)}
                                disabled={match.status === 'finished'}
                            >
                                <option value="">Sem Quadra (Planejado)</option>
                                {courts.map(c => {
                                    // Considera OCUPADA se o status for 'em_jogo' E não for a quadra que este jogo já está usando
                                    const isOccupied = c.status === 'em_jogo' && c.id !== match.courtId;
                                    return (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                            disabled={isOccupied}
                                            className={isOccupied ? "text-slate-300 italic" : ""}
                                        >
                                            {c.name} {isOccupied ? " (OCUPADA)" : ""}
                                        </option>
                                    );
                                })}
                            </select>
                            {match.status === 'ongoing' && (
                                <div className="flex items-center gap-1 mr-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[9px] font-mono text-slate-500">{match.actualStartTime ? format(match.actualStartTime, 'HH:mm') : ''}</span>
                                </div>
                            )}
                        </div>

                        {/* Match Score UI */}
                        <div className="flex items-center justify-between gap-4 py-2">
                            {/* Team A */}
                            <div className="text-right flex-1 min-w-0 pr-2">
                                <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamA.player1.name)}</p>
                                {match.teamA.player2 && <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamA.player2.name)}</p>}
                            </div>

                            {/* Score Indicator */}
                            <div className="px-3 md:px-6 flex flex-col items-center bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-muted shadow-sm flex-shrink-0">
                                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Placar</span>
                                <div className="flex items-center gap-1.5">
                                    {editingScoreId === match.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                className="w-14 h-10 bg-white border-2 border-primary/20 rounded-xl text-center font-black text-xl focus:border-primary/40 outline-none"
                                                value={tempScore?.setsA}
                                                onChange={(e) => setTempScore(prev => prev ? { ...prev, setsA: parseInt(e.target.value) || 0 } : null)}
                                            />
                                            <span className="text-muted-foreground/40 font-black">-</span>
                                            <input
                                                type="number"
                                                className="w-14 h-10 bg-white border-2 border-primary/20 rounded-xl text-center font-black text-xl focus:border-primary/40 outline-none"
                                                value={tempScore?.setsB}
                                                onChange={(e) => setTempScore(prev => prev ? { ...prev, setsB: parseInt(e.target.value) || 0 } : null)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black text-slate-800 leading-none tabular-nums">{match.setsA}</span>
                                            <div className="w-px h-8 bg-muted-foreground/20 rotate-12" />
                                            <span className="text-3xl font-black text-slate-800 leading-none tabular-nums">{match.setsB}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team B */}
                            <div className="text-left flex-1 min-w-0 pl-2">
                                <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamB.player1.name)}</p>
                                {match.teamB.player2 && <p className="font-black text-[13px] md:text-sm truncate uppercase tracking-tight text-slate-800">{shortenName(match.teamB.player2.name)}</p>}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-muted/40">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {match.startTime ? format(match.startTime, "dd MMM - HH:mm", { locale: ptBR }) : "Não agendado"}
                            </span>

                            <div className="flex gap-2">
                                {editingScoreId === match.id ? (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => setEditingScoreId(null)} className="h-10 px-4 rounded-xl font-bold uppercase text-[10px]">
                                            Cancelar
                                        </Button>
                                        <Button size="sm" onClick={() => handleUpdateScore(match.id)} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-primary/20">
                                            Salvar
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditingScoreId(match.id);
                                            setTempScore({ setsA: match.setsA, setsB: match.setsB });
                                        }}
                                        className="h-10 px-6 rounded-xl font-black uppercase text-[10px] bg-slate-50 border-slate-200"
                                    >
                                        <Calculator className="w-3.5 h-3.5 mr-2 text-primary" />
                                        Editar Placar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Partida?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente o jogo da categoria.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEditingMatchToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
