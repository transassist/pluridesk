/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
    req: Request,
    props: { params: Promise<{ supplierId: string; fileId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        // 1. Get file record to find storage path
        const { data: file, error: fetchError } = await (supabase
            .from("supplier_files") as any)
            .select("storage_path")
            .eq("id", params.fileId)
            .single();

        if (fetchError || !file) {
            return new NextResponse("File not found", { status: 404 });
        }

        // 2. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from("supplier-files")
            .remove([file.storage_path]);

        if (storageError) {
            console.error("Storage delete error:", storageError);
            return new NextResponse("Failed to delete file from storage", { status: 500 });
        }

        // 3. Delete from Database
        const { error: dbError } = await (supabase
            .from("supplier_files") as any)
            .delete()
            .eq("id", params.fileId);

        if (dbError) {
            console.error("Database delete error:", dbError);
            return new NextResponse("Failed to delete file record", { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    props: { params: Promise<{ supplierId: string; fileId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        // 1. Get file record
        const { data: file, error: fetchError } = await (supabase
            .from("supplier_files") as any)
            .select("storage_path")
            .eq("id", params.fileId)
            .single();

        if (fetchError || !file) {
            return new NextResponse("File not found", { status: 404 });
        }

        // 2. Create signed URL
        const { data, error: urlError } = await supabase.storage
            .from("supplier-files")
            .createSignedUrl(file.storage_path, 60 * 60); // 1 hour expiry

        if (urlError) {
            console.error("URL generation error:", urlError);
            return new NextResponse("Failed to generate download URL", { status: 500 });
        }

        return NextResponse.json({ url: data.signedUrl });
    } catch (error) {
        console.error("Error getting file URL:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
