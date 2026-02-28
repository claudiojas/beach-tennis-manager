import { Match } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, PlayCircle } from "lucide-react";

interface ArenaMatchTickerProps {
    matches: Match[];
}

export function ArenaMatchTicker({ matches }: ArenaMatchTickerProps) {
    if (matches.length === 0) return null;

    // Filter and sort matches to show a logical sequence: Ongoing -> Planned -> Finished (recent)
    const sortedMatches = [...matches].sort((a, b) => {
        const order = { ongoing: 0, planned: 1, finished: 2 };
        if (order[a.status] !== order[b.status]) {
            return order[a.status] - order[b.status];
        }
        return 0; // Keep relative order
    });

    const MatchCard = ({ match }: { match: Match }) => {
        const isOngoing = match.status === 'ongoing';
        const isFinished = match.status === 'finished';

        return (
            <div className={`
                flex-shrink-0 w-[350px] bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border-2 transition-all duration-500
                ${isOngoing ? 'border-primary ring-4 ring-primary/10 shadow-[0_0_30px_rgba(163,230,53,0.15)]' : 'border-white/5 shadow-xl'}
            `}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase px-2 py-0.5">
                            Cat. {match.category}
                        </Badge>
                        {match.group && (
                            <Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5 border-white/10 text-slate-400">
                                Grupo {match.group}
                            </Badge>
                        )}
                        {match.round && !match.group && (
                            <Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5 border-primary/30 text-primary italic">
                                {match.round}
                            </Badge>
                        )}
                    </div>
                    {isOngoing ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                            <PlayCircle className="w-3 h-3 text-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live</span>
                        </div>
                    ) : isFinished ? (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                    ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                </div>

                <div className="space-y-4">
                    {/* Team A */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col truncate pr-4">
                            <span className={`text-lg font-black uppercase tracking-tight truncate ${isFinished && match.setsA > match.setsB ? 'text-white' : 'text-slate-400'}`}>
                                {shortenName(match.teamA.player1.name)}
                            </span>
                            {match.teamA.player2 && (
                                <span className="text-[10px] font-bold text-slate-600 uppercase -mt-1 truncate">
                                    {shortenName(match.teamA.player2.name)}
                                </span>
                            )}
                        </div>
                        <div className={`text-3xl font-black tabular-nums transition-colors ${isFinished && match.setsA > match.setsB ? 'text-primary' : isOngoing ? 'text-white' : 'text-slate-700'}`}>
                            {match.setsA}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full relative">
                        <div className="absolute left-1/2 -top-1 px-2 bg-slate-900 text-[8px] font-black text-slate-700 uppercase tracking-widest -translate-x-1/2">vs</div>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col truncate pr-4 text-left">
                            <span className={`text-lg font-black uppercase tracking-tight truncate ${isFinished && match.setsB > match.setsA ? 'text-white' : 'text-slate-400'}`}>
                                {shortenName(match.teamB.player1.name)}
                            </span>
                            {match.teamB.player2 && (
                                <span className="text-[10px] font-bold text-slate-600 uppercase -mt-1 truncate">
                                    {shortenName(match.teamB.player2.name)}
                                </span>
                            )}
                        </div>
                        <div className={`text-3xl font-black tabular-nums transition-colors ${isFinished && match.setsB > match.setsA ? 'text-primary' : isOngoing ? 'text-white' : 'text-slate-700'}`}>
                            {match.setsB}
                        </div>
                    </div>
                </div>

                {isFinished && match.historySets && match.historySets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 justify-center">
                        {match.historySets.map((s, i) => (
                            <span key={i} className="text-[9px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded text-slate-500 border border-white/5">
                                {s.scoreA}-{s.scoreB}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full relative py-12">
            <div className="flex flex-col items-center mb-12">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                    Mural de <span className="text-primary">Confrontos</span>
                </h2>
                <div className="w-16 h-1 bg-primary/30 mt-4 rounded-full" />
            </div>

            <div className="overflow-hidden mask-fade-x">
                <div className="ticker-animation-slow flex items-center gap-8 py-8 px-4 w-max">
                    {/* Double the matches for infinite scroll effect */}
                    {sortedMatches.map((m, i) => (
                        <MatchCard key={`m1-${m.id}-${i}`} match={m} />
                    ))}
                    {sortedMatches.map((m, i) => (
                        <MatchCard key={`m2-${m.id}-${i}`} match={m} />
                    ))}
                </div>
            </div>
        </div>
    );
}
