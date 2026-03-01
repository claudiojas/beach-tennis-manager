import { Match } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Users, Trophy, MapPin } from "lucide-react";

interface ArenaMatchTableProps {
    section: {
        name: string;
        type: 'group' | 'knockout';
        matches: Match[];
    };
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
        <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl relative mb-8">
            {/* Indicador de Tipo */}
            <div className="absolute top-6 right-6 opacity-10">
                {section.type === 'group' ? <Users size={80} /> : <Trophy size={80} />}
            </div>

            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2 flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 rounded-xl ${section.type === 'group' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'}`}>
                    {section.type === 'group' ? <Users className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <Trophy className="w-4 h-4 md:w-[18px] md:h-[18px]" />}
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white italic">{section.name}</h3>
            </div>

            <div className="w-full px-2 md:px-4 pb-4 overflow-x-auto scrollbar-none">
                <table className="w-full min-w-[400px] md:min-w-full text-left border-separate border-spacing-y-1.5">
                    <thead className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <tr>
                            <th className="px-3 md:px-4 py-1">Confronto</th>
                            <th className="px-2 py-1 text-center w-16 md:w-24">Placar</th>
                            <th className="px-2 py-1 w-28 md:w-40">Fase / Quadra</th>
                            <th className="px-3 md:px-4 py-1 text-right w-24 md:w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.matches.map(m => (
                            <tr key={m.id} className="group transition-all duration-300">
                                {/* Atletas */}
                                <td className="bg-white/[0.03] rounded-l-xl px-3 md:px-4 py-2 border-y border-l border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm md:text-base font-black truncate max-w-[120px] md:max-w-[200px] ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white'}`}>
                                                {shortenName(m.teamA.player1.name)}
                                                {m.teamA.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamA.player2.name)}</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-[1px] w-3 md:w-4 bg-primary/30" />
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-600 italic">VS</span>
                                            <div className="h-[1px] w-3 md:w-4 bg-primary/30" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm md:text-base font-black truncate max-w-[120px] md:max-w-[200px] ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white'}`}>
                                                {shortenName(m.teamB.player1.name)}
                                                {m.teamB.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamB.player2.name)}</span>}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Placar */}
                                <td className="bg-black/40 px-2 py-2 border-y border-white/5 group-hover:bg-black/60">
                                    <div className="flex items-center justify-center gap-1.5 md:gap-2 font-mono text-xl md:text-3xl font-black text-primary italic">
                                        <span>{m.setsA}</span>
                                        <span className="text-white/10 text-sm md:text-xl">x</span>
                                        <span>{m.setsB}</span>
                                    </div>
                                </td>

                                {/* Fase / Quadra */}
                                <td className="bg-white/[0.03] px-2 py-2 border-y border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex flex-col gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold uppercase">
                                        <div className="flex items-center gap-1 text-primary">
                                            {m.group ? <Users className="w-3 h-3 md:w-4 md:h-4" /> : <Trophy className="w-3 h-3 md:w-4 md:h-4" />}
                                            <span className="truncate max-w-[80px] md:max-w-none">{m.group ? `Grp ${m.group}` : m.round}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                            <span className="truncate max-w-[80px] md:max-w-none">{m.courtName || 'A DEFINIR'}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="bg-white/[0.03] rounded-r-xl px-3 md:px-4 py-2 border-y border-r border-white/5 group-hover:bg-white/[0.05]">
                                    <div className="flex justify-end">
                                        <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black border tracking-wider ${getStatusStyle(m.status)}`}>
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
