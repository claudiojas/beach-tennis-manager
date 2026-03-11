import { db } from "@/lib/firebase";
import { Match, Team, Player, MatchResult } from "@/types/beach-tennis";
import { ref, push, set, onValue, query, orderByChild, equalTo, update, get } from "firebase/database";
import { courtService } from "./courtService";

const MATCHES_PATH = "matches";

export const matchService = {
    create: async (match: Omit<Match, "id" | "status" | "setsA" | "setsB" | "pointsA" | "pointsB" | "historySets" | "serving">) => {
        const matchesRef = ref(db, MATCHES_PATH);
        const newMatchRef = push(matchesRef);
        const newMatch: Match = {
            ...match,
            id: newMatchRef.key!,
            status: 'planned',
            setsA: 0,
            setsB: 0,
            pointsA: 0,
            pointsB: 0,
            historySets: [],
            serving: 'teamA',
        };
        await set(newMatchRef, newMatch);
        return newMatchRef.key;
    },

    subscribeByTournament: (tournamentId: string, callback: (matches: Match[]) => void) => {
        if (!tournamentId) {
            console.error("subscribeByTournament: tournamentId is missing");
            return () => { };
        }
        const matchesQuery = query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        return onValue(matchesQuery, (snapshot) => {
            const data = snapshot.val();
            const matches: Match[] = data ? Object.values(data) : [];
            callback(matches.reverse()); // Newest first
        });
    },

    // Assign match to a court and start it
    startMatch: async (match: Match, courtId: string) => {
        const actualStartTime = Date.now();
        const ongoingStatus = 'ongoing';

        const matchRef = ref(db, `${MATCHES_PATH}/${match.id}`);
        const matchUpdate = {
            status: ongoingStatus,
            courtId,
            actualStartTime,
        };
        await update(matchRef, matchUpdate);

        // 2. Update the court with the full match data for immediate sync
        const courtRef = ref(db, `courts/${courtId}`);
        await update(courtRef, {
            status: 'em_jogo',
            currentMatch: {
                ...match,
                ...matchUpdate
            }
        });
    },

    update: async (matchId: string, updates: Partial<Match>) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        await update(matchRef, updates);

        // Use a single get() to ensure we have the latest courtId and full match data
        const snapshot = await get(matchRef);
        const fullMatch = snapshot.val() as Match;

        if (fullMatch && fullMatch.courtId) {
            const courtMatchRef = ref(db, `courts/${fullMatch.courtId}/currentMatch`);

            if (updates.status === 'finished') {
                // If finishing, clear the court too
                await update(ref(db, `courts/${fullMatch.courtId}`), {
                    status: 'livre',
                    currentMatch: null
                });
            } else {
                // Otherwise just sync the current match data
                await update(courtMatchRef, updates);
            }
        }

        // --- NEW: Automatic Winner Progression ---
        // If the match is being finished and has a nextMatchId, move the winner forward
        if (updates.status === 'finished') {
            // We need the full match data to know who won and the nextMatchId
            onValue(matchRef, async (snapshot) => {
                const match = snapshot.val() as Match;
                if (match && match.nextMatchId) {
                    const winner = match.setsA > match.setsB ? match.teamA : match.teamB;
                    const nextMatchRef = ref(db, `${MATCHES_PATH}/${match.nextMatchId}`);

                    // Determine if the winner goes to teamA or teamB based on bracket position
                    // Matches 0, 2, 4... feed teamA; Matches 1, 3, 5... feed teamB
                    const isTeamAForNext = match.bracketPosition === undefined || match.bracketPosition % 2 === 0;

                    await update(nextMatchRef, {
                        [isTeamAForNext ? 'teamA' : 'teamB']: winner
                    });
                }

                // ALSO: Save to history
                await matchService.saveMatchResult(match);
            }, { onlyOnce: true });
        }
    },

    saveMatchResult: async (match: Match) => {
        const resultsRef = ref(db, "results");
        const newResultRef = push(resultsRef);

        const result: MatchResult = {
            id: newResultRef.key!,
            tournamentId: match.tournamentId,
            matchId: match.id,
            courtId: match.courtId || 'unassigned',
            courtName: 'N/A', // We can improve this by fetching court name
            teamANames: match.teamA.player1.name + (match.teamA.player2 ? ` / ${match.teamA.player2.name}` : ''),
            teamBNames: match.teamB.player1.name + (match.teamB.player2 ? ` / ${match.teamB.player2.name}` : ''),
            scoreA: match.setsA,
            scoreB: match.setsB,
            endTime: Date.now()
        };

        // Try to get court name if courtId exists
        if (match.courtId) {
            try {
                const courtSnapshot = await get(ref(db, `courts/${match.courtId}`));
                if (courtSnapshot.exists()) {
                    result.courtName = courtSnapshot.val().name;
                }
            } catch (e) {
                console.error("Error fetching court name for result", e);
            }
        }

        await set(newResultRef, result);
    },

    generateInitialMatches: async (tournamentId: string, category: string, athletes: Player[], type: 'Simples' | 'Duplas') => {
        if (athletes.length < 2) throw new Error("Atletas insuficientes.");

        // Fetch available courts
        const allCourts = await courtService.getByTournamentOnce(tournamentId);
        const existingMatchesSnapshot = await get(query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId)));
        const existingMatches = existingMatchesSnapshot.exists() ? Object.values(existingMatchesSnapshot.val()) as Match[] : [];

        const occupiedCourtIds = existingMatches
            .filter(m => m.status === 'planned' || m.status === 'ongoing')
            .map(m => m.courtId);

        let availableCourts = allCourts.filter(c => !occupiedCourtIds.includes(c.id));

        const shuffled = [...athletes].sort(() => Math.random() - 0.5);

        if (type === 'Simples') {
            for (let i = 0; i < shuffled.length - 1; i += 2) {
                const court = availableCourts.shift();
                const matchData = {
                    tournamentId,
                    category,
                    teamA: { player1: shuffled[i] },
                    teamB: { player1: shuffled[i + 1] },
                    courtId: court?.id || null
                };
                await matchService.create(matchData as any);
            }
        } else {
            // Duplas
            if (athletes.length < 4) throw new Error("Atletas insuficientes para duplas.");
            for (let i = 0; i < shuffled.length - 3; i += 4) {
                const court = availableCourts.shift();
                const matchData = {
                    tournamentId,
                    category,
                    teamA: { player1: shuffled[i], player2: shuffled[i + 1] },
                    teamB: { player1: shuffled[i + 2], player2: shuffled[i + 3] },
                    courtId: court?.id || null
                };
                await matchService.create(matchData as any);
            }
        }
    },

    /**
     * NEW: Generates Group Phase (Round Robin)
     * Groups of 3 or 4 based on total teams.
     */
    generateGroupMatches: async (tournamentId: string, category: string, athletes: Player[], type: 'Simples' | 'Duplas') => {
        // --- SAFEGUARD: Prevent Duplicate Groups ---
        const existingSnapshot = await get(query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId)));
        if (existingSnapshot.exists()) {
            const existingMatches = Object.values(existingSnapshot.val()) as Match[];
            const alreadyHasGroups = existingMatches.some(m => m.category === category && m.round === 'Grupos');
            if (alreadyHasGroups) {
                throw new Error(`Partidas de grupo para a categoria ${category} já foram geradas.`);
            }
        }

        const teams: Team[] = [];
        if (type === 'Simples') {
            athletes.forEach(p => teams.push({ player1: p }));
        } else {
            for (let i = 0; i < athletes.length - 1; i += 2) {
                teams.push({ player1: athletes[i], player2: athletes[i + 1] });
            }
        }

        if (teams.length < 3) throw new Error("Mínimo de 3 duplas/atletas para fase de grupos.");

        // Fetch available courts
        const allCourts = await courtService.getByTournamentOnce(tournamentId);
        const existingMatchesSnapshot = await get(query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId)));
        const existingMatches = existingMatchesSnapshot.exists() ? Object.values(existingMatchesSnapshot.val()) as Match[] : [];

        const occupiedCourtIds = existingMatches
            .filter(m => m.status === 'planned' || m.status === 'ongoing')
            .map(m => m.courtId);

        let availableCourts = allCourts.filter(c => !occupiedCourtIds.includes(c.id));

        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

        // Smart division: Prefer groups of 3 or 4 (Federation Standard)
        const numTeams = shuffledTeams.length;
        let numGroups = Math.floor(numTeams / 3);

        // Ensure we don't have too few groups for many teams
        if (numTeams > 4 && numGroups < 1) numGroups = 1;

        const groupAssignments: Team[][] = Array.from({ length: numGroups }, () => []);

        // Distribute teams one by one into groups to ensure perfect balance
        shuffledTeams.forEach((team, index) => {
            const groupIndex = index % numGroups;
            groupAssignments[groupIndex].push(team);
        });

        // Post-check: ensure no group has < 3 teams (unless total teams < 3)
        if (numTeams >= 3 && groupAssignments.some(g => g.length < 3)) {
            if (groupAssignments.length > 1) {
                const smallGroup = groupAssignments.pop()!;
                smallGroup.forEach((team, i) => {
                    groupAssignments[i % groupAssignments.length].push(team);
                });
            }
        }

        // Generate Round Robin matches for each group
        for (let gIndex = 0; gIndex < groupAssignments.length; gIndex++) {
            const groupName = String.fromCharCode(65 + gIndex); // A, B, C...
            const groupTeams = groupAssignments[gIndex];

            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    const court = availableCourts.shift();
                    await matchService.create({
                        tournamentId,
                        category,
                        teamA: groupTeams[i],
                        teamB: groupTeams[j],
                        group: groupName,
                        round: 'Grupos',
                        courtId: court?.id || null
                    });
                }
            }
        }
    },

    /**
     * PROMOTE winners from Groups to Bracket
     */
    promoteGroupWinners: async (tournamentId: string, category: string, topCount: 1 | 2) => {
        try {
            // 1. Get all matches for this tournament/category
            const matchesRef = ref(db, MATCHES_PATH);
            const snapshot = await get(query(matchesRef, orderByChild("tournamentId"), equalTo(tournamentId)));

            if (!snapshot.exists()) throw new Error("Nenhuma partida encontrada para este torneio.");

            const matchesData = snapshot.val();
            const allMatches = matchesData ? (Object.values(matchesData) as Match[]).filter(m => m.category === category) : [];

            // 2. Identify Groups
            const groups = Array.from(new Set(allMatches.map(m => m.group).filter(Boolean))) as string[];
            const teamsToPromote: Team[] = [];

            if (groups.length === 0) throw new Error("Não foram encontrados grupos para esta categoria.");

            // 3. For each group, calculate standings and take TOP N
            groups.sort().forEach(groupName => {
                const groupMatches = allMatches.filter(m => m.group === groupName);

                const teamMap = new Map<string, { identifier: string; team: Team }>();
                groupMatches.forEach(m => {
                    if (!m.teamA || !m.teamB) return;
                    const idA = m.teamA.player1.id + (m.teamA.player2?.id || '');
                    const idB = m.teamB.player1.id + (m.teamB.player2?.id || '');
                    if (!teamMap.has(idA)) teamMap.set(idA, { identifier: idA, team: m.teamA });
                    if (!teamMap.has(idB)) teamMap.set(idB, { identifier: idB, team: m.teamB });
                });

                const stats = Array.from(teamMap.entries()).map(([id, info]) => {
                    const tMatches = groupMatches.filter(m =>
                        (m.teamA?.player1.id + (m.teamA?.player2?.id || '') === id) ||
                        (m.teamB?.player1.id + (m.teamB?.player2?.id || '') === id)
                    );

                    let won = 0;
                    let setsWon = 0;
                    let setsLost = 0;
                    let gamesWon = 0;
                    let gamesLost = 0;

                    tMatches.forEach(m => {
                        if (m.status !== 'finished' || !m.teamA || !m.teamB) return;
                        const isA = (m.teamA.player1.id + (m.teamA.player2?.id || '') === id);

                        if (isA) {
                            if (m.setsA > m.setsB) won++;
                            setsWon += m.setsA;
                            setsLost += m.setsB;
                        } else {
                            if (m.setsB > m.setsA) won++;
                            setsWon += m.setsB;
                            setsLost += m.setsA;
                        }

                        const history = Array.isArray(m.historySets) ? m.historySets : [];
                        if (history.length > 0) {
                            history.forEach(s => {
                                if (isA) {
                                    gamesWon += s.scoreA;
                                    gamesLost += s.scoreB;
                                } else {
                                    gamesWon += s.scoreB;
                                    gamesLost += s.scoreA;
                                }
                            });
                        } else {
                            // FALLBACK: Use setsA/setsB if historySets is empty
                            if (isA) {
                                gamesWon += m.setsA;
                                gamesLost += m.setsB;
                            } else {
                                gamesWon += m.setsB;
                                gamesLost += m.setsA;
                            }
                        }
                    });

                    return { id, team: info.team, won, setsWon, setsLost, gamesWon, gamesLost, matches: tMatches };
                }).sort((a, b) => {
                    // 1. Number of Victories
                    if (b.won !== a.won) return b.won - a.won;

                    // 2. Head-to-head (Confronto Direto) - ONLY if Exactly 2 teams are tied in wins
                    // According to CBT: "Empate entre duas duplas: O confronto direto entre elas determina a posição."
                    const tiedTeams = groupMatches.filter(m => m.status === 'finished').reduce((acc, match) => {
                        // This is a bit complex in a map, let's simplify: 
                        // Search for all teams with the same number of wins in this group
                        return acc; // Placeholder for logic inside the sort
                    }, [] as any[]);

                    // Re-calculating tied count for the specific 'won' level
                    // (This is handled by looking at the whole group later or simple comparison)

                    // 3. Sets Balance
                    const balanceSetsA = a.setsWon - a.setsLost;
                    const balanceSetsB = b.setsWon - b.setsLost;
                    if (balanceSetsB !== balanceSetsA) return balanceSetsB - balanceSetsA;

                    // 4. Games Balance
                    const balanceGamesA = a.gamesWon - a.gamesLost;
                    const balanceGamesB = b.gamesWon - b.gamesLost;
                    if (balanceGamesB !== balanceGamesA) return balanceGamesB - balanceGamesA;

                    // 5. Game Average
                    const avgA = a.gamesWon / (a.gamesWon + a.gamesLost || 1);
                    const avgB = b.gamesWon / (b.gamesWon + b.gamesLost || 1);
                    if (avgB !== avgA) return avgB - avgA;

                    return 0;
                });

                // Special handling for 2-way tie (Confronto Direto)
                // If two teams are tied in EVERY criterion above OR specifically just wins, 
                // the match between them is the absolute tie-breaker.
                // But usually CBT says: 2 teams -> direct; 3+ teams -> set balance -> game balance.

                // Refined Sorting for 2-way ties specifically
                for (let i = 0; i < stats.length - 1; i++) {
                    for (let j = i + 1; j < stats.length; j++) {
                        const teamA = stats[i];
                        const teamB = stats[j];

                        if (teamA.won === teamB.won) {
                            // Check if it's ONLY these two tied in wins
                            const othersWithSameWins = stats.filter(s => s.won === teamA.won).length;
                            if (othersWithSameWins === 2) {
                                const directMatch = groupMatches.find(m =>
                                    (m.teamA?.player1.id + (m.teamA?.player2?.id || '') === teamA.id && m.teamB?.player1.id + (m.teamB?.player2?.id || '') === teamB.id) ||
                                    (m.teamB?.player1.id + (m.teamB?.player2?.id || '') === teamA.id && m.teamA?.player1.id + (m.teamA?.player2?.id || '') === teamB.id)
                                );

                                if (directMatch && directMatch.status === 'finished') {
                                    const aIsA = directMatch.teamA?.player1.id + (directMatch.teamA?.player2?.id || '') === teamA.id;
                                    const aWon = aIsA ? directMatch.setsA > directMatch.setsB : directMatch.setsB > directMatch.setsA;

                                    if (!aWon) {
                                        // Swap them
                                        [stats[i], stats[j]] = [stats[j], stats[i]];
                                    }
                                }
                            }
                        }
                    }
                }

                // Take TOP N
                for (let i = 0; i < Math.min(topCount, stats.length); i++) {
                    if (stats[i]?.team) {
                        teamsToPromote.push(stats[i].team);
                    }
                }
            });

            // 4. Generate Bracket
            if (teamsToPromote.length >= 2) {
                const bracketServiceImport = (await import('./bracketService')).bracketService;
                await bracketServiceImport.generateBracket(tournamentId, category, teamsToPromote);
                return true;
            } else {
                throw new Error(`Número de equipes promovidas (${teamsToPromote.length}) é insuficiente para gerar mata-mata.`);
            }
        } catch (error: any) {
            console.error("Erro em promoteGroupWinners:", error);
            throw error;
        }
    },

    remove: async (matchId: string) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        const snapshot = await get(matchRef);
        const match = snapshot.val() as Match;

        if (match && match.courtId) {
            // If the match was on a court, we must release the court
            const courtRef = ref(db, `courts/${match.courtId}`);
            await update(courtRef, {
                status: 'livre',
                currentMatch: null
            });
        }

        await set(matchRef, null);
    },

    /**
     * FORCE RELEASE: Unlocks a match from a device without losing score
     */
    releaseMatch: async (matchId: string) => {
        const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
        // This is now redundant since we removed controlledBy
        await update(matchRef, { controlledBy: null });
    },

    resetCourtsByTournament: async (tournamentId: string) => {
        const matchesQuery = query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        const snapshot = await get(matchesQuery);
        const matchesData = snapshot.val();

        if (matchesData) {
            const updates: Record<string, any> = {};
            Object.keys(matchesData).forEach(key => {
                const match = matchesData[key] as Match;
                if (match.status === 'planned') {
                    updates[`${key}/courtId`] = null;
                }
            });
            await update(ref(db, MATCHES_PATH), updates);
        }
    },

    deleteMatchesByGroup: async (tournamentId: string, category: string, groupName: string) => {
        const matchesQuery = query(ref(db, MATCHES_PATH), orderByChild("tournamentId"), equalTo(tournamentId));
        const snapshot = await get(matchesQuery);
        const matchesData = snapshot.val();

        if (matchesData) {
            const updates: Record<string, any> = {};
            Object.keys(matchesData).forEach(key => {
                const match = matchesData[key] as Match;
                if (match.category === category && match.group === groupName) {
                    updates[key] = null;
                }
            });
            await update(ref(db, MATCHES_PATH), updates);
        }
    }
};
