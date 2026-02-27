import { useState, useEffect } from "react";
import { Match, Court, Team, Category, Player } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { bracketService } from "@/services/bracketService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Plus, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { athleteService } from "@/services/athleteService";

interface TournamentBracketsProps {
    tournamentId: string;
    tournamentType: 'Simples' | 'Duplas';
    matches: Match[];
}

export function TournamentBrackets({ tournamentId, tournamentType, matches }: TournamentBracketsProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [bracketMatches, setBracketMatches] = useState<Match[]>([]);

    useEffect(() => {
        // Filter only matches that belong to a bracket (have a round defined)
        const filtered = matches.filter(m => m.round);
        setBracketMatches(filtered);
    }, [matches]);

    const handleGenerate = async (count: 4 | 8) => {
        setIsGenerating(true);
        try {
            const athletes: Player[] = await new Promise((resolve) => {
                const unsubscribe = athleteService.subscribe((data) => {
                    resolve(data);
                    unsubscribe();
                });
            });

            if (athletes.length < count * (tournamentType === 'Simples' ? 1 : 2)) {
                toast.error(`Atletas insuficientes para uma chave de ${count} ${tournamentType === 'Simples' ? 'jogadores' : 'duplas'}.`);
                return;
            }

            const shuffled = [...athletes].sort(() => Math.random() - 0.5);
            const teams: Team[] = [];

            if (tournamentType === 'Simples') {
                for (let i = 0; i < count; i++) {
                    teams.push({ player1: shuffled[i] });
                }
            } else {
                for (let i = 0; i < count * 2; i += 2) {
                    teams.push({ player1: shuffled[i], player2: shuffled[i + 1] });
                }
            }

            await bracketService.generateBracket(tournamentId, 'Pro', teams);
            toast.success(`Chave de ${count} gerada com sucesso!`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar chaves.");
        } finally {
            setIsGenerating(false);
        }
    };

    const renderRound = (roundName: Match['round'], title: string) => {
        const roundMatches = bracketMatches.filter(m => m.round === roundName).sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));

        if (roundMatches.length === 0) return null;

        return (
            <div className="flex flex-col gap-8 items-center min-w-[250px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{title}</h3>
                {roundMatches.map(match => (
                    <div key={match.id} className="relative w-full">
                        <Card className={`border-2 transition-all ${match.status === 'ongoing' ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
                            <CardContent className="p-3 space-y-2">
                                <div className={`flex justify-between items-center text-xs p-2 rounded ${match.setsA > match.setsB && match.status === 'finished' ? 'bg-primary/20 font-bold' : ''}`}>
                                    <span className="truncate">{shortenName(match.teamA.player1.name)} {match.teamA.player2 && `/ ${shortenName(match.teamA.player2.name)}`}</span>
                                    <span>{match.setsA}</span>
                                </div>
                                <div className="h-px bg-border my-1" />
                                <div className={`flex justify-between items-center text-xs p-2 rounded ${match.setsB > match.setsA && match.status === 'finished' ? 'bg-primary/20 font-bold' : ''}`}>
                                    <span className="truncate">{shortenName(match.teamB.player1.name)} {match.teamB.player2 && `/ ${shortenName(match.teamB.player2.name)}`}</span>
                                    <span>{match.setsB}</span>
                                </div>
                            </CardContent>
                        </Card>
                        {match.nextMatchId && (
                            <div className="hidden md:block absolute -right-4 top-1/2 w-4 h-px bg-border" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (bracketMatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium mb-4">Nenhuma chave gerada para este torneio.</p>
                <div className="flex gap-4">
                    <Button onClick={() => handleGenerate(4)} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Gerar Semi (4 {tournamentType === 'Simples' ? 'Atletas' : 'Duplas'})
                    </Button>
                    <Button onClick={() => handleGenerate(8)} disabled={isGenerating} variant="outline">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Gerar Quartas (8 {tournamentType === 'Simples' ? 'Atletas' : 'Duplas'})
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 w-full">
            <div className="flex flex-col md:flex-row gap-12 items-center md:items-start justify-center py-8">
                {renderRound('oitavas', 'Oitavas de Final')}
                {renderRound('quartas', 'Quartas de Final')}
                {renderRound('semi', 'Semifinais')}
                {renderRound('final', 'Grande Final')}

                {/* Winner Display */}
                {bracketMatches.find(m => m.round === 'final' && m.status === 'finished') && (
                    <div className="flex flex-col items-center justify-center min-w-[200px] animate-in fade-in zoom-in duration-500 pb-8 md:pb-0">
                        <Trophy className="h-16 w-16 text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        <h3 className="text-sm font-black uppercase text-yellow-500 tracking-widest">Campeão</h3>
                        <div className="mt-4 text-center">
                            <p className="font-black text-2xl uppercase tracking-tighter text-primary">
                                {(() => {
                                    const final = bracketMatches.find(m => m.round === 'final');
                                    const winner = final!.setsA > final!.setsB ? final!.teamA : final!.teamB;
                                    return winner.player1.name;
                                })()}
                            </p>
                            {(() => {
                                const final = bracketMatches.find(m => m.round === 'final');
                                const winner = final!.setsA > final!.setsB ? final!.teamA : final!.teamB;
                                return winner.player2 && <p className="text-sm font-bold text-muted-foreground uppercase mt-1 tracking-tight">{winner.player2.name}</p>;
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
