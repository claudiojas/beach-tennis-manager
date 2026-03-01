import { useMemo, useState, useEffect } from 'react';
import { Match } from "@/types/beach-tennis";
import { Activity } from 'lucide-react';
import { ArenaMatchTable } from './ArenaMatchTable';
import { HeadCategorie } from './HeadCategorie';

interface ArenaCategoryDashboardProps {
    category: string;
    matches: (Match & { courtName?: string })[];
    tournamentId: string;
}

export function ArenaCategoryDashboard({ category, matches, tournamentId }: ArenaCategoryDashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    return (
        <>
            <HeadCategorie currentTime={currentTime} category={category} />
            <div className="w-full h-full flex flex-col px-6 py-1 animate-in fade-in zoom-in-95 duration-700">


                {/* Painel Principal com Efeito de Marquee (Créditos Finais) */}
                <div className="flex-1 relative" style={{ perspective: '1000px' }}>
                    <style>
                        {`
                        @keyframes marqueeUp {
                            0% { transform: translateY(0%); }
                            100% { transform: translateY(-50%); }
                        }
                    `}
                    </style>
                    {sections.length > 0 ? (
                        <div
                            className="flex flex-col gap-8 w-full"
                            style={{ animation: 'marqueeUp 40s linear infinite', willChange: 'transform' }}
                        >
                            {/* Como a animação vai de 0% a -50%, precisamos renderizar o conteúdo 2x */}
                            {sections.map((section, idx) => (
                                <ArenaMatchTable key={`copy1-${idx}`} section={section as any} />
                            ))}
                            {sections.map((section, idx) => (
                                <ArenaMatchTable key={`copy2-${idx}`} section={section as any} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-white/5">
                            <Activity size={60} className="text-white/5 mb-4" />
                            <span className="text-slate-600 font-black uppercase tracking-[0.5em] italic">
                                Sem Jogos Programados
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
