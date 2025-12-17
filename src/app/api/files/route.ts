import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// GET: List files for a job
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json(
      { error: "job_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("job_files")
    .select("*")
    .eq("job_id", jobId)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data });
}

// POST: Upload a file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const jobId = formData.get("job_id") as string;
    const fileCategory = formData.get("file_category") as string;
    const uploadedBy = formData.get("uploaded_by") as string | null;

    if (!file || !jobId || !fileCategory) {
      return NextResponse.json(
        { error: "file, job_id, and file_category are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const ownerId = serverEnv.PLURIDESK_OWNER_ID;
    
    // Create unique file path: owner_id/job_id/timestamp-filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${ownerId}/${jobId}/${timestamp}-${safeFileName}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("job-files")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: `Storage error: ${storageError.message}` },
        { status: 500 }
      );
    }

    // Create metadata record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from("job_files")
      .insert({
        owner_id: ownerId,
        job_id: jobId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_category: fileCategory,
        storage_path: storageData.path,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete the uploaded file from storage
      await supabase.storage.from("job-files").remove([storagePath]);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete a file
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Get file metadata first to get storage path
  const { data: fileData, error: fetchError } = await supabase
    .from("job_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 404 }
    );
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("job-files")
    .remove([fileData.storage_path]);

  if (storageError) {
    console.error("Storage deletion error:", storageError);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("job_files")
    .delete()
    .eq("id", fileId)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

