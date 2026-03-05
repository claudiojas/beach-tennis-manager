import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, QrCode, Pencil, Loader2, PlayCircle, Settings, Trophy, Share2, Unlock, RotateCcw, Users, MapPin, Image as ImageIcon, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const [matchToRelease, setMatchToRelease] = useState<Match | null>(null);
    const [openManualGroups, setOpenManualGroups] = useState(false);
    const [openResetConfirm, setOpenResetConfirm] = useState(false);
    const [activeSubTournament, setActiveSubTournament] = useState<string | null>(null);

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
                        const participIds = current.participatingAthleteIds || [];
                        const filtered = allAthletes.filter(a => participIds.includes(a.id));
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
                // Determine which athletes are eligible for this specific category
                let eligibleAthletes: typeof athletes = [];

                // If there are specific athletes enrolled for this category, use them
                const specificCategoryAthletes = tournament.categoryAthletes?.[cat];
                if (specificCategoryAthletes && specificCategoryAthletes.length > 0) {
                    eligibleAthletes = athletes.filter(a => specificCategoryAthletes.includes(a.id));
                } else {
                    // Fallback to global behavior
                    const rules = tournament.categoryRules?.[cat] || [];
                    eligibleAthletes = athletes.filter(a => {
                        const athleteCategories = a.categories || (a.category ? [a.category] : []);
                        if (rules.length > 0) {
                            return athleteCategories.some(c => rules.includes(c));
                        }
                        return athleteCategories.map(c => c.toUpperCase()).includes(cat.toUpperCase());
                    });
                }

                if (eligibleAthletes.length >= 2) {
                    await matchService.generateGroupMatches(id, cat, eligibleAthletes, tournament.type);
                }
            }

            if (athletes.length < 2) throw new Error("Atletas insuficientes neste torneio.");

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
                    <div className="flex-1 min-w-0">
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
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Torneios e Categorias</CardTitle>
                                    <CardDescription>Adicione as categorias que serão disputadas nesta etapa.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            placeholder="Ex: Masculina A, Mista Open, Iniciante..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="max-w-xs rounded-xl"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddCategory();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddCategory}
                                            className="rounded-xl shadow-lg shadow-primary/10"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Adicionar Torneio
                                        </Button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {tournament?.categories?.map(cat => (
                                            <div
                                                key={cat}
                                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group shadow-sm hover:shadow-md ${activeSubTournament === cat ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-card hover:bg-accent/50'} ${editingCategory === cat ? 'ring-2 ring-primary border-primary bg-background' : ''}`}
                                                onClick={() => {
                                                    if (editingCategory !== cat) {
                                                        setActiveSubTournament(cat);
                                                    }
                                                }}
                                            >
                                                {editingCategory === cat ? (
                                                    <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                                                        <Input
                                                            value={editCategoryName}
                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                            className="h-10 text-sm md:text-base font-bold uppercase flex-1 rounded-lg"
                                                            autoFocus
                                                            placeholder="NOME DO TORNEIO"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveCategoryEdit(cat);
                                                                if (e.key === 'Escape') setEditingCategory(null);
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Button size="icon" variant="default" className="h-10 w-10 shrink-0 shadow-sm rounded-lg" onClick={() => handleSaveCategoryEdit(cat)}>
                                                                <Check className="h-5 w-5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => setEditingCategory(null)}>
                                                                <X className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-2 w-2 rounded-full ${activeSubTournament === cat ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                                                            <span className="font-bold text-sm uppercase">{cat}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingCategory(cat);
                                                                    setEditCategoryName(cat);
                                                                }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (id && tournament) {
                                                                        const updated = (tournament.categories || []).filter(c => c !== cat);

                                                                        // Cleanup rules and athletes when a category is deleted
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
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {(!tournament?.categories || tournament.categories.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl italic">
                                            Nenhuma categoria/torneio criado para esta etapa.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeSubTournament && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            {/* Drill-down Header/Back for sub-tournaments */}
                            <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/10">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
                                        <Trophy className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                    <span className="font-black uppercase text-xs tracking-tight">{activeSubTournament}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveSubTournament(null)}
                                    className="text-xs font-bold uppercase h-8 px-4 bg-background border rounded-lg shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Button>
                            </div>

                            <Tabs defaultValue="rules" className="space-y-4">
                                <div className="sticky top-[60px] z-40 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-2 border-b md:relative md:top-0 md:bg-transparent md:border-none md:p-0 md:m-0 overflow-x-auto no-scrollbar">
                                    <TabsList className="bg-muted/50 p-1 rounded-lg inline-flex min-w-full md:w-auto">
                                        <TabsTrigger value="rules" className="text-[10px] md:text-sm uppercase font-bold">Regras</TabsTrigger>
                                        <TabsTrigger value="courts" className="text-[10px] md:text-sm uppercase font-bold">Quadras</TabsTrigger>
                                        <TabsTrigger value="athletes" className="text-[10px] md:text-sm uppercase font-bold">Atletas</TabsTrigger>
                                        <TabsTrigger value="groups" className="text-[10px] md:text-sm uppercase font-bold">Grupos</TabsTrigger>
                                        <TabsTrigger value="matches" className="text-[10px] md:text-sm uppercase font-bold">Jogos</TabsTrigger>
                                        <TabsTrigger value="brackets" className="text-[10px] md:text-sm uppercase font-bold">Chaves</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="courts">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Quadras Disponíveis</CardTitle>
                                                <CardDescription>Gerencie as quadras para {activeSubTournament}.</CardDescription>
                                            </div>
                                            <Button onClick={() => { setEditingCourt(null); form.reset({ name: "" }); setOpen(true); }}>
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
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Inscritos em {activeSubTournament}</CardTitle>
                                            <CardDescription>Gerencie os atletas desta categoria.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {tournament && <TournamentAthleteManager tournament={tournament} activeCategory={activeSubTournament} />}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="groups">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Fase de Grupos - {activeSubTournament}</CardTitle>
                                                <CardDescription>Classificação e placares.</CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setOpenManualGroups(true)} className="h-8 text-[10px]">
                                                    Gerar Manual
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={async () => {
                                                    if (!id || !tournament || !activeSubTournament) return;
                                                    setIsGeneratingAuto(true);
                                                    try {
                                                        let eligibleAthletes: typeof athletes = [];
                                                        const specificCategoryAthletes = tournament.categoryAthletes?.[activeSubTournament];

                                                        if (specificCategoryAthletes && specificCategoryAthletes.length > 0) {
                                                            eligibleAthletes = athletes.filter(a => specificCategoryAthletes.includes(a.id));
                                                        } else {
                                                            const rules = tournament.categoryRules?.[activeSubTournament] || [];
                                                            eligibleAthletes = athletes.filter(a => {
                                                                const athleteCategories = a.categories || (a.category ? [a.category] : []);
                                                                if (rules.length > 0) {
                                                                    return athleteCategories.some(c => rules.includes(c));
                                                                }
                                                                return athleteCategories.map(c => c.toUpperCase()).includes(activeSubTournament.toUpperCase());
                                                            });
                                                        }

                                                        if (eligibleAthletes.length >= 2) {
                                                            await matchService.generateGroupMatches(id, activeSubTournament, eligibleAthletes, tournament.type);
                                                            toast.success("Fase de Grupos gerada!");
                                                        } else {
                                                            toast.error("Atletas insuficientes nesta categoria (mínimo 2).");
                                                        }
                                                    } catch (e: any) { toast.error(e.message); }
                                                    finally { setIsGeneratingAuto(false); }
                                                }} disabled={isGeneratingAuto} className="h-8 text-[10px]">
                                                    Gerar Automático
                                                </Button>
                                                <Button size="sm" onClick={async () => {
                                                    if (!id || !tournament) return;
                                                    try {
                                                        await matchService.promoteGroupWinners(id, activeSubTournament, 2);
                                                        toast.success("Mata-mata gerado!");
                                                    } catch (e: any) { toast.error(e.message); }
                                                }} disabled={!filteredMatches.some(m => m.status === 'finished')}>
                                                    Promover Vencedores
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-12">
                                                {(() => {
                                                    const groups = Array.from(new Set(filteredMatches.filter(m => m.group).map(m => m.group))).sort();
                                                    if (groups.length === 0) return (
                                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl italic">
                                                            Nenhum grupo encontrado para {activeSubTournament}.
                                                        </div>
                                                    );

                                                    return (
                                                        <div className="grid gap-8 md:grid-cols-2">
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
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Jogos - {activeSubTournament}</CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setOpenResetConfirm(true)}
                                                    className="h-8 text-[10px] text-orange-600 border-orange-200 hover:bg-orange-50"
                                                >
                                                    <RotateCcw className="mr-2 h-3 w-3" />
                                                    Resetar Quadras
                                                </Button>
                                                <Button size="sm" onClick={() => { setEditingMatch(null); setOpenMatchDialog(true); }}>
                                                    <Plus className="mr-2 h-4 w-4" /> Novo Jogo
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {id && <MatchList tournamentId={id} courts={courts} matches={filteredMatches} onEdit={(m) => { setEditingMatch(m); setOpenMatchDialog(true); }} />}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="brackets">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Mata-mata - {activeSubTournament}</CardTitle>
                                                <CardDescription>Chaves eliminatórias.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {id && tournament && <TournamentBrackets tournamentId={id} tournamentType={tournament.type as any} matches={filteredMatches} courts={courts} onEdit={(m) => { setEditingMatch(m); setOpenMatchDialog(true); }} activeCategory={activeSubTournament} />}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="rules">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Regras de Inscrição - {activeSubTournament}</CardTitle>
                                            <CardDescription>
                                                Quais atletas têm permissão para jogar este torneio?
                                                Se nenhuma opção for marcada, o sistema exigirá que o atleta tenha a categoria exata "{activeSubTournament}".
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {TOURNAMENT_CATEGORIES.map((cat) => {
                                                    const rules = tournament?.categoryRules?.[activeSubTournament] || [];
                                                    const isChecked = rules.includes(cat);

                                                    return (
                                                        <div key={cat} className="flex items-center space-x-2 p-2 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                                                            onClick={async () => {
                                                                if (!id || !tournament) return;
                                                                const currentRules = { ...(tournament.categoryRules || {}) };
                                                                const activeRules = currentRules[activeSubTournament] || [];

                                                                if (isChecked) {
                                                                    currentRules[activeSubTournament] = activeRules.filter(c => c !== cat);
                                                                } else {
                                                                    currentRules[activeSubTournament] = [...activeRules, cat];
                                                                }

                                                                // Se ficou vazio, remove a chave para limpar o banco
                                                                if (currentRules[activeSubTournament].length === 0) {
                                                                    delete currentRules[activeSubTournament];
                                                                }

                                                                await tournamentService.update(id, { categoryRules: currentRules });
                                                                toast.success(`Regra ${isChecked ? 'removida' : 'adicionada'}!`);
                                                            }}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center border-primary ${isChecked ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                                                {isChecked && <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>}
                                                            </div>
                                                            <Label className="cursor-pointer flex-1 font-bold text-sm uppercase">{cat}</Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <Dialog open={open} onOpenChange={setOpen}>
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
            </Dialog>

            <Dialog open={openMatchDialog} onOpenChange={setOpenMatchDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingMatch ? "Editar Jogo" : "Novo Jogo"}</DialogTitle></DialogHeader>
                    {id && <MatchForm tournamentId={id} tournamentType={tournament?.type || 'Duplas'} matches={matches} courts={courts} categories={tournament?.categories} onSuccess={() => setOpenMatchDialog(false)} initialData={editingMatch || undefined} />}
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
                            <p className="text-sm font-bold uppercase tracking-widest text-primary">{tournament?.name}</p>
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
            {/* Force Release Dialog */}
            <AlertDialog open={!!matchToRelease} onOpenChange={() => setMatchToRelease(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Forçar Liberação de Dispositivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá remover a trava de segurança do celular do árbitro sem encerrar a partida e sem perder o placar atual. Utilize apenas se o dispositivo original estiver inacessível.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (matchToRelease) {
                                    await matchService.releaseMatch(matchToRelease.id);
                                    toast.success("Partida liberada para novos dispositivos!");
                                    setMatchToRelease(null);
                                }
                            }}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                            Liberar Controle
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {id && tournament && (
                <ManualGroupGenerator
                    tournamentId={id}
                    athletes={athletes}
                    tournamentType={tournament.type as any}
                    open={openManualGroups}
                    onOpenChange={setOpenManualGroups}
                    activeCategory={activeSubTournament!}
                    onSuccess={() => {
                        toast.success("Grupos manuais gerados!");
                    }}
                />
            )}

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
        </div>
    );
}
