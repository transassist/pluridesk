"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientDetails({ client }: { client: any }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Administrative Details</CardTitle>
                    <CardDescription>Contact and location information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                            <div className="text-sm">{client.name}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Contact Person</div>
                            <div className="text-sm">{client.contact_name || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Email</div>
                            <div className="text-sm">
                                {client.email ? (
                                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                                        {client.email}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Phone</div>
                            <div className="text-sm">{client.phone || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Website</div>
                            <div className="text-sm">
                                {client.website ? (
                                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {client.website}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Address</div>
                            <div className="text-sm whitespace-pre-wrap">{client.address || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Country</div>
                            <div className="text-sm">{client.country || "—"}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Settings</CardTitle>
                    <CardDescription>Billing and currency preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Default Currency</div>
                            <div className="text-sm">
                                <Badge variant="outline">{client.default_currency || "USD"}</Badge>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">VAT Number</div>
                            <div className="text-sm">{client.vat_number || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Tax ID</div>
                            <div className="text-sm">{client.tax_id || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Default Payment Terms</div>
                            <div className="text-sm">{client.default_payment_terms || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Default Tax Rate</div>
                            <div className="text-sm">{client.default_taxes ? `${client.default_taxes}%` : "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Minimum Fee</div>
                            <div className="text-sm">{client.minimum_fee || "—"}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                    <CardDescription>Preferences for jobs and deliverables</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Document Language</div>
                            <div className="text-sm">{client.document_language || "—"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Quote Validity</div>
                            <div className="text-sm">{client.quote_validity ? `${client.quote_validity} days` : "—"}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-sm font-medium text-muted-foreground">File Naming Convention</div>
                            <div className="text-sm font-mono bg-muted p-1 rounded mt-1 inline-block">
                                {client.default_file_naming || "Default"}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-sm font-medium text-muted-foreground">CAT Tool Preferences</div>
                            <div className="text-sm whitespace-pre-wrap">{client.cat_tool_preferences || "—"}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Internal Notes</CardTitle>
                    <CardDescription>Private notes about this client</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm whitespace-pre-wrap">{client.notes || "No notes added."}</div>
                </CardContent>
            </Card>
        </div>
    );
}
