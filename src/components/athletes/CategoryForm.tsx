import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { categoryService, GlobalCategory } from "@/services/categoryService";
import { Loader2, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    name: z.string().min(1, "Nome da categoria é obrigatório").toUpperCase(),
});

interface CategoryFormProps {
    onSuccess?: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<GlobalCategory[]>([]);

    useEffect(() => {
        const unsubscribe = categoryService.subscribe((cats) => {
            setCategories(cats);
        });
        return () => unsubscribe();
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            await categoryService.create(values.name);
            toast.success("Categoria adicionada com sucesso!");
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Erro ao adicionar categoria.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await categoryService.delete(id);
            toast.success("Categoria removida com sucesso!");
        } catch (error) {
            toast.error("Erro ao remover categoria.");
        }
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nova Categoria</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: MASTER, PRO, A..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Adicionar Categoria"
                        )}
                    </Button>
                </form>
            </Form>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Categorias Atuais</h4>
                    <span className="text-xs text-muted-foreground">{categories.length} categorias</span>
                </div>
                <Separator />
                <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-2">
                        {categories.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">Nenhuma categoria global cadastrada.</p>
                        ) : (
                            categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(cat.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
