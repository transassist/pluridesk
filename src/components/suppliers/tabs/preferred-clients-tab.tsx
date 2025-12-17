"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Users, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";

interface PreferredClientsTabProps {
    supplierId: string;
}

export function PreferredClientsTab({ supplierId }: PreferredClientsTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const [open, setOpen] = useState(false);

    // Fetch Linked Clients
    const { data: linkedClients, isLoading: isLoadingLinked } = useQuery({
        queryKey: ["supplier-preferred-clients", supplierId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("supplier_preferred_clients")
                .select(`
          id,
          client_id,
          clients (
            id,
            name,
            email
          )
        `)
                .eq("supplier_id", supplierId);
            if (error) throw error;
            // Map to a structure that includes the relationship ID for deletion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data as any[]).map((item) => ({
                id: item.id, // The relationship ID
                client: item.clients // The client details
            }));
        },
    });

    // Fetch All Clients (for selection)
    const { data: allClients } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select("id, name, email")
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    // Link Client Mutation
    const addClientMutation = useMutation({
        mutationFn: async (clientId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("supplier_preferred_clients").insert({
                supplier_id: supplierId,
                client_id: clientId,
                owner_id: user.id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-preferred-clients"] });
            setOpen(false);
            toast({ title: "Success", description: "Client added to preferred list" });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add client",
            });
        },
    });

    // Remove Client Mutation
    const removeClientMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("supplier_preferred_clients")
                .delete()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq("id", id as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-preferred-clients"] });
            toast({ title: "Success", description: "Client removed from preferred list" });
        },
    });

    // Filter out already linked clients
    const availableClients = allClients?.filter(

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => !linkedClients?.some((lc: any) => lc.client.id === c.id)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preferred Clients</h3>
                <Button onClick={() => setOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search clients..." />
                <CommandList>
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup heading="Clients">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {availableClients?.map((client: any) => (
                            <CommandItem
                                key={client.id}
                                onSelect={() => {
                                    addClientMutation.mutate(client.id);
                                }}
                            >
                                <Building2 className="mr-2 h-4 w-4" />
                                <span>{client.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoadingLinked ? (
                    <div className="col-span-full flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : linkedClients?.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                            <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No preferred clients</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                            Link clients to this supplier to track relationships.
                        </p>
                        <Button onClick={() => setOpen(true)} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Client
                        </Button>
                    </div>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    linkedClients?.map((item: any) => (
                        <Card key={item.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {item.client.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeClientMutation.mutate(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span>Client</span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    {item.client.email}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
