import { useState, useEffect } from "react";
import { Player, Tournament } from "@/types/beach-tennis";
import { athleteService } from "@/services/athleteService";
import { tournamentService } from "@/services/tournamentService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TournamentAthleteManagerProps {
    tournament: Tournament;
    selectedCategory?: string;
}

export function TournamentAthleteManager({ tournament, selectedCategory = "TODAS" }: TournamentAthleteManagerProps) {
    const [globalAthletes, setGlobalAthletes] = useState<Player[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unsubscribe = athleteService.subscribe(setGlobalAthletes);
        return () => unsubscribe();
    }, []);

    const participatingIds = tournament.participatingAthleteIds || [];

    const handleToggleParticipation = async (athleteId: string) => {
        const isParticipating = participatingIds.includes(athleteId);
        let newIds: string[];

        if (isParticipating) {
            newIds = participatingIds.filter(id => id !== athleteId);
        } else {
            newIds = [...participatingIds, athleteId];
        }

        try {
            await tournamentService.update(tournament.id, {
                participatingAthleteIds: newIds
            });
            toast.success(isParticipating ? "Atleta removido do torneio." : "Atleta adicionado ao torneio!");
        } catch (error) {
            toast.error("Erro ao atualizar participação.");
        }
    };

    const filteredAthletes = globalAthletes.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "TODAS" || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Buscar atletas por nome ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
                <div className="text-sm text-muted-foreground">
                    Total: <span className="font-bold text-foreground">{participatingIds.length}</span> atletas inscritos.
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Participação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAthletes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhum atleta encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAthletes.map((athlete) => {
                                const isParticipating = participatingIds.includes(athlete.id);
                                return (
                                    <TableRow key={athlete.id} className={isParticipating ? "bg-primary/5" : ""}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {athlete.registrationNumber || "--"}
                                        </TableCell>
                                        <TableCell className="font-semibold">{athlete.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{athlete.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={isParticipating ? "destructive" : "default"}
                                                size="sm"
                                                onClick={() => handleToggleParticipation(athlete.id)}
                                                className="w-32"
                                            >
                                                {isParticipating ? (
                                                    <><UserMinus className="mr-2 h-4 w-4" /> Remover</>
                                                ) : (
                                                    <><UserPlus className="mr-2 h-4 w-4" /> Adicionar</>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
