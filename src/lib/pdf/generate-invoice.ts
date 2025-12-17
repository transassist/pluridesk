import jsPDF from "jspdf";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateInvoicePDF = (invoice: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(33, 33, 33);
    doc.text("INVOICE", 14, 20);

    // Company Info (Sender)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("PluriDesk Owner", 14, 30);
    doc.text("123 Business Rd", 14, 35);
    doc.text("City, Country", 14, 40);

    // Invoice Details (Right aligned)
    const pageWidth = doc.internal.pageSize.width;
    doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 14, 30, { align: "right" });
    doc.text(`Date: ${format(new Date(invoice.date), "MMM d, yyyy")}`, pageWidth - 14, 35, { align: "right" });
    doc.text(`Due Date: ${format(new Date(invoice.due_date), "MMM d, yyyy")}`, pageWidth - 14, 40, { align: "right" });

    // Status Badge
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageWidth - 34, 12, 20, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(invoice.status.toUpperCase(), pageWidth - 24, 17, { align: "center" });

    // Bill To
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Bill To:", 14, 55);

    doc.setFontSize(11);
    doc.setTextColor(33, 33, 33);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.clients?.name || "Unknown Client", 14, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const addressLines = doc.splitTextToSize(invoice.clients?.address || "", 80);
    doc.text(addressLines, 14, 68);

    // Items Table
    const tableColumn = ["Description", "Quantity", "Rate", "Amount"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableRows = (invoice.items || []).map((item: any) => [
        item.description,
        item.quantity,
        formatCurrency(item.rate, invoice.currency),
        formatCurrency(item.amount, invoice.currency),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
        startY: 150,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold",
            halign: "center",
        },
        styles: {
            fontSize: 10,
            cellPadding: 5,
            valign: "middle",
            overflow: "linebreak",
        },
        columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right" },
        },
        foot: [
            ["", "", "Subtotal", formatCurrency(invoice.subtotal || 0, invoice.currency)],
            ["", "", "Tax", formatCurrency(invoice.tax_amount || 0, invoice.currency)],
            ["", "", "Total", formatCurrency(invoice.total || 0, invoice.currency)],
        ],
        footStyles: { fillColor: [245, 245, 245], textColor: 33, fontStyle: "bold", halign: "right" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didDrawPage: (data: any) => {
            // Footer
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
                "Thank you for your business!",
                data.settings.margin.left,
                pageHeight - 20
            );
        },
    });

    // Notes
    if (invoice.notes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", 14, finalY + 10);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
        doc.text(noteLines, 14, finalY + 16);
    }

    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
};
