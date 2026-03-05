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
import { Users, User, Trash2, Plus, Save, Info, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { matchService } from "@/services/matchService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ManualGroupGeneratorProps {
    tournamentId: string;
    athletes: Player[];
    tournamentType: 'Simples' | 'Duplas';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activeCategory: string;
    onSuccess?: () => void;
}

export function ManualGroupGenerator({
    tournamentId,
    athletes,
    tournamentType,
    open,
    onOpenChange,
    activeCategory,
    onSuccess
}: ManualGroupGeneratorProps) {
    const [formedTeams, setFormedTeams] = useState<Team[]>([]);
    const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
    const [groups, setGroups] = useState<{ name: string; teams: Team[] }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("athletes");

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
                            category: activeCategory,
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
                    <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl font-black uppercase tracking-tight">
                        <Users className="h-6 w-6 text-primary" />
                        Montagem Manual
                    </DialogTitle>
                    <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-70">
                        Siga as etapas para formar duplas e organizar os grupos do torneio.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 md:hidden">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-xl">
                        <TabsTrigger value="athletes" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            1. Formas Duplas
                        </TabsTrigger>
                        <TabsTrigger value="groups" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            2. Lançar Grupos
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    {/* MOBILE ADAPTIVE VIEW */}
                    <div className={`md:contents ${activeTab === 'athletes' ? 'contents' : 'hidden md:contents'}`}>
                        {/* 1. ATLETAS DISPONÍVEIS */}
                        <div className="col-span-1 border rounded-2xl p-4 bg-muted/20 relative animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Atletas ({availableAthletes.length})
                                </h4>
                                {pendingPlayer && <Badge className="bg-orange-500 animate-pulse text-[8px]">Selecionando...</Badge>}
                            </div>

                            {pendingPlayer && (
                                <div className="mb-4 p-3 bg-primary/10 border-2 border-primary/30 border-dashed rounded-xl overflow-hidden">
                                    <p className="text-[9px] uppercase font-black text-primary mb-1 text-center opacity-70">Formando Dupla com:</p>
                                    <p className="text-xs font-bold text-center truncate">{pendingPlayer.name}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 text-[10px] mt-2 font-black uppercase text-primary hover:bg-primary/20 rounded-lg"
                                        onClick={() => setPendingPlayer(null)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-2 max-h-[300px] md:max-h-[500px] overflow-y-auto pr-1 no-scrollbar md:scrollbar-thin">
                                {availableAthletes.map((athlete) => (
                                    <button
                                        key={athlete.id}
                                        onClick={() => handlePlayerClick(athlete)}
                                        className="w-full p-4 text-left bg-card border-none rounded-2xl text-[10px] md:text-xs font-bold uppercase shadow-sm hover:ring-2 hover:ring-primary/20 hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-between group"
                                    >
                                        <span className="truncate flex-1">{athlete.name}</span>
                                        <Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                                {availableAthletes.length === 0 && !pendingPlayer && (
                                    <p className="text-center text-[10px] text-muted-foreground italic py-8 uppercase font-bold opacity-40">
                                        Todos os atletas alocados
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. DUPLAS FORMADAS */}
                        <div className="col-span-1 border rounded-2xl p-4 bg-primary/5 relative animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                    <Users className="h-4 w-4" /> {tournamentType === 'Simples' ? 'Jogadores' : 'Duplas'} ({formedTeams.length})
                                </h4>
                            </div>

                            <div className="space-y-3 max-h-[300px] md:max-h-[500px] overflow-y-auto pr-1 no-scrollbar md:scrollbar-thin">
                                {formedTeams.map((team, idx) => (
                                    <div key={idx} className="bg-card border-none rounded-2xl p-4 shadow-md group animate-in zoom-in-95 duration-200">
                                        <div className="flex flex-col gap-1 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] md:text-xs font-black uppercase truncate leading-tight flex-1">{team.player1.name}</span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                                                    onClick={() => handleUnformTeam(idx)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            {team.player2 && (
                                                <>
                                                    <div className="h-px bg-muted/50 my-1" />
                                                    <span className="text-[10px] md:text-xs font-black uppercase truncate leading-tight text-primary/80">{team.player2.name}</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest text-center opacity-60">Enviar para:</span>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {groups.map((g, gIdx) => (
                                                    <Button
                                                        key={gIdx}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-[10px] font-black uppercase rounded-xl border-primary/20 hover:bg-primary hover:text-white transition-all hover:scale-105 active:scale-95"
                                                        onClick={() => {
                                                            handleAddTeamToGroup(gIdx, idx);
                                                            if (window.innerWidth < 768 && formedTeams.length === 1) {
                                                                setActiveTab('groups');
                                                            }
                                                        }}
                                                    >
                                                        {g.name}
                                                    </Button>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-[10px] font-bold border-2 border-dashed rounded-xl opacity-60 hover:opacity-100"
                                                    onClick={handleAddGroup}
                                                >
                                                    + GR
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formedTeams.length === 0 && (
                                    <div className="text-center py-12 flex flex-col items-center gap-2 opacity-30 mt-4 border-2 border-dashed rounded-3xl">
                                        <Users className="h-10 w-10" />
                                        <p className="text-[9px] font-black uppercase tracking-widest px-4 leading-relaxed">Forme duplas à esquerda para alocar aqui</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. ESTRUTURA DE GRUPOS - MOBILE VISIBILITY */}
                    <div className={`col-span-1 md:col-span-2 space-y-4 ${activeTab === 'groups' ? 'block' : 'hidden md:block'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Painel de Grupos ({groups.length})</h4>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAddGroup}
                                className="h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-primary/5 border-primary/20 shadow-sm"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Novo Grupo
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groups.map((group, gIdx) => (
                                <div key={gIdx} className="border-none rounded-[28px] p-5 bg-card relative shadow-md hover:ring-2 hover:ring-primary/20 transition-all group/card overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                                    <div className="flex items-center justify-between mb-5 border-b border-muted pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center rounded-xl font-black italic shadow-lg shadow-primary/20">
                                                {group.name}
                                            </div>
                                            <h5 className="font-black text-slate-800 text-sm tracking-tight uppercase">Grupo {group.name}</h5>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => handleRemoveGroup(gIdx)}
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {group.teams.map((team, tIdx) => (
                                            <div key={tIdx} className="p-4 bg-muted/40 rounded-[20px] relative group/item border border-transparent hover:border-primary/30 hover:bg-background transition-all shadow-sm">
                                                <div className="flex flex-col text-[10px] font-black uppercase leading-relaxed pr-6">
                                                    <span className="truncate">{team.player1.name}</span>
                                                    {team.player2 && <span className="text-primary/70 truncate">{team.player2.name}</span>}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="absolute -right-1.5 -top-1.5 h-7 w-7 rounded-full opacity-100 md:opacity-0 group-hover/item:opacity-100 shadow-xl scale-90 hover:scale-105 transition-all z-10"
                                                    onClick={() => handleRemoveTeamFromGroup(gIdx, tIdx)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {group.teams.length < 3 && group.teams.length > 0 && (
                                            <div className="flex items-center gap-3 p-3 bg-orange-500/5 rounded-[20px] text-orange-600 border border-orange-500/10">
                                                <Info className="h-4 w-4 shrink-0 animate-bounce" />
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">Mínimo 3 duplas necessárias.</span>
                                            </div>
                                        )}
                                        {group.teams.length === 0 && (
                                            <div className="text-center py-10 flex flex-col items-center gap-2 opacity-20 bg-muted/20 rounded-[20px] border-2 border-dashed">
                                                <Save className="h-8 w-8" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.1em]">Alocação pendente</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {groups.length === 0 && (
                            <div className="text-center py-24 border-none rounded-[40px] bg-muted/10 flex flex-col items-center gap-4 opacity-30 shadow-inner">
                                <LayoutGrid className="h-16 w-16 text-primary" />
                                <div className="space-y-1">
                                    <p className="text-sm font-black uppercase tracking-[0.3em]">Estrutura Vazia</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Crie um grupo para começar</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-3 mt-10 border-t pt-8 bg-muted/5 -mx-6 px-6 -mb-6 pb-8 md:pb-6 rounded-b-[40px]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="font-black uppercase text-[10px] md:text-xs tracking-widest h-12 md:h-10 order-2 md:order-1"
                    >
                        Cancelar Lançamento
                    </Button>
                    <Button
                        disabled={isSaving || availableAthletes.length > 0 || formedTeams.length > 0 || groups.length === 0 || !!pendingPlayer}
                        onClick={handleSave}
                        className="gap-3 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] md:text-xs h-14 md:h-12 px-10 shadow-2xl shadow-primary/40 rounded-2xl order-1 md:order-2 active:scale-95 transition-all"
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
