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
    groupName: string;
    matches: Match[];
}

export function GroupStandings({ tournamentId, category, groupName, matches }: GroupStandingsProps) {
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

            // Calculate games (from historySets)
            let gWon = 0;
            let gLost = 0;
            (m.historySets || []).forEach(s => {
                gWon += isTeamA ? s.scoreA : s.scoreB;
                gLost += isTeamA ? s.scoreB : s.scoreA;
            });

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
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-lg px-3 py-1">
                        Grupo {groupName}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenDeleteConfirm(true)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[40px] text-center">#</TableHead>
                                <TableHead>Dupla / Atleta</TableHead>
                                <TableHead className="text-center">V</TableHead>
                                <TableHead className="text-center">D</TableHead>
                                <TableHead className="text-center">SG</TableHead>
                                <TableHead className="text-right">PTS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedStandings.map((team, index) => (
                                <TableRow key={team.teamId} className={index < 2 ? "bg-primary/5" : ""}>
                                    <TableCell className="text-center font-bold">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold uppercase text-xs">{team.teamName}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-green-600">{team.won}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{team.lost}</TableCell>
                                    <TableCell className="text-center font-mono text-[10px]">
                                        {team.gamesWon - team.gamesLost > 0 ? '+' : ''}{team.gamesWon - team.gamesLost}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-primary">{team.points}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                                    await matchService.deleteMatchesByGroup(tournamentId, category, groupName);
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
