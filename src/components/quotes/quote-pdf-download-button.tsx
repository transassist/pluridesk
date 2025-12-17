"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface QuotePDFDownloadButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quote: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
}

export default function QuotePDFDownloadButton({ quote, items }: QuotePDFDownloadButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsLoading(true);

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // --- Header ---
            // Company Info (Left)
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(quote.owner?.company_name || quote.owner?.name || "", margin, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(quote.owner?.address || "", margin, 26);
            doc.text(quote.owner?.email || "", margin, 32);

            // Quote Info (Right)
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("QUOTE", pageWidth - margin, 20, { align: "right" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Quote Number: ${quote.quote_number || ""}`, pageWidth - margin, 30, { align: "right" });
            doc.text(`Date: ${quote.date ? format(new Date(quote.date), "MMM dd, yyyy") : "-"}`, pageWidth - margin, 36, { align: "right" });
            doc.text(`Valid Until: ${quote.expiry_date ? format(new Date(quote.expiry_date), "MMM dd, yyyy") : "-"}`, pageWidth - margin, 42, { align: "right" });

            // --- Bill To ---
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Prepared For:", margin, 55);

            doc.setFont("helvetica", "normal");
            doc.text(quote.clients?.name || "", margin, 61);
            doc.text(quote.clients?.address || "", margin, 67);
            doc.text(quote.clients?.email || "", margin, 73);

            // --- Items Table ---
            const tableColumn = ["Description", "Qty", "Rate", "Amount"];
            const tableRows = items.map((item) => [
                item.description || "",
                item.quantity || 0,
                formatCurrency(item.rate || 0, quote.currency),
                formatCurrency(item.amount || 0, quote.currency),
            ]);

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                headStyles: { fillColor: [66, 66, 66] },
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 30, halign: 'center' },
                    2: { cellWidth: 40, halign: 'right' },
                    3: { cellWidth: 40, halign: 'right' },
                },
            });

            // --- Totals ---
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (doc as any).lastAutoTable.finalY + 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Total:", pageWidth - margin - 50, finalY);
            doc.text(formatCurrency(quote.total || 0, quote.currency), pageWidth - margin, finalY, { align: "right" });

            // --- Notes ---
            if (quote.notes) {
                doc.setFont("helvetica", "bold");
                doc.text("Notes:", margin, finalY + 20);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(quote.notes, margin, finalY + 26, { maxWidth: pageWidth - (margin * 2) });
            }

            // --- Footer ---
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("Thank you for the opportunity to serve you!", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });

            doc.save(`Quote-${quote.quote_number || "draft"}.pdf`);

        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast({
                title: "Error generating PDF",
                description: "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleDownload} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Generating..." : "Download PDF"}
        </Button>
    );
}
