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
        const groupSections: MatchSection[] = [];
        const knockoutSections: MatchSection[] = [];

        // Separação honesta: tem grupo? Vai para seções de grupo.
        const gMatches = matches.filter(m => m.group);
        const kMatches = matches.filter(m => !m.group);

        // Seções de Grupo
        const gNames = Array.from(new Set(gMatches.map(m => m.group))).sort();
        gNames.forEach(gn => {
            groupSections.push({
                name: `Grupo ${gn}`,
                type: 'group',
                matches: gMatches.filter(m => m.group === gn)
            });
        });

        // Seções de Mata-Mata (baseadas no round)
        const rOrder = ['oitavas', 'quartas', 'semi', 'final'];
        const rNames = Array.from(new Set(kMatches.map(m => m.round))).sort((a, b) => {
            const aIdx = rOrder.indexOf(a as any);
            const bIdx = rOrder.indexOf(b as any);
            return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });

        rNames.forEach(rn => {
            knockoutSections.push({
                name: rn || 'Mata-Mata',
                type: 'knockout',
                matches: kMatches.filter(m => m.round === rn)
            });
        });

        return { groups: groupSections, knockouts: knockoutSections };
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
                    style={{ animation: 'slideScreens 22s linear infinite', willChange: 'transform' }}
                >
                    {/* Tela 1: Fase de Grupos */}
                    <div className="w-full flex flex-col pt-0">
                        <h3 className="text-xl md:text-2xl font-black text-white/50 mb-3 uppercase tracking-[0.4em] text-center italic flex items-center justify-center gap-4">
                            <Users size={24} className="text-primary/50" />
                            Fase de Grupos
                            <Users size={24} className="text-primary/50" />
                        </h3>
                        {groups.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6 auto-rows-max px-2 md:px-0">
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
                            Chaves Eliminatórias
                            <Trophy size={24} className="text-primary/50" />
                        </h3>
                        {knockouts.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6 auto-rows-max px-2 md:px-0">
                                {knockouts.map((section, idx) => (
                                    <ArenaMatchTable key={`knockout-${idx}`} section={section} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-white/5 mx-2 md:mx-0 py-20">
                                <Trophy size={80} className="text-white/5 mb-6" />
                                <span className="text-slate-500 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic text-lg md:text-2xl text-center px-4">
                                    Aguardando Chaves
                                </span>
                                <p className="text-slate-600 mt-2 font-bold uppercase tracking-widest text-xs md:text-sm text-center">
                                    Os confrontos de mata-mata aparecerão aqui<br />
                                    assim que forem gerados pelo administrador.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
