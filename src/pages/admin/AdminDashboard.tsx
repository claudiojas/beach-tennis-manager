import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tournamentService } from "@/services/tournamentService";
import { Tournament } from "@/types/beach-tennis";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, Calendar, MapPin, Trophy } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nome do evento deve ter pelo menos 3 caracteres"),
  date: z.string().min(1, "Data é obrigatória"),
  location: z.string().optional(),
});

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: "",
      location: "",
    },
  });

  useEffect(() => {
    const unsubscribe = tournamentService.subscribe(setTournaments);
    return () => unsubscribe();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await tournamentService.create(values as Omit<Tournament, "id" | "createdAt" | "status">);
      toast.success("Torneio criado com sucesso!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao criar torneio");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Meus Torneios
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Início</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
            <p className="text-muted-foreground">Selecione um torneio para gerenciar ou crie um novo.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Torneio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Torneio</DialogTitle>
                <DialogDescription>
                  Crie um novo evento para começar a gerenciar.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Evento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Open de Verão 2026" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Evento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Arena Beach Club" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Criar Torneio
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum torneio encontrado</h3>
            <p className="mb-4 text-muted-foreground max-w-sm">
              Crie seu primeiro torneio para começar a gerenciar duplas e partidas.
            </p>
            <Button onClick={() => setOpen(true)}>Criar Agora</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-md transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">{tournament.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(tournament.date).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                      <MapPin className="h-3 w-3" />
                      {tournament.location}
                    </p>
                  )}
                  <Button variant="secondary" className="w-full">
                    Gerenciar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
