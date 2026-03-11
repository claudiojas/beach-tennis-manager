import { useMemo, useRef, useEffect, useState } from 'react';
import { Match } from "@/types/beach-tennis";
import { Users, Trophy } from 'lucide-react';
import { ArenaMatchTable, MatchSection } from './arena/ArenaMatchTable';

interface ArenaGridColumnProps {
    category: string;
    tournamentName: string;
    matches: (Match & { courtName?: string })[];
}

export function ArenaGridColumn({ category: categoryProp, tournamentName, matches }: ArenaGridColumnProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    // Dynamic extraction of Etapa and Category
    const { etapa, displayCategory } = useMemo(() => {
        // If category is "Torneio da vóvo - +60", split it
        const separators = [' - ', ' / ', ' | ', ' : '];
        let foundEtapa = tournamentName; // Fallback
        let foundCat = categoryProp;

        for (const sep of separators) {
            if (categoryProp.includes(sep)) {
                const parts = categoryProp.split(sep);
                foundEtapa = parts[0].trim();
                foundCat = parts[1].trim();
                break;
            }
        }

        return { etapa: foundEtapa, displayCategory: foundCat };
    }, [categoryProp, tournamentName]);
    const { groups, knockouts } = useMemo(() => {
        const groupSections: MatchSection[] = [];
        const knockoutSections: MatchSection[] = [];

        const gMatches = matches.filter(m => m.group);
        const kMatches = matches.filter(m => !m.group);

        const gNames = Array.from(new Set(gMatches.map(m => m.group))).sort();
        gNames.forEach(gn => {
            groupSections.push({
                name: `Grupo ${gn}`,
                type: 'group',
                matches: gMatches.filter(m => m.group === gn)
            });
        });

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

    useEffect(() => {
        const checkScroll = () => {
            if (scrollRef.current) {
                const isOverflown = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
                setShouldScroll(isOverflown);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [groups, knockouts]);

    return (
        <div className="flex flex-col h-full bg-slate-900/40 border-x border-white/5 relative overflow-hidden group">
            {/* Column Header - Strictly on top */}
            <div className="p-6 border-b border-white/10 bg-slate-950 z-30 shadow-xl">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-1 italic">
                    Etapa: {etapa}
                </p>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">
                    {displayCategory}
                </h2>
            </div>

            {/* Scrolling Content Area */}
            <div
                ref={scrollRef}
                className="flex-1 relative overflow-hidden"
            >
                {/* Visual Masks */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-950 to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />

                <div
                    className={`p-6 flex flex-col gap-12 ${shouldScroll ? 'animate-vertical-marquee' : ''}`}
                    style={{
                        animationDuration: `${Math.max(20, (groups.length + knockouts.length) * 12)}s`,
                        animationPlayState: 'running'
                    }}
                >
                    {/* Groups Section */}
                    {groups.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                                <Users size={20} className="text-primary" />
                                <span className="text-lg font-black text-white/50 uppercase tracking-widest italic">Fase de Grupos</span>
                            </div>
                            <div className="grid gap-6">
                                {groups.map((section, idx) => (
                                    <ArenaMatchTable key={`group-${idx}`} section={section} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Knockout Section */}
                    {knockouts.length > 0 && (
                        <div className="space-y-6 pb-20">
                            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4">
                                <Trophy size={20} className="text-orange-500" />
                                <span className="text-lg font-black text-white/50 uppercase tracking-widest italic">Chaves Eliminatórias</span>
                            </div>
                            <div className="grid gap-6">
                                {knockouts.map((section, idx) => (
                                    <ArenaMatchTable key={`knockout-${idx}`} section={section} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {groups.length === 0 && knockouts.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                            <Trophy size={80} />
                            <p className="font-black uppercase tracking-widest mt-4">Aguardando Jogos</p>
                        </div>
                    )}

                    {/* Duplicate for seamless loop if scrolling */}
                    {shouldScroll && (
                        <div className="flex flex-col gap-12 mt-12" aria-hidden="true">
                            {groups.map((section, idx) => (
                                <ArenaMatchTable key={`group-dup-${idx}`} section={section} />
                            ))}
                            {knockouts.map((section, idx) => (
                                <ArenaMatchTable key={`knockout-dup-${idx}`} section={section} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Header overlay fix */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-950 z-20" />
        </div>
    );
}
