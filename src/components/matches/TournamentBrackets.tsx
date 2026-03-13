import { useState, useEffect } from "react";
import { Match, Court, Team, Player } from "@/types/beach-tennis";
import { bracketService } from "@/services/bracketService";
import { Button } from "@/components/ui/button";
import { GitBranch, Plus, Loader2, Trophy, Swords } from "lucide-react";
import { toast } from "sonner";
import { athleteService } from "@/services/athleteService";
import { MatchList } from "./MatchList";

interface TournamentBracketsProps {
    tournamentId: string;
    tournamentType: 'Simples' | 'Duplas';
    matches: Match[];
    courts: Court[];
    onEdit: (match: Match) => void;
    activeCategory?: string;
    readOnly?: boolean;
    onGenerateEliminatories?: () => Promise<void>;
    isGroupStageFinished?: boolean;
}

export function TournamentBrackets({ tournamentId, tournamentType, matches, courts, onEdit, activeCategory, readOnly, onGenerateEliminatories, isGroupStageFinished }: TournamentBracketsProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [bracketMatches, setBracketMatches] = useState<Match[]>([]);

    // Resolve display name for the category
    const categoryDisplayName = bracketMatches.length > 0 && bracketMatches[0].category
        ? bracketMatches[0].category
        : activeCategory;

    useEffect(() => {
        // Filtra apenas partidas que pertencem ao mata-mata (possuem round definido)
        const filtered = matches.filter(m => m.round && m.round !== 'Grupos');
        setBracketMatches(filtered);
    }, [matches]);

    const handleGenerate = async () => {
        if (onGenerateEliminatories) {
            setIsGenerating(true);
            try {
                await onGenerateEliminatories();
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const rounds = [
        { id: 'oitavas', label: 'Oitavas de Final' },
        { id: 'quartas', label: 'Quartas de Final' },
        { id: 'semi', label: 'Semifinais' },
        { id: 'final', label: 'Grande Final' },
    ];

    if (bracketMatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20 px-6 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium mb-1">Crie as eliminatórias para {categoryDisplayName}.</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest mb-6">
                    {isGroupStageFinished
                        ? "A fase de grupos terminou. Você já pode gerar a chave final."
                        : "Aguardando a finalização de todos os jogos da fase de grupos."}
                </p>
                {!readOnly && (
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !isGroupStageFinished}
                        className="rounded-full px-8 shadow-lg shadow-primary/20"
                    >
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}
                        Gerar Eliminatórias
                    </Button>
                )}
            </div>
        );
    }

    const finalMatch = bracketMatches.find(m => m.round === 'final');
    const winner = finalMatch?.status === 'finished'
        ? (finalMatch.setsA > finalMatch.setsB ? finalMatch.teamA : finalMatch.teamB)
        : null;

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Campeão em destaque se o torneio acabou */}
            {winner && (
                <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background p-8 rounded-2xl border-2 border-yellow-200 dark:border-yellow-900/50 text-center shadow-xl">
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-bounce" />
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-yellow-600 mb-2">Grande Campeão</h2>
                    <p className="text-3xl font-black text-primary uppercase">{winner.player1.name}</p>
                    {winner.player2 && <p className="text-lg font-bold text-muted-foreground uppercase">{winner.player2.name}</p>}
                </div>
            )}

            {/* Lista de Rodadas */}
            <div className="space-y-10">
                {rounds.map(round => {
                    const roundMatches = bracketMatches
                        .filter(m => m.round === round.id)
                        .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));

                    if (roundMatches.length === 0) return null;

                    return (
                        <div key={round.id} className="space-y-4">
                            <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Swords className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-black text-xl uppercase tracking-tight">{round.label}</h3>
                                <div className="ml-auto">
                                    <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                        {roundMatches.length} {roundMatches.length === 1 ? 'JOGO' : 'JOGOS'}
                                    </span>
                                </div>
                            </div>

                            <MatchList
                                tournamentId={tournamentId}
                                courts={courts}
                                matches={roundMatches}
                                onEdit={onEdit}
                                showDescriptions={true}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
