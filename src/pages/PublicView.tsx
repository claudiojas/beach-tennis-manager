import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { tournamentService } from "@/services/tournamentService";
import { courtService } from "@/services/courtService";
import { matchService } from "@/services/matchService";
import { arenaService } from "@/services/arenaService";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Court, Match, Tournament, Arena } from "@/types/beach-tennis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, MapPin, Activity, Clock, ChevronDown, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GroupStandings } from "@/components/matches/GroupStandings";
import { TournamentBrackets } from "@/components/matches/TournamentBrackets";
import { PublicMatchCard } from "@/components/public/PublicMatchCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PublicView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
    const [arena, setArena] = useState<Arena | null>(null);
    const [courts, setCourts] = useState<Court[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("TODOS");

    useEffect(() => {
        // 1. Subscribe to all tournaments (for the switcher)
        const unsubAll = tournamentService.subscribe((tournaments) => {
            const active = tournaments.filter(t => t.status === 'active' || t.status === 'planning');
            setAllTournaments(active);
        });

        if (id) {
            // 2. Direct subscription to current tournament
            const tournamentRef = ref(db, `tournaments/${id}`);
            const unsubTournament = onValue(tournamentRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setTournament(data as Tournament);
                }
            });

            // 3. Subscription to courts and matches
            const unsubCourts = courtService.subscribeByTournament(id, setCourts);
            const unsubMatches = matchService.subscribeByTournament(id, setMatches);

            return () => {
                unsubAll();
                unsubTournament();
                unsubCourts();
                unsubMatches();
            };
        }

        return () => unsubAll();
    }, [id]);

    // Separate effect for arena to avoid re-triggering tournament sub
    useEffect(() => {
        if (tournament?.arenaId) {
            const arenaRef = ref(db, `arenas/${tournament.arenaId}`);
            const unsubscribe = onValue(arenaRef, (snapshot) => {
                const data = snapshot.val();
                if (data) setArena(data);
            });
            return () => unsubscribe();
        } else if (tournament?.location) {
            // Fallback: search by name once if no arenaId
            arenaService.getAllOnce().then(arenas => {
                const found = arenas.find(a => a.name === tournament.location);
                if (found) setArena(found);
            });
        }
    }, [tournament?.arenaId, tournament?.location]);

    if (!tournament) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Activity className="h-12 w-12 text-primary animate-pulse mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Carregando torneio...</p>
                </div>
            </div>
        );
    }

    const allCategories = Array.from(new Set([
        ...(tournament?.categories || []).map(cat => typeof cat === 'string' ? cat : cat.name),
        ...matches.map(m => {
            if (m.categoryId && tournament?.categories) {
                const official = tournament.categories.find(c => typeof c === 'object' && c.id === m.categoryId);
                if (official && typeof official === 'object') return official.name;
            }
            return m.category;
        })
    ])).filter(Boolean).sort();

    const filteredMatches = selectedCategory === "TODOS"
        ? matches
        : matches.filter(m => {
            const mCat = m.categoryId && tournament?.categories
                ? (tournament.categories.find(c => typeof c === 'object' && c.id === m.categoryId) as any)?.name || m.category
                : m.category;
            return mCat === selectedCategory;
        });

    const ongoingMatches = filteredMatches.filter(m => m.status === 'ongoing');
    const finishedMatches = filteredMatches.filter(m => m.status === 'finished').sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    const upcomingMatches = filteredMatches.filter(m => m.status === 'planned').sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-inter">
            {/* Premium Mobile Header */}
            <header className="relative bg-[#020617] text-white pt-10 pb-16 px-6 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />

                <div className="max-w-md mx-auto relative z-10 space-y-6">
                    {/* Top Bar with Logo & Switcher */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {arena?.logoUrl ? (
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center overflow-hidden shadow-2xl">
                                    <img src={arena.logoUrl} alt={arena.name} className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                                    <Rocket className="h-6 w-6 text-primary" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">
                                    {arena?.name || "BT Manager"}
                                </h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1 text-sm font-bold hover:text-primary transition-colors focus:outline-none">
                                            Torneios Ativos
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64 bg-[#0f172a] border-white/10 text-white p-2">
                                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-white/40 px-2 py-1">Selecione uma Etapa</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        {allTournaments.map(t => (
                                            <DropdownMenuItem
                                                key={t.id}
                                                onClick={() => navigate(`/torneio/${t.id}`)}
                                                className={`rounded-lg cursor-pointer ${t.id === id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{t.name}</span>
                                                    <span className="text-[10px] opacity-50">{t.location}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md text-[10px] font-black tracking-widest px-3">
                            PRO
                        </Badge>
                    </div>

                    <div className="space-y-1 pt-2">
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight drop-shadow-sm">
                            {tournament.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-white/50 pt-2 uppercase tracking-wide">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {new Date(tournament.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {tournament.location || arena?.location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Categories Quick Filter */}
                <div className="max-w-md mx-auto mt-6 px-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full bg-white/10 text-white border-white/10 backdrop-blur-md h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                <SelectValue placeholder="Selecione a Categoria" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-white/10 text-white">
                            <SelectItem value="TODOS" className="font-bold uppercase tracking-widest text-[10px] focus:bg-primary/20 focus:text-primary">
                                TODAS AS CATEGORIAS
                            </SelectItem>
                            {allCategories.map(cat => (
                                <SelectItem key={cat} value={cat} className="font-bold uppercase tracking-widest text-[10px] focus:bg-primary/20 focus:text-primary text-white">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 -mt-8 relative z-20">
                <Tabs defaultValue="live" className="space-y-6">
                    <TabsList className="grid grid-cols-3 w-full h-12 bg-white rounded-full shadow-lg border p-1">
                        <TabsTrigger value="live" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">AO VIVO</TabsTrigger>
                        <TabsTrigger value="groups" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">GRUPOS</TabsTrigger>
                        <TabsTrigger value="brackets" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">CHAVES</TabsTrigger>
                    </TabsList>

                    <TabsContent value="live" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* AO VIVO */}
                        <div className="space-y-4">
                            <h3 className="font-black text-slate-800 px-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                Em Andamento
                            </h3>
                            {ongoingMatches.length === 0 ? (
                                <div className="bg-white/50 border border-dashed rounded-3xl py-12 text-center">
                                    <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma partida ao vivo</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {ongoingMatches.map(match => (
                                        <PublicMatchCard key={match.id} match={match} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PRÓXIMOS */}
                        {upcomingMatches.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-400 px-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <Clock className="h-4 w-4" />
                                    Próximas Partidas
                                </h3>
                                <div className="flex flex-col gap-4">
                                    {upcomingMatches.slice(0, 10).map(match => (
                                        <PublicMatchCard key={match.id} match={match} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RECENTES / ENCERRADOS */}
                        {finishedMatches.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-400 px-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <Trophy className="h-4 w-4" />
                                    Resultados Recentes
                                </h3>
                                <div className="flex flex-col gap-4 opacity-80">
                                    {finishedMatches.slice(0, 15).map(match => (
                                        <PublicMatchCard key={match.id} match={match} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {allCategories
                            .filter(cat => selectedCategory === "TODOS" || cat === selectedCategory)
                            .map(cat => {
                                const catMatches = matches.filter(m => {
                                    const mCat = m.categoryId && tournament?.categories
                                        ? (tournament.categories.find(c => typeof c === 'object' && c.id === m.categoryId) as any)?.name || m.category
                                        : m.category;
                                    return mCat === cat && m.group;
                                });
                                if (catMatches.length === 0) return null;
                                const groups = Array.from(new Set(catMatches.map(m => m.group))).sort();

                                return (
                                    <div key={cat} className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">
                                                {cat}
                                            </Badge>
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </div>
                                        <div className="space-y-6">
                                            {groups.map(groupName => (
                                                <GroupStandings
                                                    key={`${cat}-${groupName}`}
                                                    tournamentId={id!}
                                                    category={cat}
                                                    groupName={groupName!}
                                                    matches={catMatches.filter(m => m.group === groupName)}
                                                    readOnly={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                        {!matches.some(m => m.group) && (
                            <Card className="border-dashed border-2 bg-slate-50">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    Fase de grupos ainda não iniciada.
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="brackets" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {id && (
                            <TournamentBrackets
                                tournamentId={id}
                                tournamentType={tournament.type}
                                matches={filteredMatches}
                                courts={courts}
                                onEdit={() => { }} // Read-only
                                readOnly={true}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Support Watermark */}
            <div className="py-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Powered by BT Manager
            </div>
        </div>
    );
}
