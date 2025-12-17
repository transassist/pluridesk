import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts if needed, or use standard ones
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: 'auto',
        marginBottom: 10,
    },
    companyDetails: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    invoiceDetails: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    label: {
        fontSize: 8,
        color: '#6B7280',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 10,
        marginBottom: 8,
    },
    billTo: {
        marginTop: 20,
        marginBottom: 30,
    },
    table: {
        flexDirection: 'column',
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    colDescription: { width: '50%' },
    colQty: { width: '10%', textAlign: 'right' },
    colRate: { width: '20%', textAlign: 'right' },
    colAmount: { width: '20%', textAlign: 'right' },

    totals: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
        width: '100%',
    },
    totalLabel: {
        width: '30%',
        textAlign: 'right',
        paddingRight: 10,
        color: '#6B7280',
    },
    totalValue: {
        width: '20%',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    grandTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 20,
    },
});

interface InvoicePDFProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice: any; // Replace with proper type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    owner: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any;
}

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export const InvoicePDF = ({ invoice, owner, client }: InvoicePDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.companyDetails}>
                    {owner.logo_url && (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <Image src={owner.logo_url} style={styles.logo} cache={false} />
                    )}
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                        {owner.company_name || owner.name}
                    </Text>
                    <Text>{owner.address}</Text>
                    <Text>{owner.email}</Text>
                </View>
                <View style={styles.invoiceDetails}>
                    <Text style={styles.title}>INVOICE</Text>
                    <Text style={styles.label}>Invoice Number</Text>
                    <Text style={styles.value}>{invoice.invoice_number}</Text>

                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>
                        {invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : '-'}
                    </Text>

                    <Text style={styles.label}>Due Date</Text>
                    <Text style={styles.value}>
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
                    </Text>
                </View>
            </View>

            {/* Bill To */}
            <View style={styles.billTo}>
                <Text style={[styles.label, { marginBottom: 4 }]}>Bill To:</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
                    {client.name}
                </Text>
                <Text>{client.address}</Text>
                <Text>{client.email}</Text>
                {client.vat_number && <Text>VAT: {client.vat_number}</Text>}
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.label, styles.colDescription]}>Description</Text>
                    <Text style={[styles.label, styles.colQty]}>Qty</Text>
                    <Text style={[styles.label, styles.colRate]}>Rate</Text>
                    <Text style={[styles.label, styles.colAmount]}>Amount</Text>
                </View>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {invoice.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.colDescription}>{item.description}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colRate}>
                            {formatCurrency(item.rate, invoice.currency)}
                        </Text>
                        <Text style={styles.colAmount}>
                            {formatCurrency(item.amount, invoice.currency)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totals}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                        {formatCurrency(invoice.subtotal || 0, invoice.currency)}
                    </Text>
                </View>
                {invoice.tax_amount > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tax</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(invoice.tax_amount, invoice.currency)}
                        </Text>
                    </View>
                )}
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={[styles.totalLabel, { color: '#111827' }]}>Total</Text>
                    <Text style={styles.totalValue}>
                        {formatCurrency(invoice.total || 0, invoice.currency)}
                    </Text>
                </View>
            </View>

            {/* Notes */}
            {invoice.notes && (
                <View style={{ marginTop: 40 }}>
                    <Text style={[styles.label, { marginBottom: 4 }]}>Notes</Text>
                    <Text style={{ fontSize: 9, color: '#4B5563' }}>{invoice.notes}</Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Thank you for your business!</Text>
            </View>
        </Page>
    </Document>
);
