/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
    req: Request,
    props: { params: Promise<{ clientId: string; fileId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        // 1. Get file record to know the storage path
        const { data: fileRecord, error: fetchError } = await (supabase
            .from("client_files") as any)
            .select("storage_path, file_name")
            .eq("id", params.fileId)
            .single();

        if (fetchError || !fileRecord) {
            return new NextResponse("File not found", { status: 404 });
        }

        // 2. Generate signed URL
        const { data, error: signError } = await supabase.storage
            .from("client-files")
            .createSignedUrl(fileRecord.storage_path, 60 * 60); // 1 hour validity

        if (signError) {
            console.error("Error signing URL:", signError);
            return new NextResponse("Failed to generate download URL", { status: 500 });
        }

        return NextResponse.json({ url: data.signedUrl });
    } catch {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ clientId: string; fileId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        // 1. Get file record to know the storage path
        const { data: fileRecord, error: fetchError } = await (supabase
            .from("client_files") as any)
            .select("storage_path")
            .eq("id", params.fileId)
            .single();

        if (fetchError || !fileRecord) {
            return new NextResponse("File not found", { status: 404 });
        }

        // 2. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from("client-files")
            .remove([fileRecord.storage_path]);

        if (storageError) {
            console.error("Storage delete error:", storageError);
            return new NextResponse("Failed to delete file from storage", { status: 500 });
        }

        // 3. Delete from Database
        const { error: dbError } = await (supabase
            .from("client_files") as any)
            .delete()
            .eq("id", params.fileId);

        if (dbError) {
            console.error("Database delete error:", dbError);
            return new NextResponse("Failed to delete file record", { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
