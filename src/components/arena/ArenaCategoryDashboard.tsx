import { useMemo } from 'react';
import { Match } from "@/types/beach-tennis";
import { Activity, Trophy, Users } from 'lucide-react';
import { ArenaMatchTable, MatchSection } from './ArenaMatchTable';
interface ArenaCategoryDashboardProps {
    category: string;
    matches: (Match & { courtName?: string })[];
}

export function ArenaCategoryDashboard({ category, matches }: ArenaCategoryDashboardProps) {
    // Agrupamento inteligente para o painel de TV e Mobile (Formato Grid e Telas)
    const { groups, knockouts } = useMemo(() => {
        const groupMatches = matches.filter(m => m.group);
        const knockoutMatches = matches.filter(m => !m.group);

        // Agrupar Fase de Grupos
        const groupNames = Array.from(new Set(groupMatches.map(m => m.group))).sort();
        const groups: MatchSection[] = groupNames.map(g => ({
            name: `Grupo ${g}`,
            type: 'group' as const,
            matches: groupMatches.filter(m => m.group === g)
        }));

        // Fases Eliminatorias (Mata-Mata)
        const knockoutRounds = Array.from(new Set(knockoutMatches.map(m => m.round)));
        const knockouts: MatchSection[] = knockoutRounds.length > 0 ? knockoutRounds.map(r => ({
            name: String(r),
            type: 'knockout' as const,
            matches: knockoutMatches.filter(m => m.round === r)
        })) : [];

        return { groups, knockouts };
    }, [matches]);

    return (
        <div className="w-full h-full flex flex-col pt-0 animate-in fade-in zoom-in-95 duration-700">
            {/* Painel Principal com Efeito de Marquee (Duas Telas: Grupos e Mata-Mata) */}
            <div className="flex-1 relative" style={{ perspective: '1000px' }}>
                <style>
                    {`
                        @keyframes slideScreens {
                            0%, 3.33% { transform: translateY(0%); }
                            90% { transform: translateY(min(0px, calc(-100% + 80vh))); }
                            95% { transform: translateY(min(0px, calc(-100% + 80vh))); }
                            100% { transform: translateY(0%); }
                        }
                    `}
                </style>
                <div
                    className="flex flex-col w-full h-fit gap-20 pb-32"
                    style={{ animation: 'slideScreens 60s linear infinite', willChange: 'transform' }}
                >
                    {/* Tela 1: Fase de Grupos */}
                    <div className="w-full flex flex-col pt-0">
                        <h3 className="text-xl md:text-2xl font-black text-white/50 mb-3 uppercase tracking-[0.4em] text-center italic flex items-center justify-center gap-4">
                            <Users size={24} className="text-primary/50" />
                            Fase de Grupos
                            <Users size={24} className="text-primary/50" />
                        </h3>
                        {groups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max px-2 md:px-0">
                                {groups.map((section, idx) => (
                                    <ArenaMatchTable key={`group-${idx}`} section={section} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-white/5 mx-2 md:mx-0 py-20">
                                <Activity size={60} className="text-white/5 mb-4" />
                                <span className="text-slate-600 font-black uppercase tracking-[0.5em] italic text-center px-4">
                                    Nenhum jogo de grupo cadastrado
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tela 2: Mata-Mata */}
                    <div className="w-full flex flex-col pt-4 relative">
                        <h3 className="text-xl md:text-2xl font-black text-white/50 mb-6 uppercase tracking-[0.4em] text-center italic flex items-center justify-center gap-4">
                            <Trophy size={24} className="text-primary/50" />
                            Mata-Mata
                            <Trophy size={24} className="text-primary/50" />
                        </h3>
                        {knockouts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max px-2 md:px-0">
                                {knockouts.map((section, idx) => (
                                    <ArenaMatchTable key={`knockout-${idx}`} section={section} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-white/5 mx-2 md:mx-0 py-20">
                                <Trophy size={80} className="text-white/5 mb-6" />
                                <span className="text-slate-500 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic text-lg md:text-2xl text-center px-4">
                                    Aguardando Definição
                                </span>
                                <p className="text-slate-600 mt-2 font-bold uppercase tracking-widest text-xs md:text-sm">Os confrontos aparecerão aqui em breve</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
