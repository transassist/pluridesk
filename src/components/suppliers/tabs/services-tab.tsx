"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Languages, BookOpen, ArrowRight, X, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/components/ui/use-toast";

interface ServicesTabProps {
    supplierId: string;
}

export function ServicesTab({ supplierId }: ServicesTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // --- Language Pairs ---
    const { data: languagePairs, isLoading: isLangLoading } = useQuery({
        queryKey: ["supplier-lang-pairs", supplierId],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/language-pairs`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch language pairs");
            const data = await res.json();
            return data.languagePairs;
        },
    });

    const [sourceLang, setSourceLang] = useState("");
    const [targetLang, setTargetLang] = useState("");
    const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);

    const addLangPairMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/language-pairs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    source_language: sourceLang,
                    target_language: targetLang,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add language pair");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-lang-pairs"] });
            setIsLangDialogOpen(false);
            setSourceLang("");
            setTargetLang("");
            toast({ title: "Success", description: "Language pair added" });
        },
        onError: (error) => {
            console.error("Error adding language pair:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to add language pair: ${error.message}`,
            });
        },
    });

    const deleteLangPairMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/suppliers/${supplierId}/language-pairs?id=${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete language pair");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-lang-pairs"] });
            toast({ title: "Success", description: "Language pair deleted" });
        },
    });

    // --- Domains ---
    const { data: domains, isLoading: isDomainsLoading } = useQuery({
        queryKey: ["supplier-domains", supplierId],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/domains`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch domains");
            const data = await res.json();
            return data.domains;
        },
    });

    const [newDomain, setNewDomain] = useState("");
    const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);

    const addDomainMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/domains`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    domain: newDomain,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add domain");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-domains"] });
            setIsDomainDialogOpen(false);
            setNewDomain("");
            toast({ title: "Success", description: "Domain added" });
        },
        onError: (error) => {
            console.error("Error adding domain:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to add domain: ${error.message}`,
            });
        },
    });

    const deleteDomainMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/suppliers/${supplierId}/domains?id=${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete domain");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-domains"] });
            toast({ title: "Success", description: "Domain deleted" });
        },
    });

    // --- Rates ---
    const { data: rates, isLoading: isRatesLoading } = useQuery({
        queryKey: ["supplier-rates", supplierId],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/rates`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch rates");
            const data = await res.json();
            return data.rates;
        },
    });

    const [newRateService, setNewRateService] = useState("");
    const [newRateAmount, setNewRateAmount] = useState("");
    const [newRateUnit, setNewRateUnit] = useState("word");
    const [newRateCurrency, setNewRateCurrency] = useState("USD");
    const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);

    const addRateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/rates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    service_name: newRateService,
                    rate: parseFloat(newRateAmount),
                    unit: newRateUnit,
                    currency: newRateCurrency,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("API Error:", res.status, text);
                try {
                    const error = JSON.parse(text);
                    throw new Error(error.error || "Failed to add rate");
                } catch (e) {
                    throw new Error(`Failed to add rate: ${res.status} ${res.statusText}`);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-rates"] });
            setIsRateDialogOpen(false);
            setNewRateService("");
            setNewRateAmount("");
            toast({ title: "Success", description: "Rate added" });
        },
        onError: (error) => {
            console.error("Error adding rate:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to add rate: ${error.message}`,
            });
        },
    });

    const deleteRateMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/suppliers/${supplierId}/rates?id=${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete rate");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-rates"] });
            toast({ title: "Success", description: "Rate deleted" });
        },
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Language Pairs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Languages className="h-5 w-5" />
                                <CardTitle>Language Pairs</CardTitle>
                            </div>
                            <Dialog open={isLangDialogOpen} onOpenChange={setIsLangDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Language Pair</DialogTitle>
                                        <DialogDescription>
                                            Add a source and target language combination.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Source Language</label>
                                            <Input
                                                placeholder="e.g. English"
                                                value={sourceLang}
                                                onChange={(e) => setSourceLang(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Target Language</label>
                                            <Input
                                                placeholder="e.g. French"
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsLangDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={() => addLangPairMutation.mutate()}
                                            disabled={!sourceLang || !targetLang || addLangPairMutation.isPending}
                                        >
                                            {addLangPairMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Pair
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription>
                            Languages this supplier works with.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLangLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : languagePairs?.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                No language pairs added.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(languagePairs as any[])?.map((pair) => (
                                    <div key={pair.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                                        <div className="flex items-center gap-2 font-medium">
                                            <span>{pair.source_language}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span>{pair.target_language}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteLangPairMutation.mutate(pair.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Domains of Expertise */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                <CardTitle>Domains of Expertise</CardTitle>
                            </div>
                            <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Domain</DialogTitle>
                                        <DialogDescription>
                                            Add a subject matter expertise.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Domain</label>
                                            <Input
                                                placeholder="e.g. Legal, Medical, Technical"
                                                value={newDomain}
                                                onChange={(e) => setNewDomain(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDomainDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={() => addDomainMutation.mutate()}
                                            disabled={!newDomain || addDomainMutation.isPending}
                                        >
                                            {addDomainMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Domain
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription>
                            Subject matters this supplier specializes in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isDomainsLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : domains?.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                No domains added.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(domains as any[])?.map((item) => (
                                    <div key={item.id} className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full border bg-secondary text-secondary-foreground text-sm">
                                        <span>{item.domain}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 rounded-full ml-1 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => deleteDomainMutation.mutate(item.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Service Rates */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            <CardTitle>Service Rates</CardTitle>
                        </div>
                        <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Rate
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Service Rate</DialogTitle>
                                    <DialogDescription>
                                        Add a specific rate for a service.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Service Name</label>
                                        <Input
                                            placeholder="e.g. Translation, Proofreading"
                                            value={newRateService}
                                            onChange={(e) => setNewRateService(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Rate</label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                placeholder="0.00"
                                                value={newRateAmount}
                                                onChange={(e) => setNewRateAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Unit</label>
                                            <Input
                                                placeholder="word"
                                                value={newRateUnit}
                                                onChange={(e) => setNewRateUnit(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Currency</label>
                                            <Input
                                                placeholder="USD"
                                                value={newRateCurrency}
                                                onChange={(e) => setNewRateCurrency(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={() => addRateMutation.mutate()}
                                        disabled={!newRateService || !newRateAmount || addRateMutation.isPending}
                                    >
                                        {addRateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Rate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>
                        Specific rates for different services.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isRatesLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : rates?.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            No rates added.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(rates as any[])?.map((rate) => (
                                <div key={rate.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{rate.service_name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {rate.rate} {rate.currency} / {rate.unit}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteRateMutation.mutate(rate.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
