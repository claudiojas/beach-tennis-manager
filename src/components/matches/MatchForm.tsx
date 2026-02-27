import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { matchService } from "@/services/matchService";
import { athleteService } from "@/services/athleteService";
import { Player, Court, Match } from "@/types/beach-tennis";
import { Loader2, Users, User, CalendarClock, Clock, MapPin, Trophy } from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    matchType: z.enum(["singles", "doubles"]),
    category: z.string().min(1, "Selecione a categoria"),
    player1A: z.string().min(1, "Selecione o jogador 1 da Dupla A"),
    player2A: z.string().optional(),
    player1B: z.string().min(1, "Selecione o jogador 1 da Dupla B"),
    player2B: z.string().optional(),
    courtId: z.string().min(1, "Selecione a quadra para este jogo"),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
}).refine((data) => {
    if (data.matchType === "doubles") {
        return !!data.player2A && !!data.player2B;
    }
    return true;
}, {
    message: "Selecione o segundo jogador para partidas de duplas",
    path: ["matchType"], // General error path
});

interface MatchFormProps {
    tournamentId: string;
    tournamentType: 'Simples' | 'Duplas';
    courts: Court[];
    matches: Match[];
    categories?: string[];
    onSuccess?: () => void;
    initialData?: Match;
}

export function MatchForm({ tournamentId, tournamentType, courts, matches, categories, onSuccess, initialData }: MatchFormProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter courts that are ALREADY taken by another planned or ongoing match
    const occupiedCourtIds = matches
        .filter(m => (m.status === 'planned' || m.status === 'ongoing') && m.id !== initialData?.id)
        .map(m => m.courtId)
        .filter(Boolean);

    const availableCourts = courts.filter(c => !occupiedCourtIds.includes(c.id));

    useEffect(() => {
        const unsubscribe = athleteService.subscribe((data) => {
            setPlayers(data);
            setIsLoadingPlayers(false);
        });
        return () => unsubscribe();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            matchType: initialData
                ? (initialData.teamA.player2 ? "doubles" : "singles")
                : (tournamentType === 'Simples' ? "singles" : "doubles"),
            category: (initialData?.category as string) || "B",
            player1A: initialData?.teamA.player1.id || "",
            player2A: initialData?.teamA.player2?.id || "",
            player1B: initialData?.teamB.player1.id || "",
            player2B: initialData?.teamB.player2?.id || "",
            courtId: initialData?.courtId || "",
            scheduledDate: initialData?.startTime ? new Date(initialData.startTime).toISOString().split('T')[0] : "",
            scheduledTime: initialData?.startTime ? new Date(initialData.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "",
        },
    });

    const matchType = form.watch("matchType");
    const selectedIds = form.watch(["player1A", "player2A", "player1B", "player2B"]);

    // Helper to check if a player is already selected in another slot
    const isPlayerSelected = (playerId: string, currentField: string) => {
        const [p1A, p2A, p1B, p2B] = selectedIds;
        const currentValues = { player1A: p1A, player2A: p2A, player1B: p1B, player2B: p2B };

        // Remove current field from check
        const { [currentField as keyof typeof currentValues]: _, ...otherValues } = currentValues;

        return Object.values(otherValues).includes(playerId);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.matchType === "doubles" && (!values.player2A || !values.player2B)) {
            toast.error("Selecione todos os jogadores para duplas.");
            return;
        }

        // Validation: Check for duplicates manually just in case
        const currentSelectedIds = [values.player1A, values.player2A, values.player1B, values.player2B].filter(Boolean);
        const uniquePlayers = new Set(currentSelectedIds);
        if (currentSelectedIds.length !== uniquePlayers.size) {
            toast.error("Um jogador não pode ser selecionado mais de uma vez.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Helper to get full player object
            const getPlayer = (id: string) => players.find(p => p.id === id)!;

            // Construct payload manually to avoid 'undefined' which Firebase rejects
            const payload: any = {
                tournamentId,
                category: values.category,
                teamA: {
                    player1: getPlayer(values.player1A),
                },
                teamB: {
                    player1: getPlayer(values.player1B),
                },
                courtId: values.courtId || null,
                startTime: (values.scheduledDate && values.scheduledTime)
                    ? new Date(`${values.scheduledDate}T${values.scheduledTime}`).getTime()
                    : initialData?.startTime || null,
                // PROFESSIONAL SCORING INITIALIZATION
                setsA: initialData?.setsA ?? 0,
                setsB: initialData?.setsB ?? 0,
                pointsA: initialData?.pointsA ?? 0,
                pointsB: initialData?.pointsB ?? 0,
                historySets: initialData?.historySets ?? [],
                serving: initialData?.serving ?? 'teamA',
            };

            // Only attach player2 if it exists (for doubles)
            if (values.player2A) {
                payload.teamA.player2 = getPlayer(values.player2A);
            }
            if (values.player2B) {
                payload.teamB.player2 = getPlayer(values.player2B);
            }

            if (initialData) {
                await matchService.update(initialData.id, payload);
                toast.success("Partida atualizada com sucesso!");
            } else {
                await matchService.create(payload);
                toast.success("Partida criada com sucesso!");
            }

            form.reset({
                matchType: "doubles",
                player1A: "",
                player2A: "",
                player1B: "",
                player2B: "",
                courtId: "",
                scheduledDate: "",
                scheduledTime: "",
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao salvar partida:", error);
            toast.error("Erro ao salvar partida. Verifique o console.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingPlayers) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    if (players.length < 2) {
        return <div className="text-center p-4 text-muted-foreground">Cadastre pelo menos 2 atletas para criar uma partida.</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg border">
                    <FormField
                        control={form.control}
                        name="courtId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Quadra
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a quadra..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableCourts.length === 0 && (
                                            <div className="p-4 text-xs text-muted-foreground text-center">
                                                Nenhuma quadra disponível momento. <br /> Libere um jogo para reutilizar o local.
                                            </div>
                                        )}
                                        {availableCourts.map((court) => (
                                            <SelectItem key={court.id} value={court.id}>
                                                {court.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" /> Categoria
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(categories && categories.length > 0) ? (
                                            categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="Pro">Profissional (Pro)</SelectItem>
                                                <SelectItem value="A">Categoria A</SelectItem>
                                                <SelectItem value="B">Categoria B</SelectItem>
                                                <SelectItem value="C">Categoria C</SelectItem>
                                                <SelectItem value="Iniciante">Iniciante</SelectItem>
                                                <SelectItem value="Mista">Mista</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4" /> Data
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="scheduledTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Hora
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de Partida</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="doubles" />
                                        </FormControl>
                                        <Label className="font-normal flex items-center gap-1 cursor-pointer">
                                            <Users className="h-4 w-4" /> Duplas (2v2)
                                        </Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="singles" />
                                        </FormControl>
                                        <Label className="font-normal flex items-center gap-1 cursor-pointer">
                                            <User className="h-4 w-4" /> Simples (1v1)
                                        </Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team A */}
                    <div className="space-y-4 p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
                        <h4 className="font-semibold text-red-600 dark:text-red-400">{matchType === 'doubles' ? 'Dupla A' : 'Jogador A'}</h4>
                        <FormField
                            control={form.control}
                            name="player1A"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jogador 1</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {players.map(p => (
                                                <SelectItem key={p.id} value={p.id} disabled={isPlayerSelected(p.id, "player1A")}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {matchType === 'doubles' && (
                            <FormField
                                control={form.control}
                                name="player2A"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jogador 2</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {players.map(p => (
                                                    <SelectItem key={p.id} value={p.id} disabled={isPlayerSelected(p.id, "player2A")}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {/* Team B */}
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400">{matchType === 'doubles' ? 'Dupla B' : 'Jogador B'}</h4>
                        <FormField
                            control={form.control}
                            name="player1B"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jogador 1</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {players.map(p => (
                                                <SelectItem key={p.id} value={p.id} disabled={isPlayerSelected(p.id, "player1B")}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {matchType === 'doubles' && (
                            <FormField
                                control={form.control}
                                name="player2B"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jogador 2</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {players.map(p => (
                                                    <SelectItem key={p.id} value={p.id} disabled={isPlayerSelected(p.id, "player2B")}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Criando Partida..." : initialData ? "Salvar Alterações" : "Criar Partida"}
                </Button>
            </form>
        </Form>
    );
}
