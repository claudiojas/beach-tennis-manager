import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ArenaList } from "@/components/arenas/ArenaList";
import { ArenaForm } from "@/components/arenas/ArenaForm";
import { useState } from "react";

export default function GlobalArenas() {
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
                        <MapPin className="h-6 w-6 text-primary" />
                        Gestão de Arenas
                    </h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4 sm:pb-2">
                        <div className="space-y-1 text-center sm:text-left">
                            <CardTitle>Base Global de Arenas</CardTitle>
                            <CardDescription>
                                Cadastre seus locais e defina a estrutura fixa de quadras.
                            </CardDescription>
                        </div>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Arena
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova Arena</DialogTitle>
                                    <DialogDescription>
                                        Cadastre um novo local e suas quadras.
                                    </DialogDescription>
                                </DialogHeader>
                                <ArenaForm onSuccess={() => setOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <ArenaList />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
