import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function GET() {
    const supabase = createServiceRoleClient();
    const ownerId = serverEnv.PLURIDESK_OWNER_ID;

    const { data, error } = await supabase.rpc("generate_invoice_number", {
        p_owner_id: ownerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ nextNumber: data });
}
