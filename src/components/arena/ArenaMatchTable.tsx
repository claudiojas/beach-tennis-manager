import { Match } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Badge } from "@/components/ui/badge";
import { MapPin, PlayCircle, CheckCircle2, Clock } from "lucide-react";

interface ArenaMatchTableProps {
    title: string;
    subtitle?: string;
    matches: Match[];
}

export function ArenaMatchTable({ title, subtitle, matches }: ArenaMatchTableProps) {
    if (matches.length === 0) return null;

    const getStatusLabel = (status: Match['status']) => {
        switch (status) {
            case 'ongoing': return { text: 'Jogando', color: 'text-green-500 animate-pulse', icon: PlayCircle };
            case 'finished': return { text: 'Finalizado', color: 'text-slate-500', icon: CheckCircle2 };
            default: return { text: 'Aguardando', color: 'text-yellow-500/70', icon: Clock };
        }
    };

    return (
        <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="bg-white/5 p-6 border-b border-white/5">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/20 text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <th className="py-4 px-6">Confronto</th>
                            <th className="py-4 px-4 text-center">Sets</th>
                            <th className="py-4 px-4">Quadra</th>
                            <th className="py-4 px-6 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {matches.map((match) => {
                            const status = getStatusLabel(match.status);
                            const StatusIcon = status.icon;

                            return (
                                <tr key={match.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col text-right min-w-[100px]">
                                                <span className="text-xs font-black text-white uppercase truncate">
                                                    {shortenName(match.teamA.player1.name)}
                                                </span>
                                                {match.teamA.player2 && (
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase truncate">
                                                        {shortenName(match.teamA.player2.name)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-primary italic">X</span>
                                            <div className="flex flex-col text-left min-w-[100px]">
                                                <span className="text-xs font-black text-white uppercase truncate">
                                                    {shortenName(match.teamB.player1.name)}
                                                </span>
                                                {match.teamB.player2 && (
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase truncate">
                                                        {shortenName(match.teamB.player2.name)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                            <span className={`text-lg font-black tabular-nums ${match.status === 'finished' && match.setsA > match.setsB ? 'text-primary' : 'text-white'}`}>
                                                {match.setsA}
                                            </span>
                                            <span className="text-slate-700 text-xs">-</span>
                                            <span className={`text-lg font-black tabular-nums ${match.status === 'finished' && match.setsB > match.setsA ? 'text-primary' : 'text-white'}`}>
                                                {match.setsB}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <MapPin className="w-3 h-3 text-primary opacity-50" />
                                            <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">
                                                {match.courtName || 'Arena'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className={`flex items-center justify-end gap-2 ${status.color}`}>
                                            <span className="text-[9px] font-black uppercase tracking-wider">
                                                {status.text}
                                            </span>
                                            <StatusIcon className="w-3 h-3" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
