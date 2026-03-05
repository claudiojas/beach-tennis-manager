import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { athleteService } from "@/services/athleteService";
import { useState } from "react";
import { Category, Player, TOURNAMENT_CATEGORIES } from "@/types/beach-tennis";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    phone: z.string().optional(),
    categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
    registrationNumber: z.string().optional(),
});

interface AthleteFormProps {
    onSuccess?: () => void;
    initialData?: Player;
}

export function AthleteForm({ onSuccess, initialData }: AthleteFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCatInput, setCustomCatInput] = useState("");

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            categories: initialData?.categories || (initialData?.category ? [initialData.category] : []),
            registrationNumber: initialData?.registrationNumber || "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const primaryCategory = values.categories[0]; // Fallback for backward compatibility

            if (initialData) {
                await athleteService.update(initialData.id, {
                    name: values.name,
                    phone: values.phone,
                    category: primaryCategory as Category,
                    categories: values.categories as Category[],
                    registrationNumber: values.registrationNumber,
                });
                toast.success("Atleta atualizado com sucesso!");
            } else {
                await athleteService.create({
                    name: values.name,
                    phone: values.phone,
                    category: primaryCategory as Category,
                    categories: values.categories as Category[],
                    registrationNumber: values.registrationNumber,
                });
                toast.success("Atleta cadastrado com sucesso!");
            }

            form.reset();
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error(initialData ? "Erro ao atualizar atleta." : "Erro ao cadastrar atleta.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddCategory = (cat: string) => {
        const current = form.getValues("categories");
        if (cat && !current.includes(cat.toUpperCase())) {
            form.setValue("categories", [...current, cat.toUpperCase()], { shouldValidate: true });
        }
        setIsCustomCategory(false);
        setCustomCatInput("");
    };

    const handleRemoveCategory = (catToRemove: string) => {
        const current = form.getValues("categories");
        form.setValue("categories", current.filter(c => c !== catToRemove), { shouldValidate: true });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: João da Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone (WhatsApp)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 11 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categorias</FormLabel>

                            {/* Selected Categories Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(cat => (
                                    <Badge key={cat} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                        {cat}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="ml-1 cursor-pointer hover:bg-muted p-0.5 rounded-full"
                                            onClick={() => handleRemoveCategory(cat)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRemoveCategory(cat);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </Badge>
                                ))}
                                {field.value.length === 0 && (
                                    <span className="text-sm text-muted-foreground italic">Nenhuma categoria selecionada</span>
                                )}
                            </div>

                            {/* Category Selector */}
                            {!isCustomCategory ? (
                                <Select
                                    onValueChange={(val) => {
                                        if (val === "CUSTOM") {
                                            setIsCustomCategory(true);
                                        } else {
                                            handleAddCategory(val);
                                        }
                                    }}
                                    value={""} // Reset visual value after selection so they can select again
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Adicionar categoria à lista..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TOURNAMENT_CATEGORIES.filter(cat => !field.value.includes(cat)).map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                        <SelectItem value="CUSTOM">+ Nova Categoria Personalizada</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="Digite o nome da categoria..."
                                            value={customCatInput}
                                            onChange={(e) => setCustomCatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategory(customCatInput);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <Button type="button" variant="secondary" onClick={() => handleAddCategory(customCatInput)}>
                                        Adicionar
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCustomCategory(false); setCustomCatInput(""); }}>
                                        Voltar
                                    </Button>
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Inscrição (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 01 (Deixe vazio para gerar auto)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Cadastrar Atleta")}
                </Button>
            </form>
        </Form>
    );
}
