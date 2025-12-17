import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ids, action, status } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "No invoice IDs provided" },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();

        if (action === "delete") {
            const { error } = await supabase
                .from("invoices")
                .delete()
                .in("id", ids)
                .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

            if (error) {
                console.error("Error deleting invoices:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        if (action === "status") {
            if (!status) {
                return NextResponse.json(
                    { error: "Status is required for status update" },
                    { status: 400 }
                );
            }

            const { error } = await supabase
                .from("invoices")
                .update({ status })
                .in("id", ids)
                .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

            if (error) {
                console.error("Error updating invoices:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Bulk operation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
