import { Match, GroupStanding, Team } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { matchService } from "@/services/matchService";
import { toast } from "sonner";
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
import { useState } from "react";

interface GroupStandingsProps {
    tournamentId: string;
    category: string;
    categoryId?: string;
    groupName: string;
    matches: Match[];
    readOnly?: boolean;
}

export function GroupStandings({ tournamentId, category, categoryId, groupName, matches, readOnly }: GroupStandingsProps) {
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    // 1. Identify all unique teams in this group
    const teamMap = new Map<string, { name: string; team: Team }>();
    matches.forEach(m => {
        const idA = m.teamA.player1.id + (m.teamA.player2?.id || '');
        const idB = m.teamB.player1.id + (m.teamB.player2?.id || '');

        if (!teamMap.has(idA)) teamMap.set(idA, {
            name: shortenName(m.teamA.player1.name) + (m.teamA.player2 ? ` / ${shortenName(m.teamA.player2.name)}` : ''),
            team: m.teamA
        });
        if (!teamMap.has(idB)) teamMap.set(idB, {
            name: shortenName(m.teamB.player1.name) + (m.teamB.player2 ? ` / ${shortenName(m.teamB.player2.name)}` : ''),
            team: m.teamB
        });
    });

    const standings: GroupStanding[] = Array.from(teamMap.entries()).map(([id, info]) => {
        const teamMatches = matches.filter(m =>
            (m.teamA.player1.id + (m.teamA.player2?.id || '') === id) ||
            (m.teamB.player1.id + (m.teamB.player2?.id || '') === id)
        );

        const stats = teamMatches.reduce((acc, m) => {
            if (m.status !== 'finished') return acc;

            const isTeamA = (m.teamA.player1.id + (m.teamA.player2?.id || '') === id);
            const teamSets = isTeamA ? m.setsA : m.setsB;
            const oppSets = isTeamA ? m.setsB : m.setsA;

            const won = teamSets > oppSets;

            // Calculate games (from historySets OR setsA/B for single-set matches)
            let gWon = 0;
            let gLost = 0;

            if (m.historySets && m.historySets.length > 0) {
                m.historySets.forEach(s => {
                    gWon += isTeamA ? s.scoreA : s.scoreB;
                    gLost += isTeamA ? s.scoreB : s.scoreA;
                });
            } else {
                // If no history, assume setsA/B are the final game scores (common for single set pro-sets)
                gWon = isTeamA ? m.setsA : m.setsB;
                gLost = isTeamA ? m.setsB : m.setsA;
            }

            return {
                played: acc.played + 1,
                won: acc.won + (won ? 1 : 0),
                lost: acc.lost + (won ? 0 : 1),
                gamesWon: acc.gamesWon + gWon,
                gamesLost: acc.gamesLost + gLost,
            };
        }, { played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0 });

        return {
            teamId: id,
            teamName: info.name,
            ...stats,
            points: stats.won * 2 // Standard: 2 points per win
        };
    });

    // Sort: Victory -> Game Balance -> Games Won
    const sortedStandings = standings.sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won;
        const balanceA = a.gamesWon - a.gamesLost;
        const balanceB = b.gamesWon - b.gamesLost;
        if (balanceB !== balanceA) return balanceB - balanceA;
        return b.gamesWon - a.gamesWon;
    });

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-base md:text-lg px-3 py-1">
                        Grupo {groupName}
                    </Badge>
                    {!readOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenDeleteConfirm(true)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-b-muted/20">
                                    <TableHead className="w-[30px] md:w-[40px] text-center px-1 md:px-4 text-[10px] md:text-xs uppercase font-black">#</TableHead>
                                    <TableHead className="px-2 md:px-4 text-[10px] md:text-xs uppercase font-black">Dupla / Atleta</TableHead>
                                    <TableHead className="text-center px-1 md:px-4 text-[10px] md:text-xs uppercase font-black">V</TableHead>
                                    <TableHead className="text-center px-1 md:px-4 text-[10px] md:text-xs uppercase font-black">D</TableHead>
                                    <TableHead className="text-center px-1 md:px-4 text-[10px] md:text-xs uppercase font-black">SG</TableHead>
                                    <TableHead className="text-right px-2 md:px-4 text-[10px] md:text-xs uppercase font-black">PTS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStandings.map((team, index) => (
                                    <TableRow key={team.teamId} className={`${index < 2 ? "bg-green-500/5 dark:bg-green-500/10" : ""} border-b-muted/10 last:border-0`}>
                                        <TableCell className="text-center font-black text-xs md:text-sm py-3 md:py-4 px-1 md:px-4">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="py-3 md:py-4 px-2 md:px-4">
                                            <div className="font-bold uppercase text-[10px] md:text-xs leading-tight line-clamp-2 md:line-clamp-1">{team.teamName}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-xs md:text-sm text-green-600 py-3 md:py-4 px-1 md:px-4">{team.won}</TableCell>
                                        <TableCell className="text-center text-xs md:text-sm text-muted-foreground py-3 md:py-4 px-1 md:px-4">{team.lost}</TableCell>
                                        <TableCell className="text-center font-mono text-[9px] md:text-[10px] py-3 md:py-4 px-1 md:px-4">
                                            <Badge variant="outline" className={`h-5 px-1.5 border-none font-bold ${team.gamesWon - team.gamesLost >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                {team.gamesWon - team.gamesLost > 0 ? '+' : ''}{team.gamesWon - team.gamesLost}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-primary text-xs md:text-sm py-3 md:py-4 px-2 md:px-4">{team.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>

            <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar Grupo {groupName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente todas as partidas e classificações deste grupo. Jogos já finalizados também serão excluídos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                try {
                                    await matchService.deleteMatchesByGroup(tournamentId, category, groupName, categoryId);
                                    toast.success(`Grupo ${groupName} removido!`);
                                    setOpenDeleteConfirm(false);
                                } catch (e) {
                                    toast.error("Erro ao deletar grupo");
                                }
                            }}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
