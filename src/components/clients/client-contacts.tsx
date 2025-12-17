"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Mail, Phone, User, Star, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { contactFormSchema, type ContactFormValues } from "@/lib/validators/client-crm";
import { Checkbox } from "@/components/ui/checkbox";

interface ClientContactsProps {
    clientId: string;
}

export function ClientContacts({ clientId }: ClientContactsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingContact, setEditingContact] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createSupabaseBrowserClient();

    const { data: contacts, isLoading } = useQuery({
        queryKey: ["client-contacts", clientId],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("client_contacts") as any)
                .select("*")
                .eq("client_id", clientId)
                .order("is_primary", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            role: "",
            is_primary: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: ContactFormValues) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_contacts") as any).insert({
                client_id: clientId,
                ...values,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
            toast({ title: "Contact added" });
            setIsDialogOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: ContactFormValues) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_contacts") as any)
                .update(values)
                .eq("id", editingContact.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
            toast({ title: "Contact updated" });
            setIsDialogOpen(false);
            setEditingContact(null);
            form.reset();
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_contacts") as any).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
            toast({ title: "Contact deleted" });
        },
    });

    const onSubmit = (values: ContactFormValues) => {
        if (editingContact) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (contact: any) => {
        setEditingContact(contact);
        form.reset({
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            email: contact.email || "",
            phone: contact.phone || "",
            role: contact.role || "",
            is_primary: contact.is_primary || false,
        });
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingContact(null);
        form.reset({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            role: "",
            is_primary: false,
        });
        setIsDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>Manage people associated with this client</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                            <DialogDescription>
                                {editingContact ? "Update contact details." : "Add a new person to this client."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. PM, Accounting" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="is_primary"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Primary Contact</FormLabel>
                                                <CardDescription>
                                                    Set as the main point of contact for this client.
                                                </CardDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">{editingContact ? "Save Changes" : "Create Contact"}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading contacts...</div>
                ) : contacts?.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                        No contacts added yet.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {contacts?.map((contact: any) => (
                            <div
                                key={contact.id}
                                className="relative flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="absolute right-2 top-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    if (confirm("Delete this contact?")) deleteMutation.mutate(contact.id);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mb-4 flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">
                                                {contact.first_name} {contact.last_name}
                                            </h3>
                                            {contact.is_primary && (
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{contact.role || "No role"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <a href={`mailto:${contact.email} `} className="hover:underline">
                                                {contact.email}
                                            </a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
