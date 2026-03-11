import { Match } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Users, Trophy, MapPin } from "lucide-react";

export interface MatchSection {
    name: string | number;
    type: 'group' | 'knockout';
    matches: (Match & { courtName?: string })[];
}

interface ArenaMatchTableProps {
    section: MatchSection;
}

export function ArenaMatchTable({ section }: ArenaMatchTableProps) {
    const getStatusStyle = (status: Match['status']) => {
        switch (status) {
            case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse';
            case 'finished': return 'bg-slate-500/10 text-slate-500 border-white/5';
            default: return 'bg-amber-500/10 text-amber-500/70 border-amber-500/20';
        }
    };

    const getStatusText = (status: Match['status']) => {
        switch (status) {
            case 'ongoing': return 'JOGANDO';
            case 'finished': return 'FINALIZADO';
            default: return 'AGUARDANDO';
        }
    };

    return (
        <div className="w-full h-fit flex-none bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            {/* Indicador de Tipo */}
            <div className="absolute top-2 right-2 opacity-[0.05]">
                {section.type === 'group' ? <Users size={40} /> : <Trophy size={40} />}
            </div>

            <div className="px-4 pt-4 pb-2 flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 rounded-md ${section.type === 'group' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'}`}>
                    {section.type === 'group' ? <Users className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-white italic">{section.name}</h3>
            </div>

            <div className="w-full px-2 md:px-3 pb-3 overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[320px] text-left border-separate border-spacing-y-1">
                    <thead className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <tr>
                            <th className="px-3 py-1">Confronto</th>
                            <th className="px-2 py-1 text-center w-16 md:w-20">Placar</th>
                            <th className="px-2 py-1 w-24 md:w-32">Fase/Qdr</th>
                            <th className="px-3 py-1 text-right w-20 md:w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.matches.map(m => (
                            <tr key={m.id} className="group transition-all duration-300">
                                {/* Atletas */}
                                <td className="bg-white/[0.03] rounded-l-md px-3 py-1.5 border-y border-l border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex flex-col gap-[2px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] md:text-sm font-black truncate max-w-[90px] md:max-w-[130px] ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white'}`}>
                                                {shortenName(m.teamA.player1.name)}
                                                {m.teamA.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamA.player2.name)}</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-[1px] w-2 md:w-3 bg-primary/30" />
                                            <span className="text-[7px] md:text-[8px] font-black text-slate-600 italic">VS</span>
                                            <div className="h-[1px] w-2 md:w-3 bg-primary/30" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[11px] md:text-sm font-black truncate max-w-[90px] md:max-w-[130px] ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white'}`}>
                                                {shortenName(m.teamB.player1.name)}
                                                {m.teamB.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamB.player2.name)}</span>}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Placar */}
                                <td className="bg-black/40 px-2 py-1.5 border-y border-white/5 group-hover:bg-black/60">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <div className="flex items-center justify-center gap-1 md:gap-1.5 font-mono text-lg md:text-xl font-black text-primary italic">
                                            <span>{m.setsA}</span>
                                            <span className="text-white/10 text-[10px] md:text-xs font-sans">x</span>
                                            <span>{m.setsB}</span>
                                        </div>
                                        {m.status === 'ongoing' && (
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                <span className={m.pointsA === '40' || m.pointsA === 'AD' ? 'text-primary' : ''}>{m.pointsA}</span>
                                                <span className="opacity-20">:</span>
                                                <span className={m.pointsB === '40' || m.pointsB === 'AD' ? 'text-primary' : ''}>{m.pointsB}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Fase / Quadra */}
                                <td className="bg-white/[0.03] px-2 py-1.5 border-y border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex flex-col gap-1 text-[9px] md:text-[10px] font-bold uppercase">
                                        <div className="flex items-center gap-1 text-primary">
                                            {m.group ? <Users className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                                            <span className="truncate max-w-[60px] md:max-w-[80px]">{m.group ? `Grp ${m.group}` : m.round}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate max-w-[60px] md:max-w-[80px]">{m.courtName || 'A DEFINIR'}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="bg-white/[0.03] rounded-r-md px-2 md:px-3 py-1.5 border-y border-r border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex justify-end">
                                        <span className={`px-2 py-1 md:px-2.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black border tracking-wider ${getStatusStyle(m.status)}`}>
                                            {getStatusText(m.status)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
