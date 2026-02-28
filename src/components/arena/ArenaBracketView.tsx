import { Match, Category } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Badge } from "@/components/ui/badge";
import { Trophy, GitBranch } from "lucide-react";

interface ArenaBracketViewProps {
    category: string;
    matches: Match[];
}

export function ArenaBracketView({ category, matches }: ArenaBracketViewProps) {
    const rounds: Match['round'][] = ['quartas', 'semi', 'final'];
    const bracketMatches = matches.filter(m => m.round && rounds.includes(m.round));

    if (bracketMatches.length === 0) return null;

    const renderArenaRound = (roundName: Match['round'], title: string) => {
        const roundMatches = bracketMatches
            .filter(m => m.round === roundName)
            .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));

        if (roundMatches.length === 0) return null;

        return (
            <div className="flex flex-col gap-12 items-center flex-1 min-w-[300px]">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-4 px-6 py-2 bg-white/5 rounded-full border border-white/5">
                    {title}
                </h3>
                <div className="flex flex-col justify-around h-full w-full gap-8">
                    {roundMatches.map(match => (
                        <div key={match.id} className="relative group">
                            <div className={`
                                bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border-2 transition-all duration-500 shadow-xl
                                ${match.status === 'ongoing' ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-white/10 group-hover:border-white/20'}
                            `}>
                                <div className="space-y-3">
                                    {/* Team A */}
                                    <div className={`flex justify-between items-center p-3 rounded-xl transition-colors ${match.status === 'finished' && match.setsA > match.setsB ? 'bg-primary/20 border border-primary/20' : 'bg-black/20'}`}>
                                        <div className="flex flex-col truncate pr-4">
                                            <span className="text-lg font-black text-white uppercase tracking-tighter truncate">
                                                {shortenName(match.teamA.player1.name)}
                                            </span>
                                            {match.teamA.player2 && (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase -mt-1 truncate">
                                                    {shortenName(match.teamA.player2.name)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-black px-3 py-1 rounded-lg ${match.status === 'finished' && match.setsA > match.setsB ? 'text-primary' : 'text-slate-500'}`}>
                                            {match.setsA}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">VS</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>

                                    {/* Team B */}
                                    <div className={`flex justify-between items-center p-3 rounded-xl transition-colors ${match.status === 'finished' && match.setsB > match.setsA ? 'bg-primary/20 border border-primary/20' : 'bg-black/20'}`}>
                                        <div className="flex flex-col truncate pr-4">
                                            <span className="text-lg font-black text-white uppercase tracking-tighter truncate">
                                                {shortenName(match.teamB.player1.name)}
                                            </span>
                                            {match.teamB.player2 && (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase -mt-1 truncate">
                                                    {shortenName(match.teamB.player2.name)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-black px-3 py-1 rounded-lg ${match.status === 'finished' && match.setsB > match.setsA ? 'text-primary' : 'text-slate-500'}`}>
                                            {match.setsB}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Connection Line to next match id (only visual) */}
                            {match.nextMatchId && (
                                <div className="absolute top-1/2 -right-12 w-12 h-px bg-white/10 hidden lg:block" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[95vw] bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 shadow-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 p-12 opacity-[0.03]">
                <GitBranch className="w-96 h-96 -ml-32 -mt-32" />
            </div>

            <div className="flex flex-col items-center mb-16 relative z-10">
                <Badge className="bg-primary text-black font-black italic px-6 py-1.5 text-base tracking-[0.4em] uppercase mb-4">
                    {category}
                </Badge>
                <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                    Chave <span className="text-primary italic">Mata-Mata</span>
                </h2>
                <div className="w-24 h-1 bg-primary mt-6 rounded-full shadow-[0_0_20px_#A3E635]" />
            </div>

            <div className="flex flex-row gap-12 justify-center items-stretch relative z-10 h-[60vh]">
                {renderArenaRound('quartas', 'Quartas de Final')}
                {renderArenaRound('semi', 'Semifinais')}
                {renderArenaRound('final', 'Grande Final')}

                {/* Winner Display */}
                {bracketMatches.find(m => m.round === 'final' && m.status === 'finished') && (
                    <div className="flex flex-col items-center justify-center min-w-[300px] animate-in fade-in zoom-in duration-1000">
                        <div className="relative mb-8">
                            <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />
                            <Trophy className="h-32 w-32 text-yellow-500 relative z-10 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
                        </div>
                        <h3 className="text-lg font-black uppercase text-yellow-500 tracking-[0.5em] mb-4">Campeão Especial</h3>
                        <div className="text-center bg-yellow-500 text-black px-10 py-6 rounded-[2rem] shadow-2xl skew-x-[-12deg]">
                            <p className="font-black text-4xl uppercase tracking-tighter drop-shadow-sm">
                                {(() => {
                                    const final = bracketMatches.find(m => m.round === 'final' && m.status === 'finished');
                                    const winner = final!.setsA > final!.setsB ? final!.teamA : final!.teamB;
                                    return winner.player1.name;
                                })()}
                            </p>
                            {(() => {
                                const final = bracketMatches.find(m => m.round === 'final' && m.status === 'finished');
                                const winner = final!.setsA > final!.setsB ? final!.teamA : final!.teamB;
                                return winner.player2 && <p className="text-lg font-black uppercase mt-1 opacity-80">{winner.player2.name}</p>;
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
