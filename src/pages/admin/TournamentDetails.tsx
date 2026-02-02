import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { courtService } from "@/services/courtService";
import { Court } from "@/types/beach-tennis";
import { toast } from "sonner";
import { AthleteList } from "@/components/athletes/AthleteList";
import { AthleteForm } from "@/components/athletes/AthleteForm";

const courtSchema = z.object({
    name: z.string().min(2, "Nome da quadra deve ter pelo menos 2 caracteres"),
});

export default function TournamentDetails() {
    const { id } = useParams();
    const [courts, setCourts] = useState<Court[]>([]);
    const [open, setOpen] = useState(false);

    // Generate a random 4-digit PIN
    const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

    const form = useForm<z.infer<typeof courtSchema>>({
        resolver: zodResolver(courtSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        if (id) {
            const unsubscribe = courtService.subscribeByTournament(id, setCourts);
            return () => unsubscribe();
        }
    }, [id]);

    const onSubmit = async (values: z.infer<typeof courtSchema>) => {
        if (!id) return;

        try {
            await courtService.create({
                name: values.name,
                tournamentId: id,
                pin: generatePin(),
            });
            toast.success("Quadra criada com sucesso!");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Erro ao criar quadra");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">Gerenciar Torneio</h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <Tabs defaultValue="courts" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="courts">Quadras</TabsTrigger>
                        <TabsTrigger value="athletes">Atletas</TabsTrigger>
                        <TabsTrigger value="matches">Partidas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="courts">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle>Quadras do Torneio</CardTitle>
                                    <CardDescription>
                                        Crie quadras e gere PINs para os árbitros.
                                    </CardDescription>
                                </div>

                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Nova Quadra
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Nova Quadra</DialogTitle>
                                            <DialogDescription>
                                                Crie uma nova quadra para este torneio. O PIN será gerado automaticamente.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nome da Quadra</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: Quadra 1 (Central)" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="submit" className="w-full">
                                                    Criar Quadra
                                                </Button>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {courts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <p>Nenhuma quadra criada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                                        {courts.map((court) => (
                                            <div key={court.id} className="flex flex-col justify-between rounded-lg border p-4 shadow-sm">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-lg">{court.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                                                        <QrCode className="h-4 w-4" />
                                                        <span>PIN do Árbitro:</span>
                                                        <span className="font-mono font-bold text-foreground text-lg">{court.pin}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex gap-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        Status: <span className="font-medium capitalize">{court.status.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="athletes">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle>Base de Atletas</CardTitle>
                                    <CardDescription>
                                        Cadastre os atletas que participarão dos jogos.
                                    </CardDescription>
                                </div>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Novo Atleta
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Novo Atleta</DialogTitle>
                                            <DialogDescription>
                                                Adicione um novo jogador à base de dados.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <AthleteForm onSuccess={() => setOpen(false)} />
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <AthleteList />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="matches">
                        <div className="p-4 text-center text-muted-foreground">Em breve (Sprint 4)</div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
