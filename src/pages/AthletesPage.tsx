import { AthleteForm } from "@/components/athletes/AthleteForm";
import { AthleteList } from "@/components/athletes/AthleteList";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AthletesPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="text-muted-foreground hover:text-foreground">
                            ← Voltar
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            Gerenciar Atletas
                        </h1>
                    </div>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Atleta
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Cadastrar Novo Atleta</SheetTitle>
                                <SheetDescription>
                                    Preencha os dados abaixo para adicionar um novo jogador ao torneio.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6">
                                <AthleteForm onSuccess={() => setOpen(false)} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Lista de Inscritos</h2>
                    <p className="text-sm text-muted-foreground">Gerencie todos os atletas cadastrados no sistema.</p>
                </div>
                <AthleteList />
            </main>
        </div>
    );
}
