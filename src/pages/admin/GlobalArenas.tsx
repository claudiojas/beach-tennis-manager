import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MapPin, Trophy, Users, Image as ImageIcon } from "lucide-react";
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
        <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
            {/* App Bar - Native Feel */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3 md:px-6">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to="/admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-2">
                        <div className="bg-primary/10 p-1 rounded-md">
                            <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-bold tracking-tighter hidden sm:inline">Beach Tennis</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight border-l pl-4">Arenas</h1>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-4 md:p-6">
                <Card className="rounded-2xl overflow-hidden border-muted/40 shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4 sm:pb-2">
                        <div className="space-y-1 text-center sm:text-left">
                            <CardTitle className="text-xl font-black italic">Locais</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                Estruturas de quadras registradas
                            </CardDescription>
                        </div>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-full shadow-lg shadow-primary/20">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Arena
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl max-w-2xl">
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

            {/* Bottom Navigation for Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t px-6 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <Link to="/admin" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Trophy className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Etapas</span>
                    </Link>
                    <Link to="/admin/athletes" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Users className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Atletas</span>
                    </Link>
                    <Link to="/admin/arenas" className="flex flex-col items-center gap-1 text-primary">
                        <MapPin className="h-6 w-6" />
                        <span className="text-[10px] font-bold">Arenas</span>
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
