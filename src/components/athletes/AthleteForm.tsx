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

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    phone: z.string().optional(),
    category: z.string().min(1, "Selecione uma categoria"),
    registrationNumber: z.string().optional(),
});

interface AthleteFormProps {
    onSuccess?: () => void;
    initialData?: Player;
}

export function AthleteForm({ onSuccess, initialData }: AthleteFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            category: initialData?.category || "C",
            registrationNumber: initialData?.registrationNumber || "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (initialData) {
                await athleteService.update(initialData.id, {
                    name: values.name,
                    phone: values.phone,
                    category: values.category as Category,
                    registrationNumber: values.registrationNumber,
                });
                toast.success("Atleta atualizado com sucesso!");
            } else {
                await athleteService.create({
                    name: values.name,
                    phone: values.phone,
                    category: values.category as Category,
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
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {TOURNAMENT_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
