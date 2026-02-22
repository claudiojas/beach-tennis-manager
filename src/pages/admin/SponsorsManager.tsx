import { useState, useEffect } from "react";
import { sponsorService } from "@/services/sponsorService";
import { imageProcessor } from "@/utils/imageProcessor";
import { Sponsor } from "@/types/beach-tennis";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Image as ImageIcon, Loader2, Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
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

export default function SponsorsManager() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Estados para o Modal de Exclusão
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsubscribe = sponsorService.subscribeAll(setSponsors);
        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validação de formato (AVIF não é suportado pela IA de remoção de fundo)
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error("Formato não suportado: Use PNG, JPG ou WEBP.");
                e.target.value = ""; // Limpa o input
                return;
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!name || !file) {
            toast.error("Preencha o nome e selecione uma imagem.");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Processamento Inteligente (Remover Fundo + Comprimir)
            toast.info("Processando imagem... Removendo fundo e otimizando.", { duration: 5000 });
            const processedFile = await imageProcessor.processSponsorLogo(file);

            // 2. Upload para o Firebase
            toast.info("Fazendo upload para o servidor...");
            await sponsorService.create(name, processedFile);

            toast.success("Patrocinador adicionado com sucesso!");
            setName("");
            setFile(null);
            setPreviewUrl(null);
        } catch (error: any) {
            console.error(error);
            toast.error(`Erro: ${error.message || "Falha ao processar imagem"}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setSponsorToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!sponsorToDelete) return;

        setIsDeleting(true);
        try {
            await sponsorService.delete(sponsorToDelete);
            toast.success("Patrocinador removido com sucesso!");
        } catch (error) {
            toast.error("Erro ao excluir patrocinador.");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setSponsorToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/admin">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ImageIcon className="h-6 w-6 text-primary" />
                            Gestão de Patrocinadores
                        </h1>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Form Side */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Novo Patrocinador</CardTitle>
                            <CardDescription>
                                Adicione logos com remoção de fundo automática.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome da Marca</label>
                                <Input
                                    placeholder="Ex: Wilson, Adidas..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Logo Original</label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-accent/50 transition-colors relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="max-h-32 mx-auto rounded" />
                                    ) : (
                                        <div className="py-4">
                                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-xs text-muted-foreground">Clique para selecionar</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept=".png,.jpg,.jpeg,.webp"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Nossa IA removerá o fundo e otimizará o peso automaticamente.
                                    </p>
                                    <p className="text-[10px] font-bold text-primary/80">
                                        Formatos recomendados: PNG, JPG, WEBP
                                    </p>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleUpload}
                                disabled={isProcessing || !file || !name}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Salvar Patrocinador
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* List Side */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            Patrocinadores Ativos
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                {sponsors.length}
                            </span>
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {sponsors.map((sponsor) => (
                                <Card key={sponsor.id} className="group relative overflow-hidden bg-slate-900/50">
                                    <CardContent className="p-4 flex flex-col items-center justify-center min-h-[120px]">
                                        <img
                                            src={sponsor.logoUrl}
                                            alt={sponsor.name}
                                            className="max-h-16 w-auto object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-all"
                                        />
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-3 text-muted-foreground group-hover:text-white truncate w-full text-center">
                                            {sponsor.name}
                                        </p>

                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteClick(sponsor.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}

                            {sponsors.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                                    <p className="text-muted-foreground text-sm italic">Nenhum patrocinador cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o patrocinador
                            e removerá o logo de todas as telas de exibição.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
