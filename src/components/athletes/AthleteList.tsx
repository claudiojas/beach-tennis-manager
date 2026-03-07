import { useEffect, useState } from "react";
import { Player } from "@/types/beach-tennis";
import { athleteService } from "@/services/athleteService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { AthleteForm } from "./AthleteForm";

export function AthleteList() {
    const [athletes, setAthletes] = useState<Player[]>([]);
    const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const unsubscribe = athleteService.subscribe((data) => {
            setAthletes(data);
            // Reset to first page when data changes (e.g. after search or seed)
            setCurrentPage(1);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await athleteService.delete(id);
            toast.success("Atleta removido.");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover atleta.");
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(athletes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAthletes = athletes.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-b border-muted/20">
                            <TableHead className="w-16 h-12 text-[10px] uppercase font-black tracking-widest px-6">ID</TableHead>
                            <TableHead className="h-12 text-[10px] uppercase font-black tracking-widest">Nome</TableHead>
                            <TableHead className="h-12 text-[10px] uppercase font-black tracking-widest">Categoria</TableHead>
                            <TableHead className="hidden md:table-cell h-12 text-[10px] uppercase font-black tracking-widest">Telefone</TableHead>
                            <TableHead className="text-right h-12 text-[10px] uppercase font-black tracking-widest px-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentAthletes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic font-medium uppercase text-[10px] tracking-widest opacity-40">
                                    Nenhum atleta cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentAthletes.map((athlete) => (
                                <TableRow key={athlete.id} className="border-b border-muted/10 hover:bg-primary/5 transition-colors group">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground px-6 py-4">
                                        {athlete.registrationNumber || "--"}
                                    </TableCell>
                                    <TableCell className="font-bold text-sm py-4">{athlete.name}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(athlete.categories || (athlete.category ? [athlete.category] : [])).map(cat => (
                                                <Badge key={cat} variant="secondary" className="text-[9px] font-black uppercase py-0 px-2 tracking-tighter bg-primary/5 text-primary border-primary/10">
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell py-4 text-xs font-medium text-muted-foreground">{athlete.phone || "-"}</TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            <Dialog
                                                open={editingAthleteId === athlete.id}
                                                onOpenChange={(isOpen) => setEditingAthleteId(isOpen ? athlete.id : null)}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="rounded-[28px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Editar Atleta</DialogTitle>
                                                    </DialogHeader>
                                                    <AthleteForm initialData={athlete} onSuccess={() => setEditingAthleteId(null)} />
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[28px]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-black uppercase tracking-tight">Tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-xs font-medium">
                                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o atleta
                                                            <span className="font-bold text-foreground"> {athlete.name}</span>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(athlete.id)}
                                                            className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-black uppercase text-[10px] tracking-widest h-11"
                                                        >
                                                            Excluir Atleta
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, athletes.length)} de {athletes.length} atletas
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-muted/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-muted/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center justify-center min-w-[32px] h-9 bg-primary/10 rounded-xl text-primary text-xs font-black shadow-inner shadow-primary/5 border border-primary/20">
                            {currentPage}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-muted/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-muted/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
