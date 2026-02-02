import { useEffect, useState } from "react";
import { Match, Court } from "@/types/beach-tennis";
import { matchService } from "@/services/matchService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, PlayCircle, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <StatusIcon className="h-3 w-3" />
                                        {status.label}
                                    </Badge>

                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(match)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMatchToDelete(match.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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

                                {/* Match Players */}
                                <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-lg">
                                    {/* Team A */}
                                    <div className="text-center flex-1">
                                        <p className="font-semibold text-sm truncate">{match.teamA.player1.name}</p>
                                        {match.teamA.player2 && <p className="text-xs text-muted-foreground truncate">{match.teamA.player2.name}</p>}
                                    </div>

                                    {/* VS */}
                                    <div className="px-4 font-bold text-muted-foreground">VS</div>

                                    {/* Team B */}
                                    <div className="text-center flex-1">
                                        <p className="font-semibold text-sm truncate">{match.teamB.player1.name}</p>
                                        {match.teamB.player2 && <p className="text-xs text-muted-foreground truncate">{match.teamB.player2.name}</p>}
                                    </div>
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
