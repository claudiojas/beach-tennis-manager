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
import { Plus, Trash2 } from "lucide-react";

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

            if (initialData) {
                await arenaService.update(initialData.id, {
                    name: values.name,
                    location: values.location,
                    courts: courtsWithIds,
                });
                toast.success("Arena atualizada com sucesso!");
            } else {
                await arenaService.create({
                    name: values.name,
                    location: values.location,
                    courts: courtsWithIds,
                });
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Arena</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Arena Beach Club" {...field} />
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
                                <Input placeholder="Ex: Av. Atlântica, 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <FormLabel>Quadras Fixas</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: `Quadra ${fields.length + 1}` })}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Quadra
                        </Button>
                    </div>
                    <FormDescription>
                        Defina a estrutura padrão de quadras desta arena.
                    </FormDescription>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <FormField
                                    control={form.control}
                                    name={`courts.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1 space-y-0">
                                            <FormControl>
                                                <Input {...field} placeholder="Nome da quadra" />
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
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    {form.formState.errors.courts && (
                        <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.courts.message}
                        </p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Cadastrar Arena")}
                </Button>
            </form>
        </Form>
    );
}
