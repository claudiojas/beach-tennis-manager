import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, QrCode, Pencil, Loader2, PlayCircle, Settings, Trophy, Share2, Unlock, RotateCcw } from "lucide-react";
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
import { Court, Match, Tournament, Player } from "@/types/beach-tennis";
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
                const catAthletes = athletes.filter(a => a.category.toUpperCase() === cat.toUpperCase());
                if (catAthletes.length >= 2) {
                    await matchService.generateGroupMatches(id, catAthletes, tournament.type);
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
    const filteredMatches = matches;

    const matchingArena = arenas.find(a => a.name === tournament?.location);
    const availableCourtsFromTemplate = matchingArena?.courts || [];
    const addedCourtNames = courts.map(c => c.name);
    const pendingCourts = availableCourtsFromTemplate.filter(ac => !addedCourtNames.includes(ac.name));

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-bold flex items-center gap-2 leading-none">
                                {tournament?.name || "Gerenciar Torneio"}
                            </h1>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {tournament && (
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none uppercase text-[9px] h-4 px-1.5 font-black">
                                        {tournament.type}
                                    </Badge>
                                )}
                                {tournament?.categories?.map(cat => (
                                    <Badge key={cat} variant="outline" className="uppercase text-[9px] h-4 px-1.5 border-white/20 text-muted-foreground font-bold">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px]"
                                onClick={() => setOpenQR(true)}
                            >
                                <QrCode className="mr-2 h-3 w-3" />
                                Link Público
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px]"
                                onClick={() => setOpenSettings(true)}
                            >
                                <Settings className="mr-2 h-3 w-3" />
                                Regras
                            </Button>

                            {tournament?.status === 'active' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 text-[10px]"
                                        >
                                            Finalizar Torneio
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Deseja finalizar o torneio?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação irá encerrar o torneio e gerar o Hall da Fama. Não será possível reverter sem intervenção do sistema.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => {
                                                tournamentService.update(id!, { status: 'finished' });
                                                toast.success("Torneio finalizado!");
                                            }} className="bg-destructive text-destructive-foreground">Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </div>


            </header>

            <main className="mx-auto max-w-5xl p-6">
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

                <Tabs defaultValue="courts" className="space-y-4">
                    <TabsList className="bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="courts">Quadras</TabsTrigger>
                        <TabsTrigger value="athletes">Atletas</TabsTrigger>
                        <TabsTrigger value="groups">Fase de Grupos</TabsTrigger>
                        <TabsTrigger value="matches">Jogos</TabsTrigger>
                        <TabsTrigger value="brackets">Mata-mata</TabsTrigger>
                    </TabsList>

                    <TabsContent value="courts">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Quadras</CardTitle>
                                    <CardDescription>Gerencie o acesso dos árbitros.</CardDescription>
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
                                <CardTitle>Participantes</CardTitle>
                                <CardDescription>Selecione quem participa deste torneio.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tournament && <TournamentAthleteManager tournament={tournament} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="groups">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardDescription>Classificação de todos os grupos do evento.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setOpenManualGroups(true)} className="h-8 text-[10px]">
                                        Gerar Manual
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleGenerateInitialMatches} disabled={isGeneratingAuto} className="h-8 text-[10px]">
                                        Gerar Automático (Todas Categorias)
                                    </Button>
                                    <Button size="sm" onClick={async () => {
                                        if (!id || !tournament) return;
                                        try {
                                            for (const cat of (tournament.categories || [])) {
                                                await matchService.promoteGroupWinners(id, cat, 2);
                                            }
                                            toast.success("Mata-mata gerado para todas categorias!");
                                        } catch (e: any) { toast.error(e.message); }
                                    }} disabled={!filteredMatches.some(m => m.status === 'finished')}>
                                        Promover Vencedores
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-12">
                                    {(tournament?.categories || availableCategories).map(cat => {
                                        const catMatches = matches.filter(m => m.category.toUpperCase() === cat.toUpperCase() && m.group);
                                        if (catMatches.length === 0) return null;
                                        const groups = Array.from(new Set(catMatches.map(m => m.group))).sort();

                                        return (
                                            <div key={cat} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs font-black uppercase px-3 py-1">
                                                        Categoria {cat}
                                                    </Badge>
                                                    <div className="h-px bg-border flex-1" />
                                                </div>
                                                <div className="grid gap-8 md:grid-cols-2">
                                                    {groups.map(g => (
                                                        <GroupStandings
                                                            key={`${cat}-${g}`}
                                                            tournamentId={id}
                                                            category={cat}
                                                            groupName={g!}
                                                            matches={catMatches.filter(m => m.group === g)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!filteredMatches.some(m => m.group)) && (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl italic">
                                            Nenhum grupo encontrado para esta seleção.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="matches">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Lista de Jogos</CardTitle>
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
                                    <CardTitle>Chaves de Eliminatórias</CardTitle>
                                    <CardDescription>Mata-mata de todas as categorias do evento</CardDescription>
                                </div>
                                {tournament?.status === 'finished' && (
                                    <Badge variant="default" className="bg-yellow-500 text-black gap-1">
                                        <Trophy className="h-3 w-3" /> Torneio Finalizado
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                {id && tournament && <TournamentBrackets tournamentId={id} tournamentType={tournament.type as any} matches={filteredMatches} courts={courts} onEdit={(m) => { setEditingMatch(m); setOpenMatchDialog(true); }} activeCategory={tournament.categories?.[0]} />}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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

            {/* Configurações do Torneio */}
            <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações de Jogo</DialogTitle>
                        <DialogDescription>Defina as regras para todas as categorias deste torneio.</DialogDescription>
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
                        <DialogTitle>Compartilhar Torneio</DialogTitle>
                        <DialogDescription>Apresente este QR Code para os jogadores acessarem os resultados.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="bg-white p-4 rounded-xl shadow-inner border">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/torneio/' + id)}`}
                                alt="QR Code do Torneio"
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
        </div>
    );
}
