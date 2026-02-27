import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Undo2, RotateCcw, CheckCircle2, BookOpen, Play, Clock, Calendar, ShieldCheck, Activity, MapPin } from "lucide-react";
import { courtService } from "@/services/courtService";
import { matchService } from "@/services/matchService";
import { tournamentService } from "@/services/tournamentService";
import { Court, Match, TournamentSettings } from "@/types/beach-tennis";
import { useMatchScore } from "@/hooks/useMatchScore";
import { toast } from "sonner";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Simple helper for device ID to lock control
const getDeviceId = () => {
    let id = localStorage.getItem("bt-manager-device-id");
    if (!id) {
        id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("bt-manager-device-id", id);
    }
    return id;
};

export default function RefereeDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tournamentId = searchParams.get("tournamentId");

    const [plannedMatches, setPlannedMatches] = useState<Match[]>([]);
    const [ongoingMatches, setOngoingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<any>(null);
    const [courts, setCourts] = useState<Court[]>([]);

    // Active Match State
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);

    const deviceId = getDeviceId();

    useEffect(() => {
        if (!tournamentId) {
            navigate("/arbitro");
            return;
        }

        const unsubTourney = tournamentService.subscribe((tournaments) => {
            const current = tournaments.find(t => t.id === tournamentId);
            if (current) setTournament(current);
        });

        const unsubCourts = courtService.subscribeByTournament(tournamentId, setCourts);

        const unsubMatches = matchService.subscribeByTournament(tournamentId, (matches) => {
            // Filter matches for selection
            setPlannedMatches(matches.filter(m => m.status === 'planned'));
            setOngoingMatches(matches.filter(m => m.status === 'ongoing'));

            // Check if there's an active match assigned to THIS device
            const myActive = matches.find(m => m.status === 'ongoing' && (m as any).controlledBy === deviceId);
            setActiveMatch(myActive || null);

            setLoading(false);
        });

        return () => {
            unsubTourney();
            unsubCourts();
            unsubMatches();
        };
    }, [tournamentId, navigate, deviceId]);

    const handleLogout = () => {
        localStorage.removeItem("beach-tennis-referee-session");
        navigate("/arbitro");
    };


    const handleSelectMatch = async (match: Match) => {
        if (!match.courtId) {
            toast.error("Esta partida não tem uma quadra definida pelo administrador.");
            return;
        }

        const court = courts.find(c => c.id === match.courtId);
        if (!court) {
            toast.error("Quadra não encontrada.");
            return;
        }

        if (court.status === 'em_jogo') {
            toast.error(`A ${court.name} já está ocupada com outro jogo!`);
            return;
        }

        try {
            // Lock the match to this device
            await matchService.update(match.id, {
                controlledBy: deviceId
            } as any);

            await matchService.startMatch(match, court.id);

            toast.success(`Partida iniciada na ${court.name}!`);
        } catch (error) {
            toast.error("Erro ao iniciar partida.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Activity className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    if (activeMatch) {
        // Find the court object for the active match
        const activeCourt = courts.find(c => c.id === activeMatch.courtId);
        return (
            <ActiveMatchView
                match={activeMatch}
                courtId={activeMatch.courtId!}
                courtName={activeCourt?.name || "Quadra"}
                settings={tournament?.settings}
                onFinish={() => setActiveMatch(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 font-inter">
            <header className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Arbitragem</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary py-0 px-2 h-5">
                            {tournament?.name}
                        </Badge>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-white bg-slate-900">
                    <LogOut className="w-5 h-5" />
                </Button>
            </header>

            <div className="space-y-8 max-w-lg mx-auto">
                {/* Section: Em Jogo (LOCKED BY OTHERS) */}
                {ongoingMatches.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Activity className="w-4 h-4 text-red-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Jogos em Andamento</h2>
                        </div>
                        <div className="grid gap-3">
                            {ongoingMatches.map(m => (
                                <div key={m.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 opacity-60">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="text-[8px] uppercase">{m.category}</Badge>
                                        <span className="text-[9px] font-bold text-red-500/80 uppercase">Bloqueado</span>
                                    </div>
                                    <p className="text-xs font-bold text-center uppercase tracking-tight">
                                        {m.teamA.player1.name} VS {m.teamB.player1.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section: Disponíveis */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-200">Selecione uma Partida</h2>
                    </div>

                    {plannedMatches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-center">
                            <p className="text-slate-500 font-bold mb-1">Nenhum jogo planejado no momento.</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Fique atento aos novos agendamentos</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {plannedMatches.map((match) => {
                                const matchCourt = courts.find(c => c.id === match.courtId);
                                return (
                                    <button
                                        key={match.id}
                                        onClick={() => handleSelectMatch(match)}
                                        className="w-full text-left bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-2xl hover:border-primary/50 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex gap-2">
                                                <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-tighter">
                                                    Cat. {match.category}
                                                </Badge>
                                                {matchCourt && (
                                                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary/80 uppercase">
                                                        <MapPin className="w-2.5 h-2.5 mr-1" /> {matchCourt.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Iniciar Partida</span>
                                        </div>

                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-1 text-center bg-white/5 rounded-xl py-3 border border-white/5">
                                                <p className="text-sm font-black uppercase leading-tight">{match.teamA.player1.name}</p>
                                                {match.teamA.player2 && <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{match.teamA.player2.name}</p>}
                                            </div>
                                            <div className="text-slate-700 font-black text-[10px] italic">VS</div>
                                            <div className="flex-1 text-center bg-white/5 rounded-xl py-3 border border-white/5">
                                                <p className="text-sm font-black uppercase leading-tight">{match.teamB.player1.name}</p>
                                                {match.teamB.player2 && <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{match.teamB.player2.name}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-primary/80 pt-2 border-t border-white/5">
                                            <Play className="w-3 h-3 fill-current" />
                                            Confirmar Entrada
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Authority Mode · Modulo Web BT</p>
            </footer>
        </div>
    );
}

function ActiveMatchView({ match: initialMatch, courtId, courtName, settings, onFinish }: { match: Match, courtId: string, courtName: string, settings?: TournamentSettings, onFinish: () => void }) {
    const { match, addPoint, toggleServing, undo, canUndo } = useMatchScore(initialMatch.id, initialMatch, settings);
    const [notes, setNotes] = useState(match.notes || "");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);

    // Live Timer State
    const [elapsedTime, setElapsedTime] = useState("00:00");

    useEffect(() => {
        if (match.status !== 'ongoing' || !match.actualStartTime) return;

        const timer = setInterval(() => {
            const diff = Date.now() - match.actualStartTime!;
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [match.status, match.actualStartTime]);

    // Debounced Note update
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (notes !== (match.notes || "")) {
                setIsSavingNotes(true);
                try {
                    await matchService.update(match.id, { notes });
                } catch (e) {
                    toast.error("Erro ao salvar súmula");
                } finally {
                    setIsSavingNotes(false);
                }
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [notes, match.id, match.notes]);

    const handleFinishMatch = async () => {
        try {
            await matchService.update(match.id, {
                status: 'finished',
                endTime: Date.now(),
                notes
            });
            await courtService.finishMatch(courtId);
            toast.success("Partida concluída com sucesso!");
            onFinish();
        } catch (error) {
            toast.error("Erro ao encerrar partida.");
        }
    };

    const getTeamNames = (team: any) => {
        return team.player2 ? `${team.player1.name} / ${team.player2.name}` : team.player1.name;
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-inter select-none">
            {/* Minimal Header */}
            <header className="px-6 py-4 flex justify-between items-center bg-slate-950 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">{courtName}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            <Clock className="w-2 h-2" /> {elapsedTime}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" disabled={!canUndo} onClick={undo} className="text-slate-400 bg-white/5 border border-white/10 h-10 px-4 rounded-xl active:bg-white/10">
                        <Undo2 className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Scoreboard Info - Total Sets */}
            <div className="bg-slate-900/40 py-4 border-b border-white/5 grid grid-cols-2 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-[10px] font-black text-slate-700 uppercase z-10">Sets</div>
                <div className="flex flex-col border-r border-white/5">
                    <span className="text-4xl font-black text-red-500 tracking-tighter">{match.setsA}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-4xl font-black text-blue-500 tracking-tighter">{match.setsB}</span>
                </div>
            </div>

            {/* Play Zone */}
            <div className="flex-1 flex flex-col">
                <button
                    onClick={() => addPoint('teamA')}
                    className={`flex-1 flex flex-col items-center justify-center transition-all relative ${match.serving === 'teamA' ? 'bg-red-500/10' : 'bg-red-500/5'
                        } active:scale-[0.98] border-b border-white/5 overflow-hidden`}
                >
                    {match.serving === 'teamA' && <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-bl-xl tracking-widest">SACANDO</div>}
                    <span className="text-9xl font-black text-red-500 font-mono leading-none drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        {match.pointsA}
                    </span>
                    <span className="mt-4 text-xs font-black text-white uppercase tracking-tight px-6 text-center line-clamp-1">
                        {getTeamNames(match.teamA)}
                    </span>
                </button>

                <div className="h-16 bg-slate-900 flex items-center justify-between px-6 border-y border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Categoria</span>
                        <span className="text-xs font-black text-primary italic">{match.category}</span>
                    </div>
                    <Button onClick={toggleServing} variant="outline" className="h-11 px-6 rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase gap-2 hover:bg-white/10 active:bg-primary active:text-black">
                        <RotateCcw className="w-4 h-4" /> Trocar Saque
                    </Button>
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Placar</span>
                        <span className="text-xs font-black text-white">{match.pointsA} - {match.pointsB}</span>
                    </div>
                </div>

                <button
                    onClick={() => addPoint('teamB')}
                    className={`flex-1 flex flex-col items-center justify-center transition-all relative ${match.serving === 'teamB' ? 'bg-blue-500/10' : 'bg-blue-500/5'
                        } active:scale-[0.98] overflow-hidden`}
                >
                    {match.serving === 'teamB' && <div className="absolute top-0 left-0 px-3 py-1 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-br-xl tracking-widest">SACANDO</div>}
                    <span className="text-9xl font-black text-blue-500 font-mono leading-none drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        {match.pointsB}
                    </span>
                    <span className="mt-4 text-xs font-black text-white uppercase tracking-tight px-6 text-center line-clamp-1">
                        {getTeamNames(match.teamB)}
                    </span>
                </button>
            </div>

            {/* Sumula Field */}
            <div className="p-4 bg-slate-950 border-t border-white/10 space-y-4">
                <Button
                    onClick={() => setFinishDialogOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest rounded-2xl h-14 gap-2 shadow-xl shadow-green-900/20"
                >
                    <CheckCircle2 className="w-5 h-5 shadow-inner" />
                    Finalizar Partida
                </Button>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-slate-500">
                            <BookOpen className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Súmula Digital</span>
                        </div>
                        {isSavingNotes && <span className="text-[7px] font-black text-primary animate-pulse italic">SYNC...</span>}
                    </div>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observações da partida..."
                        className="bg-slate-900/50 border-slate-800 text-[10px] text-slate-400 resize-none h-16 rounded-xl focus:ring-primary/20"
                    />
                </div>
            </div>

            <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
                <AlertDialogContent className="bg-slate-950 border-slate-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Encerrar Partida?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Ao confirmar, o resultado será enviado para a tabela oficial e a quadra ficará disponível para o próximo jogo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800 rounded-xl font-bold uppercase text-[10px]">Revisar Placar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinishMatch} className="bg-green-600 text-white hover:bg-green-700 rounded-xl font-black uppercase text-[10px]">Sim, Finalizar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
