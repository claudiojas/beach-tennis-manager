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
            case 'ongoing': return 'bg-green-500/20 text-green-400 animate-pulse';
            case 'finished': return 'bg-slate-500/10 text-slate-50';
            default: return 'bg-amber-500/10 text-amber-500/70';
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
        <div className="w-full h-fit flex-none backdrop-blur-md rounded-2xl shadow-xl relative overflow-hidden">
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

            <div className="w-full px-2 md:px-3 pb-3 space-y-3">
                {section.matches.map(m => (
                    <div
                        key={m.id}
                        className="bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden group transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10"
                    >
                        {/* Top Area: Names and Score */}
                        <div className="flex items-center justify-between p-4 gap-4 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
                            {/* Team 1 */}
                            <div className="flex-1 flex flex-col items-end gap-0.5">
                                <span className={`text-sm md:text-base font-black uppercase tracking-tight text-right leading-tight ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white'}`}>
                                    {shortenName(m.teamA.player1.name)}
                                </span>
                                {m.teamA.player2 && (
                                    <>
                                        <span className="text-[10px] font-black text-white/20 italic">&</span>
                                        <span className={`text-sm md:text-base font-black uppercase tracking-tight text-right leading-tight ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white'}`}>
                                            {shortenName(m.teamA.player2.name)}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Score Center */}
                            <div className="flex flex-col items-center justify-center min-w-[90px] shrink-0">
                                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-black/60 rounded-xl border border-white/5 shadow-inner">
                                    <span className={`text-xl md:text-2xl font-mono font-black italic ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white/90'}`}>
                                        {m.setsA}
                                    </span>
                                    <span className="text-white/10 text-[10px] font-sans not-italic">x</span>
                                    <span className={`text-xl md:text-2xl font-mono font-black italic ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white/90'}`}>
                                        {m.setsB}
                                    </span>
                                </div>
                                {m.status === 'ongoing' && (
                                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-black text-white/40 bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20 animate-pulse">
                                        <span className={m.pointsA === '40' || m.pointsA === 'AD' ? 'text-primary' : ''}>{m.pointsA}</span>
                                        <span className="opacity-20">:</span>
                                        <span className={m.pointsB === '40' || m.pointsB === 'AD' ? 'text-primary' : ''}>{m.pointsB}</span>
                                    </div>
                                )}
                            </div>

                            {/* Team 2 */}
                            <div className="flex-1 flex flex-col items-start gap-0.5">
                                <span className={`text-sm md:text-base font-black uppercase tracking-tight text-left leading-tight ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white'}`}>
                                    {shortenName(m.teamB.player1.name)}
                                </span>
                                {m.teamB.player2 && (
                                    <>
                                        <span className="text-[10px] font-black text-white/20 italic">&</span>
                                        <span className={`text-sm md:text-base font-black uppercase tracking-tight text-left leading-tight ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white'}`}>
                                            {shortenName(m.teamB.player2.name)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bottom Area: Info and Status */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-primary">
                                    {m.group ? <Users className="w-3.5 h-3.5 opacity-50" /> : <Trophy className="w-3.5 h-3.5 opacity-50" />}
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider">
                                        {m.group ? `GRUPO ${m.group}` : m.round}
                                    </span>
                                </div>

                                <div className="h-3 w-[1px] bg-white/10" />

                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <MapPin className="w-3.5 h-3.5 opacity-50" />
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider truncate max-w-[120px]">
                                        {m.courtName || 'A DEFINIR'}
                                    </span>
                                </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-md text-[8px] md:text-[9px] font-black border tracking-[0.15em] ${getStatusStyle(m.status)}`}>
                                {getStatusText(m.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
