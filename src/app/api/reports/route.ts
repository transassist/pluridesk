import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();

  const [{ data: invoices, error: invoiceError }, { data: expenses, error: expenseError }, { data: outsourcing, error: outsourcingError }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("total, currency, status")
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID),
      supabase
        .from("expenses")
        .select("amount, currency")
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID),
      supabase
        .from("outsourcing")
        .select("supplier_total, supplier_currency")
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID),
    ]);

  if (invoiceError || expenseError || outsourcingError) {
    return NextResponse.json(
      {
        error: invoiceError?.message ?? expenseError?.message ?? outsourcingError?.message,
      },
      { status: 500 },
    );
  }

  const revenue = (invoices ?? []).reduce<Record<string, number>>((acc, invoice) => {
    if (invoice.status === "paid" || invoice.status === "sent") {
      acc[invoice.currency] = (acc[invoice.currency] ?? 0) + (invoice.total ?? 0);
    }
    return acc;
  }, {});

  const costs = (outsourcing ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.supplier_currency] =
      (acc[row.supplier_currency] ?? 0) + (row.supplier_total ?? 0);
    return acc;
  }, {});

  const expenseTotals = (expenses ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.currency] = (acc[row.currency] ?? 0) + row.amount;
    return acc;
  }, {});

  return NextResponse.json({
    revenue,
    supplier_costs: costs,
    expenses: expenseTotals,
  });
}

