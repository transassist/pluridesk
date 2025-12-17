"use client";



import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, MoreVertical, Trash, Upload, Download } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes } from "@/lib/utils";

interface SupplierFile {
    id: string;
    file_name: string;
    file_size: number;
    created_at: string;
    storage_path: string;
}

interface SupplierFilesProps {
    supplierId: string;
}

export function SupplierFiles({ supplierId }: SupplierFilesProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: files, isLoading } = useQuery<SupplierFile[]>({
        queryKey: ["supplier-files", supplierId],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/files`);
            if (!res.ok) throw new Error("Failed to fetch files");
            return res.json();
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/suppliers/${supplierId}/files`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Failed to upload file");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-files", supplierId] });
            toast({
                title: "File uploaded",
                description: "The file has been successfully uploaded.",
            });
            setIsUploading(false);
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: error.message,
            });
            setIsUploading(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (fileId: string) => {
            const res = await fetch(`/api/suppliers/${supplierId}/files/${fileId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete file");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-files", supplierId] });
            toast({
                title: "File deleted",
                description: "The file has been successfully deleted.",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: error.message,
            });
        },
    });

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/suppliers/${supplierId}/files/${fileId}`);
            if (!res.ok) throw new Error("Failed to get download URL");

            const { url } = await res.json();

            // Create a temporary link to trigger download
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            toast({
                variant: "destructive",
                title: "Download failed",
                description: "Could not download the file.",
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        uploadMutation.mutate(file);
        // Reset input so the same file can be selected again if needed
        e.target.value = "";
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Internal Files</CardTitle>
                    <CardDescription>Manage contracts, NDAs, and other documents</CardDescription>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload File
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : files?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <FileText className="mb-4 h-10 w-10 opacity-50" />
                        <p>No files uploaded yet.</p>
                        <p className="text-sm">Upload contracts, NDAs, or reference materials.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files?.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {file.file_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatBytes(file.file_size)}</TableCell>
                                    <TableCell>{format(new Date(file.created_at), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDownload(file.id, file.file_name)}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this file?")) {
                                                            deleteMutation.mutate(file.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
