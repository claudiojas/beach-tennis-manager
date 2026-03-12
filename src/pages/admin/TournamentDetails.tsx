import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, QrCode, Pencil, Loader2, PlayCircle, Settings, Trophy, Share2, Unlock, RotateCcw, Users, User, UserCheck, MapPin, Image as ImageIcon, Check, X, LayoutGrid, GitBranch, ListFilter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { courtService } from "@/services/courtService";
import { arenaService } from "@/services/arenaService";
import { matchService } from "@/services/matchService";
import { athleteService } from "@/services/athleteService";
import { tournamentService } from "@/services/tournamentService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Court, Match, Tournament, Player, TOURNAMENT_CATEGORIES } from "@/types/beach-tennis";
import { toast } from "sonner";
import { AthleteForm } from "@/components/athletes/AthleteForm";
import { MatchList } from "@/components/matches/MatchList";
import { MatchForm } from "@/components/matches/MatchForm";
import { TournamentBrackets } from "@/components/matches/TournamentBrackets";
import { GroupStandings } from "@/components/matches/GroupStandings";
import { TournamentAthleteManager } from "@/components/athletes/TournamentAthleteManager";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ManualGroupGenerator } from "@/components/matches/ManualGroupGenerator";
import { categoryService } from "@/services/categoryService";

const courtSchema = z.object({
    name: z.string().min(2, "Nome da quadra deve ter pelo menos 2 caracteres"),
});

