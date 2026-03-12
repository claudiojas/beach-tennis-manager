import { Match } from '@/types/beach-tennis';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PublicMatchCardProps {
    match: Match;
}

export const PublicMatchCard = ({ match }: PublicMatchCardProps) => {
    const [elapsed, setElapsed] = useState("00:00");

    useEffect(() => {
        if (match.status !== 'ongoing' || !match.actualStartTime) return;
        const interval = setInterval(() => {
            const diff = Date.now() - match.actualStartTime!;
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [match.status, match.actualStartTime]);


    const isWinner = (team: 'A' | 'B') => {
        if (match.status !== 'finished') return false;
        return team === 'A' ? match.setsA > match.setsB : match.setsB > match.setsA;
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${match.status === 'ongoing'
            ? 'bg-white border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-primary/10'
            : 'bg-white border-slate-100 shadow-sm'
            }`}>
            {/* Status Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-2 h-5 bg-slate-50 border-slate-200">
                        {match.category}
                    </Badge>
                    {match.round && (
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-2 h-5 bg-primary/5 text-primary border-primary/10">
                            {match.round}
                        </Badge>
                    )}
                </div>

                {match.status === 'ongoing' ? (
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Live</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{elapsed}</span>
                    </div>
                ) : match.status === 'finished' ? (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encerrado</span>
                ) : (
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agendado</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-5">
                {/* Teams Grid */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-[11px] font-black uppercase tracking-tighter leading-tight max-w-[110px]">
                            {match.teamA.player1.name}
                        </p>
                        {match.teamA.player2 && (
                            <>
                                <span className="text-[8px] font-black text-slate-300 leading-none">&</span>
                                <p className="text-[11px] font-black uppercase tracking-tighter leading-tight max-w-[110px]">
                                    {match.teamA.player2.name}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Score / VS Overlay */}
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                        {match.status === 'ongoing' || match.status === 'finished' ? (
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black tabular-nums ${isWinner('A') ? 'text-primary' : 'text-slate-900'}`}>{match.setsA}</span>
                                <span className="text-slate-200 font-light">:</span>
                                <span className={`text-2xl font-black tabular-nums ${isWinner('B') ? 'text-primary' : 'text-slate-900'}`}>{match.setsB}</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">VS</span>
                        )}

                        {match.status === 'ongoing' && match.serving && (
                            <div className={`mt-1 h-1 w-4 rounded-full bg-yellow-400 animate-pulse ${match.serving === 'teamA' ? '-translate-x-4' : 'translate-x-4'}`} />
                        )}
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-[11px] font-black uppercase tracking-tighter leading-tight max-w-[110px]">
                            {match.teamB.player1.name}
                        </p>
                        {match.teamB.player2 && (
                            <>
                                <span className="text-[8px] font-black text-slate-300 leading-none">&</span>
                                <p className="text-[11px] font-black uppercase tracking-tighter leading-tight max-w-[110px]">
                                    {match.teamB.player2.name}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Real-time points (only for ongoing) */}
                {match.status === 'ongoing' && (
                    <div className="bg-slate-50/50 rounded-2xl p-3 flex justify-between items-center border border-slate-100/50">
                        <span className="text-xl font-black text-primary tabular-nums">{match.pointsA}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pontos</span>
                        <span className="text-xl font-black text-primary tabular-nums">{match.pointsB}</span>
                    </div>
                )}

                {/* History Sets */}
                {match.historySets && match.historySets.length > 0 && (
                    <div className="flex justify-center gap-1.5 pt-1">
                        {match.historySets.map((s, i) => (
                            <div key={i} className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md border border-slate-100">
                                {s.scoreA}-{s.scoreB}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* WINNER BADGE */}
            {match.status === 'finished' && (
                <div className={`absolute top-0 ${isWinner('A') ? 'left-0' : 'right-0'} p-2`}>
                    <div className="bg-yellow-400/10 p-1.5 rounded-xl border border-yellow-400/20">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                    </div>
                </div>
            )}
        </div>
    );
};
