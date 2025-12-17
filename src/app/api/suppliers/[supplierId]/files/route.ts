/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
    req: Request,
    props: { params: Promise<{ supplierId: string }> }
) {
    try {
        const params = await props.params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${params.supplierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from("supplier-files")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return new NextResponse("Failed to upload file", { status: 500 });
        }

        // 2. Insert record into supplier_files table
        const { data: fileRecord, error: dbError } = await (supabase
            .from("supplier_files") as any)
            .insert({
                supplier_id: params.supplierId,
                owner_id: user.id,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: fileName,
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database error:", dbError);
            return new NextResponse("Failed to save file record", { status: 500 });
        }

        return NextResponse.json(fileRecord);
    } catch (error) {
        console.error("Error uploading file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    props: { params: Promise<{ supplierId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        const { data: files, error } = await (supabase
            .from("supplier_files") as any)
            .select("*")
            .eq("supplier_id", params.supplierId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Database error:", error);
            return new NextResponse("Failed to fetch files", { status: 500 });
        }

        return NextResponse.json(files);
    } catch {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
