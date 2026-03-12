import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { arenaService } from "@/services/arenaService";
import { useState } from "react";
import { Arena } from "@/types/beach-tennis";
import { Plus, Trash2, Image as ImageIcon, Loader2, Palmtree } from "lucide-react";
import { SponsorImageEditor } from "@/components/sponsors/SponsorImageEditor";
import { imageProcessor } from "@/utils/imageProcessor";

const formSchema = z.object({
    name: z.string().min(2, "Nome da arena deve ter pelo menos 2 caracteres."),
    location: z.string().optional(),
    courts: z.array(z.object({
        name: z.string().min(1, "Nome da quadra é obrigatório")
    })).min(1, "Adicione pelo menos uma quadra à arena."),
});

interface ArenaFormProps {
    onSuccess?: () => void;
    initialData?: Arena;
}

export function ArenaForm({ onSuccess, initialData }: ArenaFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(initialData?.logoUrl);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            location: initialData?.location || "",
            courts: initialData?.courts.map(c => ({ name: c.name })) || [{ name: "Quadra 1" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "courts",
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Transform courts to include IDs (if new, generate temp ones so we can track them comfortably)
            // Actually, for the template, we just need the names. But the Type requires ID.
            // We can generate random IDs for the template structure.
            const courtsWithIds = values.courts.map(c => ({
                id: Math.random().toString(36).substr(2, 9),
                name: c.name
            }));

            const arenaData = {
                name: values.name,
                location: values.location,
                courts: courtsWithIds,
                logoUrl: logoUrl,
            };

            if (initialData) {
                await arenaService.update(initialData.id, arenaData);
                toast.success("Arena atualizada com sucesso!");
            } else {
                await arenaService.create(arenaData);
                toast.success("Arena cadastrada com sucesso!");
            }

            form.reset();
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar arena.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setIsEditorOpen(true);
        } catch (error) {
            toast.error("Erro ao processar imagem");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogoSave = async (croppedBlob: Blob) => {
        setIsProcessing(true);
        try {
            const compressedFile = await imageProcessor.compress(
                new File([croppedBlob], "logo.png", { type: "image/png" })
            );

            // We need a temp ID if it's new, but usually we update after creation.
            // For simplicity, if it's an update, upload to arena path.
            // If it's new, we'll need to upload to a generic path or wait for create.
            // Let's assume we can upload to a "temp" path or just use a random ID for now.
            const uploadId = initialData?.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
            const downloadUrl = await arenaService.uploadLogo(uploadId, compressedFile);
            setLogoUrl(downloadUrl);

            // Se for edição, salva imediatamente no banco para evitar que o usuário esqueça
            if (initialData) {
                await arenaService.update(initialData.id, { logoUrl: downloadUrl });
            }

            toast.success("Logo processada e salva!");
            setIsEditorOpen(false);
            setImageUrl(null);
        } catch (error) {
            toast.error("Erro ao salvar logo");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Identification & Branding */}
                    <div className="space-y-6">
                        <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-muted/50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">Identificação</h3>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Arena</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Arena Beach Club" {...field} className="bg-background" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endereço / Localização</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Av. Atlântica, 1000" {...field} className="bg-background" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl bg-primary/5 gap-3 border-primary/20">
                            <FormLabel className="text-xs uppercase font-bold tracking-widest self-start mb-1 opacity-70">Logo da Arena</FormLabel>
                            <div className="w-24 h-24 rounded-2xl bg-background flex items-center justify-center overflow-hidden border border-primary/20 shadow-xl relative group">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Palmtree className="text-primary w-10 h-10 opacity-20" />
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="relative h-9 px-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all active:scale-95"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="h-3 w-3 mr-2" />
                                        )}
                                        {logoUrl ? 'Alterar' : 'Logo'}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isProcessing}
                                        />
                                    </Button>

                                    {logoUrl && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-9 px-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all active:scale-95"
                                            disabled={isProcessing}
                                            onClick={() => {
                                                setImageUrl(logoUrl);
                                                setIsEditorOpen(true);
                                            }}
                                        >
                                            <ImageIcon className="h-3.5 w-3.5 mr-2" />
                                            Recortar
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1">PNG transparente recomendado</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Court Structure */}
                    <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-muted/50 flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">Estrutura</h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Quadras Fixas</p>
                            </div>
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="h-8 rounded-full text-[10px] font-bold uppercase tracking-widest px-4 shadow-lg shadow-primary/20"
                                onClick={() => append({ name: `Quadra ${fields.length + 1}` })}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Quadra
                            </Button>
                        </div>

                        <div className="flex-1 space-y-2 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 group/item animate-in slide-in-from-right-2 duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                    <FormField
                                        control={form.control}
                                        name={`courts.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-0">
                                                <FormControl>
                                                    <Input {...field} placeholder="Nome da quadra" className="bg-background border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary h-9" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {form.formState.errors.courts && (
                            <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-2 px-1">
                                {form.formState.errors.courts.message}
                            </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-muted/50 opacity-60">
                            <p className="text-[9px] leading-tight font-medium italic text-muted-foreground">
                                * Estas quadras aparecerão como sugestão ao criar novos torneios nesta arena.
                            </p>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 text-md mt-4 active:scale-[0.98] transition-all" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (initialData ? "Atualizar Arena" : "Confirmar Cadastro")}
                </Button>
            </form>

            {/* Image Editor Modal */}
            {imageUrl && (
                <SponsorImageEditor
                    open={isEditorOpen}
                    onOpenChange={setIsEditorOpen}
                    onSave={handleLogoSave}
                    image={imageUrl}
                    aspectRatio="square"
                />
            )}
        </Form>
    );
}
