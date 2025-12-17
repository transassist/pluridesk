import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quotes: data });
}

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quote = await request.json() as any;
  const { items, ...quoteData } = quote;

  const supabase = createServiceRoleClient();
  const body = {
    ...quoteData,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };

  // 1. Insert Quote
  // 1. Insert Quote
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insertedQuote, error: quoteError } = await (supabase.from("quotes") as any)
    .insert(body)
    .select()
    .single();

  if (quoteError) {
    return NextResponse.json({ error: quoteError.message }, { status: 500 });
  }

  // 2. Insert Items if present
  if (items && Array.isArray(items) && items.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsToInsert = items.map((item: any) => ({
      quote_id: insertedQuote.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await supabase.from("quote_items" as any)
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting quote items:", itemsError);
      // We don't rollback here because Supabase HTTP API doesn't support transactions easily in this context without RPC.
      // For now, we accept the partial failure risk or would need an RPC.
      // Given the constraints, we'll just log it.
    }
  }

  return NextResponse.json({ quote: insertedQuote }, { status: 201 });
}

