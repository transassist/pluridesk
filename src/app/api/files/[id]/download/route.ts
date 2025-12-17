import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";



// GET: Generate signed URL for downloading a file
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  const supabase = createServiceRoleClient();

  // Get file metadata
  const { data: fileData, error: fetchError } = await supabase
    .from("job_files")
    .select("storage_path, file_name")
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .single();

  if (fetchError || !fileData) {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }

  // Generate signed URL (valid for 1 hour)
  const { data: urlData, error: urlError } = await supabase.storage
    .from("job-files")
    .createSignedUrl(fileData.storage_path, 3600);

  if (urlError || !urlData) {
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: urlData.signedUrl,
    fileName: fileData.file_name,
  });
}

