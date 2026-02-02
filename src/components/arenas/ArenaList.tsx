import { useEffect, useState } from "react";
import { Arena } from "@/types/beach-tennis";
import { arenaService } from "@/services/arenaService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArenaForm } from "./ArenaForm";

export function ArenaList() {
    const [arenas, setArenas] = useState<Arena[]>([]);

    useEffect(() => {
        const unsubscribe = arenaService.subscribe((data) => {
            setArenas(data);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await arenaService.delete(id);
            toast.success("Arena removida.");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover arena.");
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Localização</TableHead>
                        <TableHead>Quadras</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {arenas.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhuma arena cadastrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        arenas.map((arena) => (
                            <TableRow key={arena.id}>
                                <TableCell className="font-medium">{arena.name}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {arena.location && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {arena.location}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                                        {arena.courts?.length || 0} quadras
                                    </span>
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar Arena</DialogTitle>
                                            </DialogHeader>
                                            <ArenaForm initialData={arena} onSuccess={() => document.getElementById('close-dialog-arena')?.click()} />
                                        </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação excluirá a arena <span className="font-bold">{arena.name}</span>.
                                                    <br />
                                                    Isso não afetará torneios passados que já copiaram esta estrutura.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(arena.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
