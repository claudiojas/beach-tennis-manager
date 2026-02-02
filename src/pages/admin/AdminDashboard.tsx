import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tournamentService } from "@/services/tournamentService";
import { courtService } from "@/services/courtService";
import { arenaService } from "@/services/arenaService";
import { Tournament, Arena } from "@/types/beach-tennis";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, Calendar, MapPin, Trophy, MoreVertical, Pencil, Trash2, Users, Clock, PlayCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(3, "Nome do evento deve ter pelo menos 3 caracteres"),
  date: z.string().refine((date) => {
    if (!date) return false;
    const [year, month, day] = date.split('-').map(Number);
    const inputDate = new Date(year, month - 1, day); // Create local date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Local midnight
    return inputDate >= today;
  }, "A data deve ser hoje ou no futuro."),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido."),
  arenaId: z.string().min(1, "Selecione uma arena."),
});

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [open, setOpen] = useState(false);

  // Edit/Delete State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: "",
      time: "08:00",
      arenaId: "",
    },
  });

  // Load Arenas
  useEffect(() => {
    const fetchArenas = async () => {
      const data = await arenaService.getAllOnce();
      setArenas(data);
    };
    fetchArenas();
  }, [open]); // Refresh when dialog opens

  // Function to open create dialog
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    form.reset({
      name: "",
      date: "",
      time: "08:00",
      arenaId: "",
    });
    setOpen(true);
  };

  // Function to open edit dialog
  const handleEdit = (tournament: Tournament) => {
    setIsEditing(true);
    setEditingId(tournament.id);

    // Find arena by name (heuristic, since we used to save location name)
    const matchArena = arenas.find(a => a.name === tournament.location);

    form.reset({
      name: tournament.name,
      date: tournament.date,
      time: tournament.time || "08:00",
      arenaId: matchArena ? matchArena.id : "",
    });
    setOpen(true);
  };

  // Function to request delete
  const handleDeleteRequest = (id: string) => {
    setTournamentToDelete(id);
    setAlertOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (tournamentToDelete) {
      await tournamentService.delete(tournamentToDelete);
      toast.success("Torneio excluído com sucesso.");
      setAlertOpen(false);
      setTournamentToDelete(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Tournament['status']) => {
    try {
      await tournamentService.update(id, { status: newStatus });
      toast.success("Status atualizado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'planning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Planejado</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 border-green-600">Em Andamento</Badge>;
      case 'finished':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const selectedArenaId = form.watch("arenaId");
  const selectedArena = arenas.find(a => a.id === selectedArenaId);

  useEffect(() => {
    const unsubscribe = tournamentService.subscribe(setTournaments);
    return () => unsubscribe();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const arena = arenas.find(a => a.id === values.arenaId);
      if (!arena) {
        toast.error("Arena inválida.");
        return;
      }

      const locationName = arena.name;

      if (isEditing && editingId) {
        // UPDATE MODE
        await tournamentService.update(editingId, {
          name: values.name,
          date: values.date,
          time: values.time,
          location: locationName,
        });
        toast.success("Torneio atualizado!");
      } else {
        // CREATE MODE
        const newTournamentRef = await tournamentService.create({
          name: values.name,
          date: values.date,
          time: values.time,
          location: locationName,
          status: 'planning', // Explicitly set initial status
        } as Omit<Tournament, "id" | "createdAt">);

        // Auto-create courts from Arena template
        if (arena.courts && arena.courts.length > 0) {
          const promises = arena.courts.map(court => courtService.create({
            name: court.name,
            tournamentId: newTournamentRef,
            pin: Math.floor(1000 + Math.random() * 9000).toString() // Generate random PIN
          }));

          await Promise.all(promises);
          toast.success(`Torneio criado e ${arena.courts.length} quadras configuradas!`);
        } else {
          toast.success("Torneio criado (sem quadras configuradas na arena).");
        }
      }

      setOpen(false);
      form.reset();
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Erro ao atualizar torneio" : "Erro ao criar torneio");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/admin/athletes">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Atletas</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gerencie a base global de jogadores.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/arenas">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Arenas e Quadras</CardTitle>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gerencie locais e layouts de quadra.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
            <p className="text-muted-foreground">Selecione um torneio para gerenciar ou crie um novo.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Torneio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Torneio" : "Novo Torneio"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Atualize as informações do evento." : "Crie um novo evento selecionando a Arena."}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="arenaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local / Arena</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a Arena" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {arenas.map((arena) => (
                              <SelectItem key={arena.id} value={arena.id}>
                                {arena.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedArena && (
                          <FormDescription>
                            Ao criar, serão geradas <strong>{selectedArena.courts.length} quadras</strong> automaticamente.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isEditing && selectedArena && selectedArena.courts.length > 0 && (
                    <div className="rounded-md border bg-muted/50 p-3 text-sm">
                      <p className="font-semibold mb-2">Estrutura que será criada:</p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {selectedArena.courts.map((court, i) => (
                          <li key={i}>{court.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    {isEditing ? "Salvar Alterações" : "Criar Torneio"}
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
              <Card key={tournament.id} className="hover:shadow-md transition-all group relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="mb-2">
                        {getStatusBadge(tournament.status)}
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors text-xl">{tournament.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tournament.date).toLocaleDateString('pt-BR')}
                        {tournament.time && (
                          <span className="flex items-center gap-1 ml-2">
                            <Clock className="h-3 w-3" />
                            {tournament.time}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Standard Actions */}
                        {(tournament.status === 'planning' || tournament.status === 'active') && (
                          <DropdownMenuItem onClick={() => handleEdit(tournament)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}

                        {/* Status Actions */}
                        {tournament.status === 'planning' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(tournament.id, 'active')}>
                            <PlayCircle className="mr-2 h-4 w-4 text-green-600" />
                            Iniciar Torneio
                          </DropdownMenuItem>
                        )}

                        {tournament.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(tournament.id, 'finished')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                            Finalizar
                          </DropdownMenuItem>
                        )}

                        {tournament.status !== 'finished' && tournament.status !== 'cancelled' && (
                          <DropdownMenuItem
                            className="text-orange-600 focus:text-orange-600"
                            onClick={() => handleStatusChange(tournament.id, 'cancelled')}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        )}

                        {/* Delete - Only if not active/finished (or allow if cancelled) */}
                        {(tournament.status === 'planning' || tournament.status === 'cancelled') && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteRequest(tournament.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {tournament.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                      <MapPin className="h-3 w-3" />
                      {tournament.location}
                    </p>
                  )}
                  <Button variant="secondary" className="w-full" asChild>
                    <Link to={`/admin/tournament/${tournament.id}`}>Gerenciar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o torneio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
