"use client";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockPurchaseOrders = [
  {
    id: "po-1",
    number: "PO-2025-34",
    job_code: "VP24111163",
    amount: 3200,
    currency: "USD",
    created_at: "2025-11-11",
  },
  {
    id: "po-2",
    number: "PO-2025-33",
    job_code: "VP24111161",
    amount: 1500,
    currency: "EUR",
    created_at: "2025-11-07",
  },
];

export default function PurchaseOrdersPage() {
  return (
    <WorkspaceShell
      title="Purchase orders"
      description="Attach PO PDFs to jobs, track approvals, and sync with suppliers."
      actions={<Button size="sm">Upload PO</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>POs this month</CardDescription>
            <CardTitle>{mockPurchaseOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total value</CardDescription>
            <CardTitle>{formatCurrency(4700, "USD")}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>PO registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPurchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-semibold">{po.number}</TableCell>
                  <TableCell>{po.job_code}</TableCell>
                  <TableCell>{formatDate(po.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(po.amount, po.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}

