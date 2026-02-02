import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tournamentService } from "@/services/tournamentService";
import { courtService } from "@/services/courtService";
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
import { Plus, LogOut, Calendar, MapPin, Trophy, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
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

const formSchema = z.object({
  name: z.string().min(3, "Nome do evento deve ter pelo menos 3 caracteres"),
  date: z.string().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) >= today;
  }, "A data deve ser hoje ou no futuro."),
  location: z.string().optional(),
  importCourts: z.boolean().default(false),
});

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [open, setOpen] = useState(false);
  const [matchingCourtsCount, setMatchingCourtsCount] = useState<number>(0);
  const [previousTournamentId, setPreviousTournamentId] = useState<string | null>(null);

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
      location: "",
      importCourts: false,
    },
  });

  // Function to open create dialog
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    form.reset({
      name: "",
      date: "",
      location: "",
      importCourts: false,
    });
    setOpen(true);
  };

  // Function to open edit dialog
  const handleEdit = (tournament: Tournament) => {
    setIsEditing(true);
    setEditingId(tournament.id);
    form.reset({
      name: tournament.name,
      date: tournament.date,
      location: tournament.location || "",
      importCourts: false, // Don't show import on edit
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

  // Watch location changes to suggest imports
  const locationWatch = form.watch("location");

  useEffect(() => {
    const checkLocationHistory = async () => {
      if (!locationWatch || isEditing) { // Skip logic if editing
        setMatchingCourtsCount(0);
        setPreviousTournamentId(null);
        return;
      }

      // Find most recent tournament at this location
      // Sort by date descending
      const sameLocation = tournaments
        .filter(t => t.location?.toLowerCase() === locationWatch.toLowerCase())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sameLocation.length > 0) {
        const lastTournament = sameLocation[0];
        try {
          const courts = await courtService.getByTournamentOnce(lastTournament.id);
          if (courts.length > 0) {
            setMatchingCourtsCount(courts.length);
            setPreviousTournamentId(lastTournament.id);
            // Auto-check if found
            form.setValue("importCourts", true);
          } else {
            setMatchingCourtsCount(0);
            setPreviousTournamentId(null);
          }
        } catch (e) {
          console.error("Error checking history", e);
        }
      } else {
        setMatchingCourtsCount(0);
        setPreviousTournamentId(null);
      }
    };

    const timer = setTimeout(checkLocationHistory, 500); // Debounce
    return () => clearTimeout(timer);
  }, [locationWatch, tournaments, form, isEditing]);

  useEffect(() => {
    const unsubscribe = tournamentService.subscribe(setTournaments);
    return () => unsubscribe();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing && editingId) {
        // UPDATE MODE
        await tournamentService.update(editingId, {
          name: values.name,
          date: values.date,
          location: values.location,
        });
        toast.success("Torneio atualizado!");
      } else {
        // CREATE MODE
        const newTournamentRef = await tournamentService.create({
          name: values.name,
          date: values.date,
          location: values.location,
        } as Omit<Tournament, "id" | "createdAt" | "status">);

        // Handle Import
        if (values.importCourts && previousTournamentId && matchingCourtsCount > 0) {
          const oldCourts = await courtService.getByTournamentOnce(previousTournamentId);

          // Clone courts
          const promises = oldCourts.map(court => courtService.create({
            name: court.name,
            tournamentId: newTournamentRef,
            pin: court.pin
          }));

          await Promise.all(promises);
          toast.success(`Torneio criado e ${oldCourts.length} quadras importadas!`);
        } else {
          toast.success("Torneio criado com sucesso!");
        }
      }

      setOpen(false);
      form.reset();
      setMatchingCourtsCount(0);
      setPreviousTournamentId(null);
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
                  {isEditing ? "Atualize as informações do evento." : "Crie um novo evento para começar a gerenciar."}
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

                  {!isEditing && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Arena Beach Club"
                                {...field}
                                list="locations-list" // HTML5 simple autocomplete
                              />
                            </FormControl>
                            <datalist id="locations-list">
                              {Array.from(new Set(tournaments.map(t => t.location).filter(Boolean))).map(loc => (
                                <option key={loc} value={loc as string} />
                              ))}
                            </datalist>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {matchingCourtsCount > 0 && (
                        <FormField
                          control={form.control}
                          name="importCourts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 mt-1"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Importar Quadras ({matchingCourtsCount})</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Encontramos {matchingCourtsCount} quadras usadas anteriormente neste local. Deseja copiá-las para este novo torneio?
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Arena Beach Club"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">{tournament.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tournament.date).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    {/* Actions Menu */}
                    {(tournament.status === 'planning' || new Date(tournament.date) > new Date()) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tournament)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteRequest(tournament.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
