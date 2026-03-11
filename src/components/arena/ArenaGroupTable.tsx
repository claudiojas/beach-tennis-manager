import { Match, GroupStanding, Team } from "@/types/beach-tennis";
import { shortenName } from "@/lib/utils/nameUtils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";

interface ArenaGroupTableProps {
    category: string;
    groupName: string;
    matches: Match[];
}

export function ArenaGroupTable({ category, groupName, matches }: ArenaGroupTableProps) {
    const teamMap = new Map<string, { name: string; team: Team }>();
    matches.forEach(m => {
        const idA = m.teamA.player1.id + (m.teamA.player2?.id || '');
        const idB = m.teamB.player1.id + (m.teamB.player2?.id || '');

        if (!teamMap.has(idA)) teamMap.set(idA, {
            name: shortenName(m.teamA.player1.name) + (m.teamA.player2 ? ` / ${shortenName(m.teamA.player2.name)}` : ''),
            team: m.teamA
        });
        if (!teamMap.has(idB)) teamMap.set(idB, {
            name: shortenName(m.teamB.player1.name) + (m.teamB.player2 ? ` / ${shortenName(m.teamB.player2.name)}` : ''),
            team: m.teamB
        });
    });

    const standings = Array.from(teamMap.entries()).map(([id, info]) => {
        const teamMatches = matches.filter(m =>
            (m.teamA.player1.id + (m.teamA.player2?.id || '') === id) ||
            (m.teamB.player1.id + (m.teamB.player2?.id || '') === id)
        );

        const stats = teamMatches.reduce((acc, m) => {
            if (m.status !== 'finished') return acc;
            const isTeamA = (m.teamA.player1.id + (m.teamA.player2?.id || '') === id);
            const won = isTeamA ? m.setsA > m.setsB : m.setsB > m.setsA;

            let gWon = 0;
            let gLost = 0;
            if (m.historySets && m.historySets.length > 0) {
                m.historySets.forEach(s => {
                    gWon += isTeamA ? s.scoreA : s.scoreB;
                    gLost += isTeamA ? s.scoreB : s.scoreA;
                });
            } else {
                gWon = isTeamA ? m.setsA : m.setsB;
                gLost = isTeamA ? m.setsB : m.setsA;
            }

            return {
                played: acc.played + 1,
                won: acc.won + (won ? 1 : 0),
                gamesWon: acc.gamesWon + gWon,
                gamesLost: acc.gamesLost + gLost,
            };
        }, { played: 0, won: 0, gamesWon: 0, gamesLost: 0 });

        return {
            teamId: id,
            teamName: info.name,
            ...stats,
            balance: stats.gamesWon - stats.gamesLost,
            points: stats.won * 2
        };
    }).sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won;
        if (b.balance !== a.balance) return b.balance - a.balance;
        return b.gamesWon - a.gamesWon;
    });

    return (
        <div className="w-full max-w-5xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Users className="w-64 h-64 -mr-20 -mt-20" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 relative z-10">
                <div className="flex flex-col items-center md:items-start space-y-2">
                    <Badge className="bg-primary hover:bg-primary text-black font-black italic px-4 py-1 text-sm tracking-widest uppercase">
                        {category}
                    </Badge>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                        Classificação <span className="text-primary">Grupo {groupName}</span>
                    </h2>
                </div>

                <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Padrão CBT/FPT</span>
                </div>
            </div>

            <div className="relative z-10 mt-4 overflow-hidden rounded-3xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <th className="py-6 px-8 text-center w-16">Pos</th>
                            <th className="py-6 px-4">Dupla / Atleta</th>
                            <th className="py-6 px-4 text-center">V</th>
                            <th className="py-6 px-4 text-center">Jogos</th>
                            <th className="py-6 px-4 text-center">S. Games</th>
                            <th className="py-6 px-8 text-right">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((team, index) => (
                            <tr
                                key={team.teamId}
                                className={`border-t border-white/5 transition-colors duration-500 
                                    ${index < 2 ? 'bg-primary/[0.03]' : ''}
                                    hover:bg-white/[0.02]`}
                            >
                                <td className="py-6 px-8 text-center">
                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg 
                                        ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-300 text-black' : 'bg-white/5 text-slate-400'}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="py-6 px-4">
                                    <div className="font-black text-xl text-white uppercase tracking-tight truncate max-w-md">
                                        {team.teamName}
                                    </div>
                                    {index < 2 && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase text-green-500/70 tracking-widest">Zona de Classificação</span>
                                        </div>
                                    )}
                                </td>
                                <td className="py-6 px-4 text-center font-black text-2xl text-green-500">{team.won}</td>
                                <td className="py-6 px-4 text-center font-bold text-lg text-slate-400">{team.played}</td>
                                <td className="py-6 px-4 text-center font-mono text-lg text-slate-300">
                                    {team.balance > 0 ? '+' : ''}{team.balance}
                                </td>
                                <td className="py-6 px-8 text-right font-black text-3xl text-primary">{team.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                <div className="flex gap-4">
                    <span>V = Vitórias</span>
                    <span>S. Games = Saldo de Games</span>
                </div>
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Atualizando em Tempo Real</span>
                </div>
            </div>
        </div>
    );
}
