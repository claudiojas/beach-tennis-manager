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
    activeCategory?: string | null; // This is now typically the categoryId
}

export function TournamentAthleteManager({ tournament, activeCategory = null }: TournamentAthleteManagerProps) {
    const [globalAthletes, setGlobalAthletes] = useState<Player[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unsubscribe = athleteService.subscribe(setGlobalAthletes);
        return () => unsubscribe();
    }, []);

    const getParticipatingIds = () => {
        if (activeCategory) {
            const catName = tournament.categories?.find(c =>
                typeof c === 'string' ? c === activeCategory : c.id === activeCategory
            );
            const activeCategoryName = typeof catName === 'string' ? catName : catName?.name || activeCategory;
            return tournament.categoryAthletes?.[activeCategory] || tournament.categoryAthletes?.[activeCategoryName] || [];
        }
        return tournament.participatingAthleteIds || [];
    };

    const participatingIds = getParticipatingIds();

    const handleToggleParticipation = async (athleteId: string) => {
        const isParticipating = participatingIds.includes(athleteId);
        let newIds: string[];

        if (isParticipating) {
            newIds = participatingIds.filter(id => id !== athleteId);
        } else {
            newIds = [...participatingIds, athleteId];
        }

        try {
            if (activeCategory) {
                const currentCategoryAthletes = tournament.categoryAthletes || {};
                const catName = tournament.categories?.find(c =>
                    typeof c === 'string' ? c === activeCategory : c.id === activeCategory
                );
                const activeCategoryName = typeof catName === 'string' ? catName : catName?.name || activeCategory;

                await tournamentService.update(tournament.id, {
                    categoryAthletes: {
                        ...currentCategoryAthletes,
                        [activeCategory]: newIds,
                        [activeCategoryName]: newIds // Update both for absolute safety during migration
                    }
                });
            } else {
                // Backward compatibility / Global Etapa view
                await tournamentService.update(tournament.id, {
                    participatingAthleteIds: newIds
                });
            }
            toast.success(isParticipating ? "Atleta removido do torneio." : "Atleta adicionado ao torneio!");
        } catch (error) {
            toast.error("Erro ao atualizar participação.");
        }
    };

    const filteredAthletes = globalAthletes.filter(a => {
        // Essential: Check both the new 'categories' array and the legacy 'category' string
        const athleteCategories = a.categories || (a.category ? [a.category] : []);

        const catName = tournament.categories?.find(c =>
            typeof c === 'string' ? c === activeCategory : c.id === activeCategory
        );
        const activeCategoryName = typeof catName === 'string' ? catName : catName?.name || activeCategory || '';

        // 1. Gender Filter Check
        const categoryGender = activeCategory ? (tournament.categoryGender?.[activeCategory] || tournament.categoryGender?.[activeCategoryName] || 'Mista') : 'Mista';
        if (categoryGender !== 'Mista') {
            if (a.gender && a.gender !== categoryGender) return false;
            if (!a.gender) return false;
        }

        const rules = activeCategory && tournament.categoryRules ? (tournament.categoryRules[activeCategory] || tournament.categoryRules[activeCategoryName] || []) : [];
        let isInCategory = false;

        if (activeCategory && rules.length > 0) {
            isInCategory = athleteCategories.some(c => rules.includes(c));
        } else if (activeCategory) {
            // Case fallback to name match if no specific rules
            isInCategory = athleteCategories.some(c => c.toUpperCase() === activeCategoryName.toUpperCase());
        } else {
            // Visão global
            isInCategory = true;
        }

        if (!isInCategory) return false;

        return a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            athleteCategories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Input
                    placeholder="Buscar atletas por nome ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                />
                <div className="text-sm text-muted-foreground whitespace-nowrap bg-muted/30 px-3 py-2 rounded-lg border border-dashed text-center">
                    Total: <span className="font-bold text-foreground">{participatingIds.length}</span> atletas inscritos.
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-hidden">
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
                                            <div className="flex flex-wrap gap-1">
                                                {(athlete.categories || (athlete.category ? [athlete.category] : [])).map(catId => {
                                                    const categoryObj = tournament.categories?.find(c =>
                                                        typeof c === 'string' ? c === catId : c.id === catId
                                                    );
                                                    const displayName = typeof categoryObj === 'string' ? categoryObj : categoryObj?.name || catId;
                                                    return (
                                                        <Badge key={catId} variant="outline" className="text-[10px] whitespace-nowrap">{displayName}</Badge>
                                                    );
                                                })}
                                            </div>
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

            {/* Mobile Card List View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredAthletes.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground italic">
                        Nenhum atleta encontrado.
                    </div>
                ) : (
                    filteredAthletes.map((athlete) => {
                        const isParticipating = participatingIds.includes(athlete.id);
                        return (
                            <div key={athlete.id} className={`p-4 rounded-2xl border transition-all ${isParticipating ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm' : 'bg-card'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0">
                                        <p className="font-black uppercase text-sm truncate">{athlete.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">#{athlete.registrationNumber || "---"}</p>
                                    </div>
                                    <Button
                                        variant={isParticipating ? "destructive" : "outline"}
                                        size="icon"
                                        onClick={() => handleToggleParticipation(athlete.id)}
                                        className={`h-10 w-10 rounded-xl shadow-sm ${!isParticipating ? 'border-primary text-primary hover:bg-primary/5' : ''}`}
                                    >
                                        {isParticipating ? <UserMinus className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(athlete.categories || (athlete.category ? [athlete.category] : [])).map(catId => {
                                        const categoryObj = tournament.categories?.find(c =>
                                            typeof c === 'string' ? c === catId : c.id === catId
                                        );
                                        const displayName = typeof categoryObj === 'string' ? categoryObj : categoryObj?.name || catId;
                                        return (
                                            <Badge key={catId} variant="secondary" className="text-[9px] font-bold uppercase py-0 px-2 tracking-tighter">{displayName}</Badge>
                                        );
                                    })}
                                </div>
                                {isParticipating && (
                                    <div className="mt-3 flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 w-fit px-2 py-1 rounded-md">
                                        <CheckCircle2 className="h-3 w-3" /> Inscrito
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
