import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AthleteList } from "@/components/athletes/AthleteList";
import { AthleteForm } from "@/components/athletes/AthleteForm";
import { useState } from "react";

export default function GlobalAthletes() {
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b bg-card px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Gestão de Atletas
                    </h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4 sm:pb-2">
                        <div className="space-y-1 text-center sm:text-left">
                            <CardTitle>Base Global de Atletas</CardTitle>
                            <CardDescription>
                                Cadastre, edite e gerencie todos os jogadores registrados no sistema.
                            </CardDescription>
                        </div>

                        <Dialog open={open} onOpenChange={setOpen}>
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
                                        Adicione um novo jogador à base global.
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
            </main>
        </div>
    );
}
