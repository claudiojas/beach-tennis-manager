import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Player, Team } from "@/types/beach-tennis";
import { Users, User, Trash2, Plus, Save, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { matchService } from "@/services/matchService";

interface ManualGroupGeneratorProps {
    tournamentId: string;
    athletes: Player[];
    tournamentType: 'Simples' | 'Duplas';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ManualGroupGenerator({
    tournamentId,
    athletes,
    tournamentType,
    open,
    onOpenChange,
    onSuccess
}: ManualGroupGeneratorProps) {
    const [formedTeams, setFormedTeams] = useState<Team[]>([]);
    const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
    const [groups, setGroups] = useState<{ name: string; teams: Team[] }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Atletas que ainda não estão em nenhuma dupla formada nem em um grupo
    const availableAthletes = athletes.filter(a =>
        !formedTeams.some(t => t.player1.id === a.id || t.player2?.id === a.id) &&
        !groups.some(g => g.teams.some(t => t.player1.id === a.id || t.player2?.id === a.id)) &&
        pendingPlayer?.id !== a.id
    );

    const handlePlayerClick = (player: Player) => {
        if (tournamentType === 'Simples') {
            const newTeam = { player1: player };
            setFormedTeams([...formedTeams, newTeam]);
            return;
        }

        if (!pendingPlayer) {
            setPendingPlayer(player);
        } else {
            const newTeam = { player1: pendingPlayer, player2: player };
            setFormedTeams([...formedTeams, newTeam]);
            setPendingPlayer(null);
        }
    };

    const handleUnformTeam = (idx: number) => {
        const newTeams = [...formedTeams];
        newTeams.splice(idx, 1);
        setFormedTeams(newTeams);
    };

    const handleAddGroup = () => {
        const nextLetter = String.fromCharCode(65 + groups.length);
        setGroups([...groups, { name: nextLetter, teams: [] }]);
    };

    const handleRemoveGroup = (index: number) => {
        const group = groups[index];
        setFormedTeams([...formedTeams, ...group.teams]);

        const newGroups = groups.filter((_, i) => i !== index);
        const renamedGroups = newGroups.map((g, i) => ({
            ...g,
            name: String.fromCharCode(65 + i)
        }));
        setGroups(renamedGroups);
    };

    const handleAddTeamToGroup = (groupIndex: number, teamIndex: number) => {
        const team = formedTeams[teamIndex];
        const newTeams = [...formedTeams];
        newTeams.splice(teamIndex, 1);
        setFormedTeams(newTeams);

        const newGroups = [...groups];
        newGroups[groupIndex].teams.push(team);
        setGroups(newGroups);
    };

    const handleRemoveTeamFromGroup = (groupIndex: number, teamIndex: number) => {
        const newGroups = [...groups];
        const [team] = newGroups[groupIndex].teams.splice(teamIndex, 1);
        setGroups(newGroups);
        setFormedTeams([...formedTeams, team]);
    };

    const handleSave = async () => {
        if (groups.length === 0) {
            toast.error("Adicione pelo menos um grupo.");
            return;
        }

        if (availableAthletes.length > 0 || formedTeams.length > 0 || pendingPlayer) {
            toast.error("Todos os atletas e duplas devem estar alocados em grupos.");
            return;
        }

        const emptyGroups = groups.filter(g => g.teams.length < 3);
        if (emptyGroups.length > 0) {
            toast.error("Cada grupo deve ter no mínimo 3 duplas/atletas.");
            return;
        }

        setIsSaving(true);
        try {
            for (const group of groups) {
                const groupTeams = group.teams;
                for (let i = 0; i < groupTeams.length; i++) {
                    for (let j = i + 1; j < groupTeams.length; j++) {
                        const matchData = {
                            tournamentId,
                            category: groupTeams[i].player1.category,
                            teamA: groupTeams[i],
                            teamB: groupTeams[j],
                            group: group.name,
                            round: 'Grupos' as any
                        };
                        await matchService.create(matchData as any);
                    }
                }
            }
            toast.success("Grupos e duplas manuais gerados com sucesso!");
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao salvar grupos.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Users className="h-6 w-6 text-primary" />
                        Montagem Manual: Duplas e Grupos
                    </DialogTitle>
                    <DialogDescription>
                        1. Forme as duplas clicando nos atletas. 2. Aloque as duplas nos grupos.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    {/* 1. ATLETAS DISPONÍVEIS */}
                    <div className="col-span-1 border rounded-2xl p-4 bg-muted/20 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Atletas
                            </h4>
                            <Badge variant="outline">{availableAthletes.length}</Badge>
                        </div>

                        {pendingPlayer && (
                            <div className="mb-4 p-3 bg-primary/10 border-2 border-primary/30 border-dashed rounded-xl animate-pulse">
                                <p className="text-[10px] uppercase font-black text-primary mb-1 text-center">Formando Dupla com:</p>
                                <p className="text-xs font-bold text-center">{pendingPlayer.name}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-6 text-[9px] mt-2 text-primary hover:bg-primary/20"
                                    onClick={() => setPendingPlayer(null)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                            {availableAthletes.map((athlete) => (
                                <button
                                    key={athlete.id}
                                    onClick={() => handlePlayerClick(athlete)}
                                    className="w-full p-3 text-left bg-card border rounded-xl text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
                                >
                                    {athlete.name}
                                </button>
                            ))}
                            {availableAthletes.length === 0 && !pendingPlayer && (
                                <p className="text-center text-[10px] text-muted-foreground italic py-8">
                                    Todos os atletas alocados.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 2. DUPLAS FORMADAS */}
                    <div className="col-span-1 border rounded-2xl p-4 bg-primary/5 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> {tournamentType === 'Simples' ? 'Jogadores' : 'Duplas'}
                            </h4>
                            <Badge variant="default">{formedTeams.length}</Badge>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                            {formedTeams.map((team, idx) => (
                                <div key={idx} className="bg-card border-2 border-primary/10 rounded-xl p-3 shadow-sm group">
                                    <div className="flex flex-col gap-1 mb-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold truncate leading-tight">{team.player1.name}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                                                onClick={() => handleUnformTeam(idx)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {team.player2 && (
                                            <>
                                                <div className="h-px bg-border/50 my-0.5" />
                                                <span className="text-xs font-bold truncate leading-tight">{team.player2.name}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5">
                                        {groups.map((g, gIdx) => (
                                            <Button
                                                key={gIdx}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-colors"
                                                onClick={() => handleAddTeamToGroup(gIdx, idx)}
                                            >
                                                {g.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {formedTeams.length === 0 && (
                                <div className="text-center py-12 flex flex-col items-center gap-2 opacity-30">
                                    <Users className="h-8 w-8" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Aguardando formação</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. ESTRUTURA DE GRUPOS */}
                    <div className="col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest">Painel de Grupos</h4>
                            <Button size="sm" variant="outline" onClick={handleAddGroup} className="h-8 text-[10px] font-black uppercase">
                                <Plus className="mr-1 h-3 w-3" /> Novo Grupo
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {groups.map((group, gIdx) => (
                                <div key={gIdx} className="border-2 border-slate-200/60 rounded-2xl p-4 bg-card relative shadow-sm hover:border-primary/20 transition-colors">
                                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary w-6 h-6 flex items-center justify-center rounded-lg font-black italic text-sm">
                                                {group.name}
                                            </div>
                                            <h5 className="font-black text-slate-800 text-xs tracking-widest uppercase">Grupo {group.name}</h5>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveGroup(gIdx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {group.teams.map((team, tIdx) => (
                                            <div key={tIdx} className="p-2.5 bg-muted/40 rounded-xl relative group/item border border-transparent hover:border-primary/20 hover:bg-white transition-all">
                                                <div className="flex flex-col text-[10px] font-black uppercase leading-tight">
                                                    <span>{team.player1.name}</span>
                                                    {team.player2 && <span className="text-primary/70">{team.player2.name}</span>}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover/item:opacity-100 shadow-lg scale-75 hover:scale-100 transition-all"
                                                    onClick={() => handleRemoveTeamFromGroup(gIdx, tIdx)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        {group.teams.length < 3 && group.teams.length > 0 && (
                                            <div className="flex items-center gap-2 p-2 bg-yellow-500/5 rounded-lg text-yellow-600 border border-yellow-500/10">
                                                <Info className="h-3 w-3 shrink-0" />
                                                <span className="text-[9px] font-bold uppercase">Mínimo 3 necessários.</span>
                                            </div>
                                        )}
                                        {group.teams.length === 0 && (
                                            <p className="text-center text-[9px] text-muted-foreground italic py-6">Pendente de alocação</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {groups.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed rounded-3xl flex flex-col items-center gap-3 opacity-20">
                                <Users className="h-12 w-12" />
                                <p className="text-sm font-black uppercase tracking-[0.2em]">Estrutura Vazia</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-10 border-t pt-6 bg-muted/10 -mx-6 px-6 -mb-6 pb-6 rounded-b-3xl">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-black uppercase text-xs">Cancelar</Button>
                    <Button
                        disabled={isSaving || availableAthletes.length > 0 || formedTeams.length > 0 || groups.length === 0 || !!pendingPlayer}
                        onClick={handleSave}
                        className="gap-2 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                        Confirmar Grade Completa
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