export default function TournamentDetails() {
    const { id } = useParams();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [athletes, setAthletes] = useState<Player[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [open, setOpen] = useState(false);
    const [openMatchDialog, setOpenMatchDialog] = useState(false);
    const [isGeneratingAuto, setIsGeneratingAuto] = useState(false);
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [openSettings, setOpenSettings] = useState(false);
    const [openQR, setOpenQR] = useState(false);
    const [arenas, setArenas] = useState<any[]>([]);
    const [isCustomCourt, setIsCustomCourt] = useState(false);
    const [openManualGroups, setOpenManualGroups] = useState(false);
    const [openResetConfirm, setOpenResetConfirm] = useState(false);
    const [activeSubTournament, setActiveSubTournament] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("rules");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

    useEffect(() => {
        const unsubscribe = categoryService.subscribe((cats) => {
            setDynamicCategories(cats.map(c => c.name));
        });
        return () => unsubscribe();
    }, []);

    const allGlobalCategories = Array.from(new Set([
        ...TOURNAMENT_CATEGORIES,
        ...dynamicCategories
    ]))
        .filter(cat => cat.toUpperCase() !== 'MISTA')
        .sort();

    useEffect(() => {
        const fetchArenas = async () => {
            const data = await arenaService.getAllOnce();
            setArenas(data);
        };
        fetchArenas();
    }, []);

    const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

    const form = useForm<z.infer<typeof courtSchema>>({
        resolver: zodResolver(courtSchema),
        defaultValues: { name: "" },
    });

    useEffect(() => {
        if (id) {
            const unsubscribeCourts = courtService.subscribeByTournament(id, setCourts);
            const unsubscribeMatches = matchService.subscribeByTournament(id, setMatches);

            const unsubTourney = tournamentService.subscribe((tournaments) => {
                const current = tournaments.find(t => t.id === id);
                if (current) {
                    setTournament(current);
                    const unsubAthletes = athleteService.subscribe((allAthletes) => {
                        // Get unique IDs from global participation AND all category-specific lists
                        const allParticipIds = Array.from(new Set([
                            ...(current.participatingAthleteIds || []),
                            ...Object.values(current.categoryAthletes || {}).flat()
                        ]));

                        const filtered = allAthletes.filter(a => allParticipIds.includes(a.id));
                        setAthletes(filtered);
                    });
                    return () => unsubAthletes();
                }
            });

            return () => {
                unsubscribeCourts();
                unsubscribeMatches();
                unsubTourney();
            };
        }
    }, [id]);
    1.
    const getEligibleAthletesForCategory = (cat: string) => {
        if (!tournament) return [];
        1.
        const categoryGender = tournament.categoryGender?.[cat] || 'Mista';
        const rules = tournament.categoryRules?.[cat] || [];
        const specificCategoryAthletes = tournament.categoryAthletes?.[cat] || [];
        1.
        // Se houver atletas inscritos especificamente, use somente eles (filtro da aba atletas)
        // Se não houver, pegamos todos e aplicamos as regras (comportamento fallback para auto-geração)
        const sourceAthletes = (specificCategoryAthletes.length > 0)
            ? athletes.filter(a => specificCategoryAthletes.includes(a.id))
            : athletes;
        1.
        return sourceAthletes.filter(a => {
            // 1. Gender check (STRICT - inclusive exige que gênero esteja preenchido)
            if (categoryGender !== 'Mista') {
                if (!a.gender || a.gender !== categoryGender) return false;
            }
            1.
            // 2. Category/Rule check (Nível Técnico)
            const athleteCategories = a.categories || (a.category ? [a.category] : []);
            if (rules.length > 0) {
                return athleteCategories.some(c => rules.includes(c));
            }
            return athleteCategories.map(c => c.toUpperCase()).includes(cat.toUpperCase());
        });
    };

    const handleGenerateInitialMatches = async () => {
        if (!id || !tournament) return;
        setIsGeneratingAuto(true);
        try {
            // Generate for all categories defined in the tournament
            const tournamentCategories = tournament.categories || [];

            if (tournamentCategories.length === 0) {
                throw new Error("Defina as categorias do torneio nas configurações primeiro.");
            }

            for (const cat of tournamentCategories) {
                const eligibleAthletes = getEligibleAthletesForCategory(cat);

                if (eligibleAthletes.length >= 2) {
                    await matchService.generateGroupMatches(id, cat, eligibleAthletes, tournament.type);
                } else {
                    toast.warning(`Não foi possível gerar grupos para a categoria ${cat}: atletas insuficientes (mínimo 2).`);
                }
            }

            toast.success("Fase de Grupos gerada com sucesso!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao gerar grupos");
        } finally {
            setIsGeneratingAuto(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof courtSchema>) => {
        if (!id) return;
        try {
            if (editingCourt) {
                await courtService.updateName(editingCourt.id, values.name);
                toast.success("Quadra atualizada!");
            } else {
                await courtService.create({ name: values.name, tournamentId: id, pin: generatePin() });
                toast.success("Quadra criada!");
            }
            setOpen(false);
            setEditingCourt(null);
            setIsCustomCourt(false);
            form.reset({ name: "" });
        } catch (error) {
            toast.error("Erro ao processar quadra.");
        }
    };

    // Dynamic categories from current matches + tournament settings
    const availableCategories = Array.from(new Set([
        ...(tournament?.categories || []),
        ...matches.map(m => m.category)
    ])).filter(Boolean).sort();

    // Simplified: Show all categories in the UI
    const filteredMatches = activeSubTournament
        ? matches.filter(m => m.category.toUpperCase() === activeSubTournament.toUpperCase())
        : matches;

    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState("");

    const handleSaveCategoryEdit = (oldCat: string) => {
        const name = editCategoryName.trim().toUpperCase();
        if (name && id && tournament && name !== oldCat) {
            const currentCats = tournament.categories || [];
            if (!currentCats.includes(name)) {
                // We need to update the categories array, the categoryRules AND categoryAthletes if any exists for this category
                const updatedCats = currentCats.map(c => c === oldCat ? name : c);

                const updatedRules = { ...(tournament.categoryRules || {}) };
                if (updatedRules[oldCat]) {
                    updatedRules[name] = updatedRules[oldCat];
                    delete updatedRules[oldCat];
                }

                const updatedCategoryAthletes = { ...(tournament.categoryAthletes || {}) };
                if (updatedCategoryAthletes[oldCat]) {
                    updatedCategoryAthletes[name] = updatedCategoryAthletes[oldCat];
                    delete updatedCategoryAthletes[oldCat];
                }

                tournamentService.update(id, {
                    categories: updatedCats,
                    categoryRules: updatedRules,
                    categoryAthletes: updatedCategoryAthletes
                });

                if (activeSubTournament === oldCat) setActiveSubTournament(name);
                setEditingCategory(null);
                toast.success(`Torneio renomeado para ${name}!`);
            } else {
                toast.error("Este torneio já existe nesta etapa.");
            }
        } else {
            setEditingCategory(null);
        }
    };

    const handleAddCategory = () => {
        const name = newCategoryName.trim().toUpperCase();
        if (!name) {
            toast.error("Digite um nome para o torneio");
            return;
        }
        if (id && tournament) {
            const currentCats = tournament.categories || [];
            if (!currentCats.includes(name)) {
                tournamentService.update(id, { categories: [...currentCats, name] });
                setNewCategoryName("");
                toast.success(`Torneio ${name} adicionado!`);
            } else {
                toast.error("Este torneio já existe nesta etapa.");
            }
        }
    };

    const matchingArena = arenas.find(a => a.name === tournament?.location);
    const availableCourtsFromTemplate = matchingArena?.courts || [];
    const addedCourtNames = courts.map(c => c.name);
    const pendingCourts = availableCourtsFromTemplate.filter(ac => !addedCourtNames.includes(ac.name));

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* App Bar - Native Feel */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3 md:px-6">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-2">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-bold tracking-tighter hidden sm:inline">Beach Tennis</span>
                    </Link>
                    <div className="flex-1 min-w-0 border-l pl-4">
                        <h1 className="text-lg font-bold tracking-tight truncate">
                            {activeSubTournament || tournament?.name || "Gerenciar"}
                        </h1>
                        {!activeSubTournament && (
                            <p className="text-[10px] text-muted-foreground uppercase font-black truncate">Etapa</p>
                        )}
                        {activeSubTournament && (
                            <p className="text-[10px] text-primary uppercase font-black truncate">{tournament?.name}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setOpenQR(true)} className="rounded-full">
                            <QrCode className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setOpenSettings(true)} className="rounded-full">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-4 md:p-6">
                {tournament?.status === 'finished' && (
                    <Card className="mb-8 border-yellow-500/20 bg-yellow-500/5 shadow-lg overflow-hidden border-2">
                        <div className="bg-yellow-500 h-1" />
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-yellow-500 p-2 rounded-full">
                                <Trophy className="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Hall da Fama - Torneio Concluído</CardTitle>
                                <CardDescription>Confira os resultados das finais de cada categoria.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {tournament.categories?.map(cat => {
                                    // Try to find the final match for this category
                                    const finalMatch = matches.find(m => m.category.toUpperCase() === cat.toUpperCase() && m.round === 'final' && m.status === 'finished');
                                    if (!finalMatch) return null;

                                    const winner = finalMatch.setsA > finalMatch.setsB ? finalMatch.teamA : finalMatch.teamB;

                                    return (
                                        <div key={cat} className="p-4 rounded-xl bg-card border shadow-sm">
                                            <Badge variant="outline" className="mb-2 text-[8px] uppercase">{cat}</Badge>
                                            <p className="font-bold text-sm">🏆 {winner.player1.name}</p>
                                            {winner.player2 && <p className="font-bold text-sm pl-6"> & {winner.player2.name}</p>}
                                            <p className="text-[10px] text-muted-foreground mt-2 uppercase">Campeões</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {!activeSubTournament && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Torneios e Categorias</h2>
                                    <p className="text-sm text-muted-foreground">Adicione e gerencie os torneios desta etapa.</p>
                                </div>
                                <div className="flex flex-col gap-2 w-full md:w-auto min-w-[300px]">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add o nome do torneio"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="h-11 rounded-xl bg-card border-primary/20 shadow-sm focus-visible:ring-primary/30 font-bold uppercase"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        />
                                        <Button
                                            onClick={handleAddCategory}
                                            className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-xs"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tournament?.categories?.map(cat => {
                                    const catMatches = matches.filter(m => m.category.toUpperCase() === cat.toUpperCase());
                                    const finishedMatches = catMatches.filter(m => m.status === 'finished').length;
                                    const totalMatches = catMatches.length;
                                    const progress = totalMatches > 0 ? (finishedMatches / totalMatches) * 100 : 0;
                                    const isStarted = totalMatches > 0 && catMatches.some(m => m.status === 'ongoing' || m.status === 'finished');
                                    const isFinished = catMatches.some(m => m.round?.toLowerCase() === 'final' && m.status === 'finished');

                                    return (
                                        <Card
                                            key={cat}
                                            className={`relative group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-muted/40 rounded-2xl ${activeSubTournament === cat ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}`}
                                            onClick={() => editingCategory !== cat && setActiveSubTournament(cat)}
                                        >
                                            <div className="absolute top-0 right-0 p-2 z-10 flex flex-col items-end gap-1">
                                                {isFinished ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 text-[8px] uppercase font-black px-2 py-0.5 shadow-lg shadow-green-500/20 animate-in zoom-in-50 duration-300">
                                                        Etapa Finalizada
                                                    </Badge>
                                                ) : isStarted ? (
                                                    <Badge className="bg-green-600 hover:bg-green-700 text-[8px] uppercase font-black px-2 py-0.5 shadow-lg shadow-green-600/20 animate-pulse">
                                                        Etapa Iniciada
                                                    </Badge>
                                                ) : null}
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingCategory(cat);
                                                            setEditCategoryName(cat);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Logic for deletion as before
                                                            if (id && tournament) {
                                                                const updated = (tournament.categories || []).filter(c => c !== cat);
                                                                const updatedRules = { ...(tournament.categoryRules || {}) };
                                                                delete updatedRules[cat];
                                                                const updatedCategoryAthletes = { ...(tournament.categoryAthletes || {}) };
                                                                delete updatedCategoryAthletes[cat];
                                                                tournamentService.update(id, {
                                                                    categories: updated,
                                                                    categoryRules: updatedRules,
                                                                    categoryAthletes: updatedCategoryAthletes
                                                                });
                                                                if (activeSubTournament === cat) setActiveSubTournament(null);
                                                                toast.success(`Torneio ${cat} removido.`);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <CardHeader className="pb-2">
                                                {editingCategory === cat ? (
                                                    <div className="flex items-center gap-2 w-full pt-4" onClick={(e) => e.stopPropagation()}>
                                                        <Input
                                                            value={editCategoryName}
                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                            className="h-9 text-sm font-bold uppercase rounded-lg"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveCategoryEdit(cat);
                                                                if (e.key === 'Escape') setEditingCategory(null);
                                                            }}
                                                        />
                                                        <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleSaveCategoryEdit(cat)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <CardTitle className="text-lg font-black tracking-tight uppercase group-hover:text-primary transition-colors pr-12">
                                                        {cat}
                                                    </CardTitle>
                                                )}
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase mb-2">
                                                    <span>Progresso</span>
                                                    <span>{finishedMatches}/{totalMatches} Jogos</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {/* Visual placeholder for athletes count or status */}
                                                        <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                                                            <Users className="h-3 w-3 text-primary" />
                                                        </div>
                                                        <div className="h-7 w-7 rounded-full bg-secondary/10 border-2 border-background flex items-center justify-center">
                                                            <PlayCircle className="h-3 w-3 text-secondary-foreground" />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-widest">
                                                        Gerenciar <ArrowLeft className="h-3 w-3 rotate-180" />
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {(!tournament?.categories || tournament.categories.length === 0) && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                                        <Trophy className="h-12 w-12 mb-4 opacity-20" />
                                        <p className="font-medium italic">Nenhuma categoria criada para esta etapa.</p>
                                        <p className="text-xs">Use o campo acima para adicionar novas categorias.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSubTournament && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                            {/* Drill-down Header/Back for sub-tournaments */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary h-10 w-10 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <span className="font-black uppercase text-lg leading-none tracking-tight block">{activeSubTournament}</span>
                                        <span className="text-[10px] text-primary uppercase font-black tracking-widest mt-1 block opacity-70">Gerenciando Categoria</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveSubTournament(null)}
                                    className="text-xs font-black uppercase h-10 px-6 bg-background border-primary/20 rounded-xl shadow-sm hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-2 group"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    Voltar para Etapa
                                </Button>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                                {/* Mobile Active Tab Indicator */}
                                <div className="md:hidden flex items-center justify-between bg-card border rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                            {activeTab === 'rules' && <ListFilter className="h-5 w-5" />}
                                            {activeTab === 'courts' && <MapPin className="h-5 w-5" />}
                                            {activeTab === 'athletes' && <Users className="h-5 w-5" />}
                                            {activeTab === 'groups' && <LayoutGrid className="h-5 w-5" />}
                                            {activeTab === 'matches' && <PlayCircle className="h-5 w-5" />}
                                            {activeTab === 'brackets' && <GitBranch className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block opacity-70">Visualizando</span>
                                            <span className="font-black uppercase text-base leading-none tracking-tight block">
                                                {activeTab === 'rules' && 'Regras'}
                                                {activeTab === 'courts' && 'Quadras'}
                                                {activeTab === 'athletes' && 'Atletas'}
                                                {activeTab === 'groups' && 'Grupos'}
                                                {activeTab === 'matches' && 'Jogos'}
                                                {activeTab === 'brackets' && 'Chaves'}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary">Ativo</Badge>
                                </div>

                                <div className="hidden md:block sticky top-[70px] z-40 bg-background/95 backdrop-blur-md -mx-4 px-4 py-3 border-b border-muted/20 md:relative md:top-0 md:bg-transparent md:border-none md:p-0 md:m-0 overflow-x-auto no-scrollbar">
                                    <TabsList className="bg-muted/30 p-1.5 rounded-2xl inline-flex min-w-full md:w-auto h-auto gap-1.5 border border-muted-foreground/5 shadow-inner">
                                        <TabsTrigger value="rules" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Regras</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="courts" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <MapPin className="h-4 w-4" />
                                            <span>Quadras</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="athletes" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <Users className="h-4 w-4" />
                                            <span>Atletas</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="groups" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <LayoutGrid className="h-4 w-4" />
                                            <span>Grupos</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="matches" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <PlayCircle className="h-4 w-4" />
                                            <span>Jogos</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="brackets" className="flex flex-col md:flex-row items-center gap-2 px-5 py-3 text-[10px] md:text-xs uppercase font-black tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all duration-300">
                                            <GitBranch className="h-4 w-4" />
                                            <span>Chaves</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="courts">
                                    <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Quadras</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Localização e pin de controle de placar.</CardDescription>
                                            </div>
                                            <Button size="sm" onClick={() => { setEditingCourt(null); form.reset({ name: "" }); setOpen(true); }} className="w-full md:w-auto h-10 md:h-8 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                                <Plus className="mr-2 h-4 w-4" /> Nova Quadra
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {courts.map((court) => (
                                                    <div key={court.id} className="rounded-lg border p-4 bg-card shadow-sm">
                                                        <div className="flex justify-between items-start font-bold mb-2">
                                                            <div className="flex flex-col">
                                                                <span>{court.name}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase font-normal">{court.status.replace('_', ' ')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary">{court.pin}</Badge>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => courtService.remove(court.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="athletes">
                                    <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Atletas - {activeSubTournament}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Inscritos nesta categoria.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {tournament && <TournamentAthleteManager tournament={tournament} activeCategory={activeSubTournament} />}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="groups">
                                    <Card>
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div>
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Grupos - {activeSubTournament}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Classificação e chaves da fase de grupos.</CardDescription>
                                            </div>
                                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                                <Button variant="outline" size="sm" onClick={() => setOpenManualGroups(true)} className="flex-1 md:flex-none h-10 md:h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-primary/20 hover:bg-primary/5">
                                                    Manual
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={async () => {
                                                    if (!id || !tournament || !activeSubTournament) return;
                                                    setIsGeneratingAuto(true);
                                                    try {
                                                        const eligibleAthletes = getEligibleAthletesForCategory(activeSubTournament);

                                                        if (eligibleAthletes.length >= 2) {
                                                            await matchService.generateGroupMatches(id, activeSubTournament, eligibleAthletes, tournament.type);
                                                            toast.success("Fase de Grupos gerada!");
                                                        } else {
                                                            toast.error(`Atletas insuficientes para a categoria ${activeSubTournament} (mínimo 2).`);
                                                        }
                                                    } catch (e: any) { toast.error(e.message); }
                                                    finally { setIsGeneratingAuto(false); }
                                                }} disabled={isGeneratingAuto} className="flex-1 md:flex-none h-10 md:h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                                    Auto
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-8 md:space-y-12">
                                                {(() => {
                                                    const groups = Array.from(new Set(filteredMatches.filter(m => m.group).map(m => m.group))).sort();
                                                    if (groups.length === 0) return (
                                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl italic">
                                                            Nenhum grupo encontrado para {activeSubTournament}.
                                                        </div>
                                                    );

                                                    return (
                                                        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                                                            {groups.map(g => (
                                                                <GroupStandings
                                                                    key={`${activeSubTournament}-${g}`}
                                                                    tournamentId={id}
                                                                    category={activeSubTournament}
                                                                    groupName={g!}
                                                                    matches={filteredMatches.filter(m => m.group === g)}
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="matches">
                                    <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Jogos - {activeSubTournament}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Gerenciamento de partidas e resultados.</CardDescription>
                                            </div>
                                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setOpenResetConfirm(true)}
                                                    className="flex-1 md:flex-none h-10 md:h-8 text-[10px] font-black uppercase tracking-widest text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl"
                                                >
                                                    <RotateCcw className="mr-2 h-3 w-3" />
                                                    Resetar Quadras
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setEditingMatch(null); setOpenMatchDialog(true); }}
                                                    className="flex-1 md:flex-none h-10 md:h-8 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" /> Novo Jogo
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {id && <MatchList
                                                tournamentId={id}
                                                courts={courts}
                                                matches={filteredMatches.filter(m => !m.round || m.round === 'Grupos')}
                                                onEdit={(m) => { setEditingMatch(m); setOpenMatchDialog(true); }}
                                            />}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="brackets">
                                    <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Mata-Mata - {activeSubTournament}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Chaves eliminatórias e finais.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {id && tournament && (
                                                <TournamentBrackets
                                                    tournamentId={id}
                                                    tournamentType={tournament.type as any}
                                                    matches={filteredMatches}
                                                    courts={courts}
                                                    onEdit={(m) => { setEditingMatch(m); setOpenMatchDialog(true); }}
                                                    activeCategory={activeSubTournament}
                                                    onGenerateEliminatories={async () => {
                                                        if (!id || !activeSubTournament) return;
                                                        try {
                                                            await matchService.promoteGroupWinners(id, activeSubTournament, 2);
                                                            toast.success("Eliminatórias geradas com sucesso!");
                                                        } catch (e: any) { toast.error(e.message); }
                                                    }}
                                                    isGroupStageFinished={(() => {
                                                        const groupMatches = filteredMatches.filter(m => m.round === 'Grupos');
                                                        if (groupMatches.length === 0) return true; // Se não tem grupos, considera ok
                                                        return groupMatches.every(m => m.status === 'finished');
                                                    })()}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="rules">
                                    <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between px-0 md:px-6 pb-6 gap-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Regras - {activeSubTournament}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Permissões de atleta por categoria.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Gender Filter Selection */}
                                            <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 transition-all duration-300">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Restrição de Gênero</Label>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Masculino', 'Feminino', 'Mista'].map((g) => {
                                                        const currentGender = tournament?.categoryGender?.[activeSubTournament] || 'Mista';
                                                        const isSelected = currentGender === g;
                                                        return (
                                                            <Button
                                                                key={g}
                                                                variant={isSelected ? "default" : "outline"}
                                                                size="sm"
                                                                className={`h-10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${isSelected ? 'shadow-lg shadow-primary/20' : 'bg-background hover:bg-primary/5 hover:text-primary border-primary/10'}`}
                                                                onClick={async () => {
                                                                    if (!id || !tournament) return;
                                                                    const updatedGender = { ...(tournament.categoryGender || {}) };
                                                                    updatedGender[activeSubTournament] = g as any;
                                                                    await tournamentService.update(id, { categoryGender: updatedGender });
                                                                    toast.success(`Gênero definido para ${g}!`);
                                                                }}
                                                            >
                                                                {g === 'Masculino' && <User className="mr-1.5 h-3 w-3" />}
                                                                {g === 'Feminino' && <UserCheck className="mr-1.5 h-3 w-3" />}
                                                                {g === 'Mista' && <Users className="mr-1.5 h-3 w-3" />}
                                                                {g}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic font-medium">
                                                    {tournament?.categoryGender?.[activeSubTournament] === 'Masculino' && "Apenas atletas do sexo Masculino poderão participar desta categoria."}
                                                    {tournament?.categoryGender?.[activeSubTournament] === 'Feminino' && "Apenas atletas do sexo Feminino poderão participar desta categoria."}
                                                    {(tournament?.categoryGender?.[activeSubTournament] === 'Mista' || !tournament?.categoryGender?.[activeSubTournament]) && "Atletas de ambos os sexos podem participar desta categoria."}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ListFilter className="h-4 w-4 text-primary" />
                                                    <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Nível Técnico (Tags)</Label>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {allGlobalCategories.map((cat) => {
                                                        const rules = tournament?.categoryRules?.[activeSubTournament] || [];
                                                        const isChecked = rules.includes(cat);

                                                        return (
                                                            <div key={cat} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isChecked ? 'bg-primary/5 border-primary shadow-sm hover:bg-primary/10' : 'bg-card border-muted/50 hover:border-primary/30 hover:bg-muted/30'}`}
                                                                onClick={async () => {
                                                                    if (!id || !tournament) return;
                                                                    const currentRules = { ...(tournament.categoryRules || {}) };
                                                                    const activeRules = currentRules[activeSubTournament] || [];

                                                                    if (isChecked) {
                                                                        currentRules[activeSubTournament] = activeRules.filter(c => c !== cat);
                                                                    } else {
                                                                        currentRules[activeSubTournament] = [...activeRules, cat];
                                                                    }

                                                                    if (currentRules[activeSubTournament].length === 0) {
                                                                        delete currentRules[activeSubTournament];
                                                                    }

                                                                    await tournamentService.update(id, { categoryRules: currentRules });
                                                                    toast.success(`Regra ${isChecked ? 'removida' : 'adicionada'}!`);
                                                                }}
                                                            >
                                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted-foreground/30'}`}>
                                                                    {isChecked && <Check className="h-3 w-3" />}
                                                                </div>
                                                                <Label className="cursor-pointer flex-1 font-bold text-xs uppercase tracking-tight">{cat}</Label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </main >

            {/* Mobile Floating Action Menu (FAB) */}
            < div className="fixed bottom-24 right-6 z-40 md:hidden" >
                {activeSubTournament && (
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                size="icon"
                                className="h-16 w-16 rounded-full shadow-2xl shadow-primary/40 bg-primary animate-in zoom-in-50 duration-300 flex flex-col items-center justify-center gap-1"
                            >
                                <LayoutGrid className="h-6 w-6" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-12 pt-8">
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-left flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black uppercase tracking-tight">Gerenciamento</span>
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{activeSubTournament}</span>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'rules', label: 'Regras', icon: ListFilter, color: 'text-blue-500' },
                                    { id: 'courts', label: 'Quadras', icon: MapPin, color: 'text-orange-500' },
                                    { id: 'athletes', label: 'Atletas', icon: Users, color: 'text-purple-500' },
                                    { id: 'groups', label: 'Grupos', icon: LayoutGrid, color: 'text-green-500' },
                                    { id: 'matches', label: 'Jogos', icon: PlayCircle, color: 'text-red-500' },
                                    { id: 'brackets', label: 'Chaves', icon: GitBranch, color: 'text-indigo-500' },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <Button
                                            key={item.id}
                                            variant={isActive ? "default" : "outline"}
                                            className={`h-auto flex-col items-start gap-4 p-5 rounded-2xl transition-all duration-300 ${isActive ? 'shadow-xl shadow-primary/20 -translate-y-1' : 'hover:bg-primary/5'}`}
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <div className={`${isActive ? 'bg-primary-foreground/20' : 'bg-muted'} p-2 rounded-xl`}>
                                                <Icon className={`h-6 w-6 ${isActive ? 'text-primary-foreground' : item.color}`} />
                                            </div>
                                            <span className="font-black uppercase text-xs tracking-widest">{item.label}</span>
                                        </Button>
                                    );
                                })}

                                <div className="col-span-2 pt-4 mt-4 border-t border-dashed">
                                    <Button
                                        className="w-full h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setOpenMatchDialog(true);
                                        }}
                                    >
                                        <Plus className="h-5 w-5" />
                                        Novo Jogo
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                )
                }
            </div >

            {/* Modals */}
            < Dialog open={open} onOpenChange={setOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCourt ? "Editar Quadra" : "Adicionar Quadra da Arena"}</DialogTitle>
                        <DialogDescription>
                            Selecione uma das quadras cadastradas na arena {tournament?.location} para este evento.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quadra</FormLabel>
                                        {!isCustomCourt ? (
                                            <Select
                                                onValueChange={(val) => {
                                                    if (val === "CUSTOM") {
                                                        setIsCustomCourt(true);
                                                        field.onChange("");
                                                    } else {
                                                        field.onChange(val);
                                                    }
                                                }}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione uma quadra..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {editingCourt && (
                                                        <SelectItem value={editingCourt.name}>{editingCourt.name} (Atual)</SelectItem>
                                                    )}
                                                    {pendingCourts.map(ac => (
                                                        <SelectItem key={ac.id} value={ac.name}>{ac.name}</SelectItem>
                                                    ))}
                                                    <SelectItem value="CUSTOM">+ Nome Personalizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Digite o nome da quadra..."
                                                        {...field}
                                                        autoFocus
                                                    />
                                                </FormControl>
                                                <Button variant="ghost" size="sm" onClick={() => { setIsCustomCourt(false); field.onChange(""); }}>
                                                    Voltar
                                                </Button>
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={!form.watch("name")}>
                                {editingCourt ? "Salvar Alterações" : "Adicionar à Grade"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog >

            <Dialog open={openMatchDialog} onOpenChange={setOpenMatchDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingMatch ? "Editar Jogo" : "Novo Jogo"}</DialogTitle></DialogHeader>
                    {id && <MatchForm tournamentId={id} tournamentType={tournament?.type || 'Duplas'} matches={matches} courts={courts} categories={tournament?.categories} categoryGender={tournament?.categoryGender} categoryAthletes={tournament?.categoryAthletes} onSuccess={() => setOpenMatchDialog(false)} initialData={editingMatch || undefined} />}
                </DialogContent>
            </Dialog>

            {/* Configurações da Etapa */}
            <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações de Jogo</DialogTitle>
                        <DialogDescription>Defina as regras para todas as categorias desta etapa.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label>Games por Set</Label>
                            <Input
                                type="number"
                                value={tournament?.settings?.gamesPerSet || 6}
                                onChange={(e) => {
                                    if (id) tournamentService.update(id, { settings: { ...tournament?.settings, gamesPerSet: parseInt(e.target.value) } as any });
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Padrão: 6 games (Pro-set).</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Ponto de Ouro (No-Ad)</Label>
                                <p className="text-[10px] text-muted-foreground">Sem vantagem. Quem faz o ponto em 40-40 ganha o game.</p>
                            </div>
                            <Switch
                                checked={tournament?.settings?.noAd ?? true}
                                onCheckedChange={(checked) => {
                                    if (id) tournamentService.update(id, { settings: { ...tournament?.settings, noAd: checked } as any });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Sets para vencer</Label>
                            <Input
                                type="number"
                                value={tournament?.settings?.setsToWin || 1}
                                onChange={(e) => {
                                    if (id) tournamentService.update(id, { settings: { ...tournament?.settings, setsToWin: parseInt(e.target.value) } as any });
                                }}
                            />
                        </div>

                        <Button className="w-full" onClick={() => setOpenSettings(false)}>Fechar e Salvar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* QR Code Dialog */}
            <Dialog open={openQR} onOpenChange={setOpenQR}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Compartilhar Etapa</DialogTitle>
                        <DialogDescription>Apresente este QR Code para os jogadores acessarem os resultados.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="bg-white p-4 rounded-xl shadow-inner border">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/torneio/' + id)}`}
                                alt="QR Code da Etapa"
                                className="w-48 h-48"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground break-all px-4">{window.location.origin}/torneio/{id}</p>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full gap-2"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + '/torneio/' + id);
                                toast.success("Link copiado!");
                            }}
                        >
                            <Share2 className="h-4 w-4" /> Copiar Link
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {
                id && tournament && activeSubTournament && (
                    <ManualGroupGenerator
                        tournamentId={id}
                        athletes={getEligibleAthletesForCategory(activeSubTournament)}
                        tournamentType={tournament.type as any}
                        open={openManualGroups}
                        onOpenChange={setOpenManualGroups}
                        activeCategory={activeSubTournament}
                        onSuccess={() => {
                            toast.success("Grupos manuais gerados!");
                        }}
                    />
                )
            }

            <AlertDialog open={openResetConfirm} onOpenChange={setOpenResetConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resetar todas as quadras?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá a atribuição de quadra de todos os jogos **planejados**. Jogos em andamento ou finalizados não serão afetados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!id) return;
                                await matchService.resetCourtsByTournament(id);
                                toast.success("Quadras resetadas com sucesso!");
                                setOpenResetConfirm(false);
                            }}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                            Resetar Quadras
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Bottom Navigation for Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t px-6 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <Link to="/admin" className="flex flex-col items-center gap-1 text-primary">
                        <Trophy className="h-6 w-6" />
                        <span className="text-[10px] font-bold">Etapas</span>
                    </Link>
                    <Link to="/admin/athletes" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Users className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Atletas</span>
                    </Link>
                    <Link to="/admin/arenas" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <MapPin className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Arenas</span>
                    </Link>
                    <Link to="/admin/sponsors" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Ads</span>
                    </Link>
                </div>
            </nav>
        </div >
    );
}
