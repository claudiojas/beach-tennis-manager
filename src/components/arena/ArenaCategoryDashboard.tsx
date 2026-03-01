import { useMemo, useState, useEffect } from 'react';
import { Match } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { MapPin, Trophy, Users, Activity } from 'lucide-react';

interface ArenaCategoryDashboardProps {
    category: string;
    matches: (Match & { courtName?: string })[];
    tournamentId: string;
}

export function ArenaCategoryDashboard({ category, matches, tournamentId }: ArenaCategoryDashboardProps) {
    const [page, setPage] = useState(0);

    // Agrupamento inteligente para o painel da TV
    const sections = useMemo(() => {
        const result: { name: string; type: 'group' | 'knockout'; matches: Match[] }[] = [];

        const groupMatches = matches.filter(m => m.group);
        const knockoutMatches = matches.filter(m => !m.group);

        // Como a TV não rola sozinha, dividimos as tabelas grandes em páginas
        const MATCHES_PER_TABLE = 8;

        if (groupMatches.length > 0) {
            for (let i = 0; i < groupMatches.length; i += MATCHES_PER_TABLE) {
                const chunk = groupMatches.slice(i, i + MATCHES_PER_TABLE);
                const suffix = groupMatches.length > MATCHES_PER_TABLE ? ` (${Math.floor(i / MATCHES_PER_TABLE) + 1}/${Math.ceil(groupMatches.length / MATCHES_PER_TABLE)})` : '';
                result.push({ name: `Fase de Grupos${suffix}`, type: 'group', matches: chunk });
            }
        }

        if (knockoutMatches.length > 0) {
            for (let i = 0; i < knockoutMatches.length; i += MATCHES_PER_TABLE) {
                const chunk = knockoutMatches.slice(i, i + MATCHES_PER_TABLE);
                const suffix = knockoutMatches.length > MATCHES_PER_TABLE ? ` (${Math.floor(i / MATCHES_PER_TABLE) + 1}/${Math.ceil(knockoutMatches.length / MATCHES_PER_TABLE)})` : '';
                result.push({ name: `Mata-Mata${suffix}`, type: 'knockout', matches: chunk });
            }
        }

        return result;
    }, [matches]);

    // Paginação para telas pequenas ou muitos grupos (mostra 2 seções por vez)
    const itemsPerPage = 2;
    const totalPages = Math.ceil(sections.length / itemsPerPage);

    useEffect(() => {
        if (totalPages <= 1) {
            setPage(0);
            return;
        }
        const timer = setInterval(() => {
            setPage(prev => (prev + 1) % totalPages);
        }, 15000); // 15 segundos por slide
        return () => clearInterval(timer);
    }, [totalPages]);

    const activeSections = useMemo(() => {
        return sections.slice(page * itemsPerPage, (page * itemsPerPage) + itemsPerPage);
    }, [sections, page]);

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
        <div className="w-full h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Header de Categoria */}
            <div className="flex items-end justify-between mb-8 border-l-8 border-primary pl-6 py-2">
                <div>
                    <p className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-1">Operações Arena</p>
                    <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Categoria {category}
                    </h2>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-3xl font-black font-mono text-white/20">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Painel Principal */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                {activeSections.length > 0 ? activeSections.map(section => (
                    <div key={section.name} className="flex-1 min-w-0 bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
                        {/* Indicador de Tipo */}
                        <div className="absolute top-6 right-6 opacity-10">
                            {section.type === 'group' ? <Users size={80} /> : <Trophy size={80} />}
                        </div>

                        <div className="px-8 pt-8 pb-4 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${section.type === 'group' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'}`}>
                                {section.type === 'group' ? <Users size={20} /> : <Trophy size={20} />}
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">{section.name}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-8">
                            <table className="w-full text-left border-separate border-spacing-y-3">
                                <thead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-2">Confronto</th>
                                        <th className="px-2 py-2 text-center w-24">Placar</th>
                                        <th className="px-2 py-2 w-40">Fase / Quadra</th>
                                        <th className="px-6 py-2 text-right w-32">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.matches.map(m => (
                                        <tr key={m.id} className="group transition-all duration-300">
                                            {/* Atletas */}
                                            <td className="bg-white/[0.03] rounded-l-2xl px-6 py-4 border-y border-l border-white/5 group-hover:bg-white/[0.05]">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-base font-black truncate ${m.status === 'finished' && m.setsA > m.setsB ? 'text-primary' : 'text-white'}`}>
                                                            {shortenName(m.teamA.player1.name)}
                                                            {m.teamA.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamA.player2.name)}</span>}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-[1px] w-4 bg-primary/30" />
                                                        <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                                                        <div className="h-[1px] w-4 bg-primary/30" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-base font-black truncate ${m.status === 'finished' && m.setsB > m.setsA ? 'text-primary' : 'text-white'}`}>
                                                            {shortenName(m.teamB.player1.name)}
                                                            {m.teamB.player2 && <span className="text-white/40 ml-1">/ {shortenName(m.teamB.player2.name)}</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Placar */}
                                            <td className="bg-black/40 px-2 py-4 border-y border-white/5 group-hover:bg-black/60">
                                                <div className="flex items-center justify-center gap-2 font-mono text-3xl font-black text-primary italic">
                                                    <span>{m.setsA}</span>
                                                    <span className="text-white/10 text-xl">x</span>
                                                    <span>{m.setsB}</span>
                                                </div>
                                            </td>

                                            {/* Fase / Quadra */}
                                            <td className="bg-white/[0.03] px-2 py-4 border-y border-white/5 group-hover:bg-white/[0.05]">
                                                <div className="flex flex-col gap-1.5 text-xs font-bold uppercase">
                                                    <div className="flex items-center gap-1 text-primary">
                                                        {m.group ? <Users size={12} /> : <Trophy size={12} />}
                                                        <span className="truncate">{m.group ? `Grupo ${m.group}` : m.round}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <MapPin size={12} />
                                                        <span className="truncate">{m.courtName || 'A DEFINIR'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="bg-white/[0.03] rounded-r-2xl px-6 py-4 border-y border-r border-white/5 group-hover:bg-white/[0.05]">
                                                <div className="flex justify-end">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-wider ${getStatusStyle(m.status)}`}>
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
                )) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-white/5">
                        <Activity size={60} className="text-white/5 mb-4" />
                        <span className="text-slate-600 font-black uppercase tracking-[0.5em] italic">
                            Sem Jogos Programados
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
