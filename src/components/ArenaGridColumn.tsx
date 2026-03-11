import { useMemo, useRef, useEffect, useState } from 'react';
import { Match } from "@/types/beach-tennis";
import { Users, Trophy } from 'lucide-react';
import { ArenaMatchTable, MatchSection } from './arena/ArenaMatchTable';
import { motion, useAnimationControls } from 'framer-motion';

interface ArenaGridColumnProps {
    category: string;
    tournamentName: string;
    matches: (Match & { courtName?: string })[];
}

export function ArenaGridColumn({ category: categoryProp, tournamentName, matches }: ArenaGridColumnProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const controls = useAnimationControls();
    const isMounted = useRef(true);

    const { etapa, displayCategory } = useMemo(() => {
        const separators = [' - ', ' / ', ' | ', ' : '];
        let foundEtapa = tournamentName;
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
            const aIdx = rOrder.indexOf(a?.toLowerCase() || '');
            const bIdx = rOrder.indexOf(b?.toLowerCase() || '');
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
        isMounted.current = true;

        const startSequence = async () => {
            if (!containerRef.current || !contentRef.current) return;

            // Wait for DOM to settle
            await new Promise(r => setTimeout(r, 2000));
            if (!isMounted.current) return;

            const cHeight = containerRef.current.offsetHeight;
            const iHeight = contentRef.current.offsetHeight;

            if (iHeight > cHeight + 20) {
                const distance = iHeight - cHeight;

                const animate = async () => {
                    if (!isMounted.current) return;

                    // Reset
                    await controls.set({ y: 0 });
                    await new Promise(r => setTimeout(r, 2000));
                    if (!isMounted.current) return;

                    // Scroll
                    await controls.start({
                        y: -distance,
                        transition: {
                            duration: distance / 20,
                            ease: "linear"
                        }
                    });

                    if (!isMounted.current) return;
                    await new Promise(r => setTimeout(r, 2000));

                    // Jump back
                    await controls.set({ y: 0 });
                    animate();
                };

                animate();
            }
        };

        startSequence();

        return () => {
            isMounted.current = false;
            controls.stop();
        };
    }, [matches, categoryProp, controls]);

    return (
        <div className="flex flex-col h-full bg-[#0f172a]/40 border-x border-white/5 relative overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-[#020617] z-30 shadow-xl">
                <p className="text-[10px] font-black text-[#0088cc] uppercase tracking-[0.5em] mb-1 italic">
                    Etapa: {etapa}
                </p>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">
                    {displayCategory}
                </h2>
            </div>

            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#020617] to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent z-20 pointer-events-none" />

                <motion.div
                    ref={contentRef}
                    animate={controls}
                    initial={{ y: 0 }}
                    style={{ position: 'relative' }}
                    className="p-6 flex flex-col gap-12"
                >
                    {groups.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-l-4 border-[#0088cc] pl-4">
                                <Users size={20} className="text-[#0088cc]" />
                                <span className="text-lg font-black text-white/50 uppercase tracking-widest italic">Fase de Grupos</span>
                            </div>
                            <div className="grid gap-6">
                                {groups.map((section, idx) => (
                                    <ArenaMatchTable key={`group-${idx}`} section={section} />
                                ))}
                            </div>
                        </div>
                    )}

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

                    {groups.length === 0 && knockouts.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                            <Trophy size={80} />
                            <p className="font-black uppercase tracking-widest mt-4">Aguardando Jogos</p>
                        </div>
                    )}
                </motion.div>
            </div>
            <div className="h-4 bg-[#020617] z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" />
        </div>
    );
}
