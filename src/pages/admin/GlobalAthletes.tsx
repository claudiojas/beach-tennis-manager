import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Users, Trophy, MapPin, Image as ImageIcon } from "lucide-react";
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
import { CategoryForm } from "@/components/athletes/CategoryForm";
import { useState } from "react";

export default function GlobalAthletes() {
    const [openAthlete, setOpenAthlete] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
            {/* App Bar - Native Feel */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3 md:px-6">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to="/admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-bold tracking-tight">Atletas</h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-4 md:p-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4 sm:pb-2">
                        <div className="space-y-1 text-center sm:text-left">
                            <CardTitle>Base Global de Atletas</CardTitle>
                            <CardDescription>
                                Cadastre, edite e gerencie todos os jogadores registrados no sistema.
                            </CardDescription>
                        </div>

                        <div className="flex gap-2">
                            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Categorias
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Gerenciar Categorias</DialogTitle>
                                        <DialogDescription>
                                            Adicione ou remova categorias que poderão ser selecionadas por qualquer atleta.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <CategoryForm onSuccess={() => setOpenCategory(false)} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openAthlete} onOpenChange={setOpenAthlete}>
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
                                    <AthleteForm onSuccess={() => setOpenAthlete(false)} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AthleteList />
                    </CardContent>
                </Card>
            </main>
            {/* Bottom Navigation for Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t px-6 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <Link to="/admin" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Trophy className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Etapas</span>
                    </Link>
                    <Link to="/admin/athletes" className="flex flex-col items-center gap-1 text-primary">
                        <Users className="h-6 w-6" />
                        <span className="text-[10px] font-bold">Atletas</span>
                    </Link>
                    <Link to="/admin/arenas" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <MapPin className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Arenas</span>
                    </Link>
                    <Link to="/admin/sponsors" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Ads</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
