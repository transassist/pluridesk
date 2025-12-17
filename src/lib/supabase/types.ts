export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clients: {
                Row: {
                    address: string | null
                    cat_tool_preferences: string | null
                    contact_name: string | null
                    country: string | null
                    created_at: string
                    default_currency: Database["public"]["Enums"]["currency_code"] | null
                    default_file_naming: string | null
                    default_payment_terms: string | null
                    default_taxes: number | null
                    document_language: string | null
                    email: string | null
                    id: string
                    minimum_fee: number | null
                    name: string
                    notes: string | null
                    owner_id: string
                    phone: string | null
                    quote_validity: number | null
                    tax_id: string | null
                    vat_number: string | null
                    website: string | null
                }
                Insert: {
                    address?: string | null
                    cat_tool_preferences?: string | null
                    contact_name?: string | null
                    country?: string | null
                    created_at?: string
                    default_currency?: Database["public"]["Enums"]["currency_code"] | null
                    default_file_naming?: string | null
                    default_payment_terms?: string | null
                    default_taxes?: number | null
                    document_language?: string | null
                    email?: string | null
                    id?: string
                    minimum_fee?: number | null
                    name: string
                    notes?: string | null
                    owner_id: string
                    phone?: string | null
                    quote_validity?: number | null
                    tax_id?: string | null
                    vat_number?: string | null
                    website?: string | null
                }
                Update: {
                    address?: string | null
                    cat_tool_preferences?: string | null
                    contact_name?: string | null
                    country?: string | null
                    created_at?: string
                    default_currency?: Database["public"]["Enums"]["currency_code"] | null
                    default_file_naming?: string | null
                    default_payment_terms?: string | null
                    default_taxes?: number | null
                    document_language?: string | null
                    email?: string | null
                    id?: string
                    minimum_fee?: number | null
                    name?: string
                    notes?: string | null
                    owner_id?: string
                    phone?: string | null
                    quote_validity?: number | null
                    tax_id?: string | null
                    vat_number?: string | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            client_activities: {
                Row: {
                    client_id: string
                    created_at: string
                    date: string
                    description: string | null
                    id: string
                    owner_id: string
                    status: string | null
                    subject: string
                    type: string
                    updated_at: string | null
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    date?: string
                    description?: string | null
                    id?: string
                    owner_id: string
                    status?: string | null
                    subject: string
                    type: string
                    updated_at?: string | null
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    date?: string
                    description?: string | null
                    id?: string
                    owner_id?: string
                    status?: string | null
                    subject?: string
                    type?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "client_activities_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "client_activities_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            client_contacts: {
                Row: {
                    client_id: string
                    created_at: string | null
                    email: string | null
                    first_name: string
                    id: string
                    is_primary: boolean | null
                    last_name: string
                    owner_id: string
                    phone: string | null
                    role: string | null
                    updated_at: string | null
                }
                Insert: {
                    client_id: string
                    created_at?: string | null
                    email?: string | null
                    first_name: string
                    id?: string
                    is_primary?: boolean | null
                    last_name: string
                    owner_id: string
                    phone?: string | null
                    role?: string | null
                    updated_at?: string | null
                }
                Update: {
                    client_id?: string
                    created_at?: string | null
                    email?: string | null
                    first_name?: string
                    id?: string
                    is_primary?: boolean | null
                    last_name?: string
                    owner_id?: string
                    phone?: string | null
                    role?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "client_contacts_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "client_contacts_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            client_files: {
                Row: {
                    client_id: string
                    created_at: string
                    file_name: string
                    file_size: number
                    file_type: string
                    id: string
                    owner_id: string
                    storage_path: string
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    file_name: string
                    file_size: number
                    file_type: string
                    id?: string
                    owner_id: string
                    storage_path: string
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    file_name?: string
                    file_size?: number
                    file_type?: string
                    id?: string
                    owner_id?: string
                    storage_path?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "client_files_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "client_files_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            client_rates: {
                Row: {
                    client_id: string
                    created_at: string | null
                    currency: string
                    id: string
                    owner_id: string
                    rate: number
                    service_type: string
                    source_language: string | null
                    target_language: string | null
                    unit: string
                    updated_at: string | null
                }
                Insert: {
                    client_id: string
                    created_at?: string | null
                    currency: string
                    id?: string
                    owner_id: string
                    rate: number
                    service_type: string
                    source_language?: string | null
                    target_language?: string | null
                    unit: string
                    updated_at?: string | null
                }
                Update: {
                    client_id?: string
                    created_at?: string | null
                    currency?: string
                    id?: string
                    owner_id?: string
                    rate?: number
                    service_type?: string
                    source_language?: string | null
                    target_language?: string | null
                    unit?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "client_rates_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "client_rates_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            expenses: {
                Row: {
                    amount: number
                    category: string
                    created_at: string
                    currency: Database["public"]["Enums"]["currency_code"]
                    date: string | null
                    file_url: string | null
                    id: string
                    notes: string | null
                    owner_id: string
                    supplier_name: string | null
                    supplier_id: string | null
                }
                Insert: {
                    amount: number
                    category: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    file_url?: string | null
                    id?: string
                    notes?: string | null
                    owner_id: string
                    supplier_name?: string | null
                    supplier_id?: string | null
                }
                Update: {
                    amount?: number
                    category?: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    file_url?: string | null
                    id?: string
                    notes?: string | null
                    owner_id?: string
                    supplier_name?: string | null
                    supplier_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "expenses_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invoices: {
                Row: {
                    client_id: string
                    created_at: string
                    currency: Database["public"]["Enums"]["currency_code"]
                    date: string | null
                    due_date: string | null
                    html_content: string | null
                    id: string
                    invoice_number: string
                    items: Json | null
                    notes: string | null
                    owner_id: string
                    pdf_url: string | null
                    status: Database["public"]["Enums"]["invoice_status"]
                    subtotal: number | null
                    tax_amount: number | null
                    total: number | null
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    due_date?: string | null
                    html_content?: string | null
                    id?: string
                    invoice_number?: string
                    items?: Json | null
                    notes?: string | null
                    owner_id: string
                    pdf_url?: string | null
                    status?: Database["public"]["Enums"]["invoice_status"]
                    subtotal?: number | null
                    tax_amount?: number | null
                    total?: number | null
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    due_date?: string | null
                    html_content?: string | null
                    id?: string
                    invoice_number?: string
                    items?: Json | null
                    notes?: string | null
                    owner_id?: string
                    pdf_url?: string | null
                    status?: Database["public"]["Enums"]["invoice_status"]
                    subtotal?: number | null
                    tax_amount?: number | null
                    total?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            jobs: {
                Row: {
                    client_id: string
                    created_at: string
                    currency: Database["public"]["Enums"]["currency_code"]
                    due_date: string | null
                    has_outsourcing: boolean
                    id: string
                    job_code: string
                    notes: string | null
                    owner_id: string
                    pricing_type: Database["public"]["Enums"]["pricing_type"]
                    purchase_order_ref: string | null
                    quantity: number | null
                    rate: number | null
                    service_type: string
                    start_date: string | null
                    status: Database["public"]["Enums"]["job_status"]
                    title: string
                    total_amount: number | null
                    invoice_id: string | null
                    delivery_date: string | null
                    updated_at: string
                    domain: string | null
                    unit: string | null
                    language_pair_source: string | null
                    language_pair_target: string | null
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    due_date?: string | null
                    has_outsourcing?: boolean
                    id?: string
                    job_code?: string
                    notes?: string | null
                    owner_id: string
                    pricing_type: Database["public"]["Enums"]["pricing_type"]
                    purchase_order_ref?: string | null
                    quantity?: number | null
                    rate?: number | null
                    service_type: string
                    start_date?: string | null
                    status?: Database["public"]["Enums"]["job_status"]
                    title: string
                    total_amount?: number | null
                    invoice_id?: string | null
                    delivery_date?: string | null
                    updated_at?: string
                    domain?: string | null
                    unit?: string | null
                    language_pair_source?: string | null
                    language_pair_target?: string | null
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    due_date?: string | null
                    has_outsourcing?: boolean
                    id?: string
                    job_code?: string
                    notes?: string | null
                    owner_id?: string
                    pricing_type?: Database["public"]["Enums"]["pricing_type"]
                    purchase_order_ref?: string | null
                    quantity?: number | null
                    rate?: number | null
                    service_type?: string
                    start_date?: string | null
                    status?: Database["public"]["Enums"]["job_status"]
                    title?: string
                    total_amount?: number | null
                    invoice_id?: string | null
                    delivery_date?: string | null
                    updated_at?: string
                    domain?: string | null
                    unit?: string | null
                    language_pair_source?: string | null
                    language_pair_target?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "jobs_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "jobs_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "jobs_invoice_id_fkey"
                        columns: ["invoice_id"]
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_files: {
                Row: {
                    created_at: string
                    file_category: string
                    file_name: string
                    file_size: number
                    file_type: string
                    id: string
                    job_id: string
                    owner_id: string
                    storage_path: string
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string
                    file_category: string
                    file_name: string
                    file_size: number
                    file_type: string
                    id?: string
                    job_id: string
                    owner_id: string
                    storage_path: string
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string
                    file_category?: string
                    file_name?: string
                    file_size?: number
                    file_type?: string
                    id?: string
                    job_id?: string
                    owner_id?: string
                    storage_path?: string
                    uploaded_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "job_files_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_files_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_time_logs: {
                Row: {
                    created_at: string
                    description: string | null
                    duration: number | null
                    end_time: string | null
                    id: string
                    job_id: string
                    owner_id: string
                    start_time: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    duration?: number | null
                    end_time?: string | null
                    id?: string
                    job_id: string
                    owner_id: string
                    start_time: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    duration?: number | null
                    end_time?: string | null
                    id?: string
                    job_id?: string
                    owner_id?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_time_logs_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_time_logs_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            labels: {
                Row: {
                    color: string
                    id: string
                    name: string
                    owner_id: string
                }
                Insert: {
                    color: string
                    id?: string
                    name: string
                    owner_id: string
                }
                Update: {
                    color?: string
                    id?: string
                    name?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "labels_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_labels: {
                Row: {
                    job_id: string
                    label_id: string
                    owner_id: string
                }
                Insert: {
                    job_id: string
                    label_id: string
                    owner_id: string
                }
                Update: {
                    job_id?: string
                    label_id?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_labels_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_labels_label_id_fkey"
                        columns: ["label_id"]
                        referencedRelation: "labels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_labels_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_invoices: {
                Row: {
                    invoice_id: string
                    job_id: string
                    owner_id: string
                }
                Insert: {
                    invoice_id: string
                    job_id: string
                    owner_id: string
                }
                Update: {
                    invoice_id?: string
                    job_id?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_invoices_invoice_id_fkey"
                        columns: ["invoice_id"]
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_invoices_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_invoices_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_quotes: {
                Row: {
                    job_id: string
                    owner_id: string
                    quote_id: string
                }
                Insert: {
                    job_id: string
                    owner_id: string
                    quote_id: string
                }
                Update: {
                    job_id?: string
                    owner_id?: string
                    quote_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_quotes_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_quotes_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_quotes_quote_id_fkey"
                        columns: ["quote_id"]
                        referencedRelation: "quotes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_notes: {
                Row: {
                    content: string
                    created_at: string
                    id: string
                    is_pinned: boolean | null
                    job_id: string
                    owner_id: string
                    updated_at: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    id?: string
                    is_pinned?: boolean | null
                    job_id: string
                    owner_id: string
                    updated_at?: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    id?: string
                    is_pinned?: boolean | null
                    job_id?: string
                    owner_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_notes_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_notes_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payments: {
                Row: {
                    amount: number
                    created_at: string
                    date: string
                    id: string
                    invoice_id: string
                    method: string
                    notes: string | null
                    updated_at: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string
                    date?: string
                    id?: string
                    invoice_id: string
                    method: string
                    notes?: string | null
                    updated_at?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string
                    date?: string
                    id?: string
                    invoice_id?: string
                    method?: string
                    notes?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_invoice_id_fkey"
                        columns: ["invoice_id"]
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    message: string
                    owner_id: string
                    read: boolean
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                }
                Insert: {
                    created_at?: string
                    id?: string
                    message: string
                    owner_id: string
                    read?: boolean
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                }
                Update: {
                    created_at?: string
                    id?: string
                    message?: string
                    owner_id?: string
                    read?: boolean
                    title?: string
                    type?: Database["public"]["Enums"]["notification_type"]
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            outsourcing: {
                Row: {
                    created_at: string
                    id: string
                    job_id: string
                    notes: string | null
                    owner_id: string
                    paid: boolean
                    supplier_currency: Database["public"]["Enums"]["currency_code"]
                    supplier_id: string
                    supplier_invoice_url: string | null
                    supplier_rate: number | null
                    supplier_total: number | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    job_id: string
                    notes?: string | null
                    owner_id: string
                    paid?: boolean
                    supplier_currency?: Database["public"]["Enums"]["currency_code"]
                    supplier_id: string
                    supplier_invoice_url?: string | null
                    supplier_rate?: number | null
                    supplier_total?: number | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    job_id?: string
                    notes?: string | null
                    owner_id?: string
                    paid?: boolean
                    supplier_currency?: Database["public"]["Enums"]["currency_code"]
                    supplier_id?: string
                    supplier_invoice_url?: string | null
                    supplier_rate?: number | null
                    supplier_total?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "outsourcing_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "outsourcing_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "outsourcing_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            purchase_orders: {
                Row: {
                    amount: number | null
                    created_at: string
                    currency: Database["public"]["Enums"]["currency_code"]
                    file_url: string | null
                    id: string
                    job_id: string
                    notes: string | null
                    number: string
                    owner_id: string
                    supplier_id: string | null
                }
                Insert: {
                    amount?: number | null
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    file_url?: string | null
                    id?: string
                    job_id: string
                    notes?: string | null
                    number: string
                    owner_id: string
                }
                Update: {
                    amount?: number | null
                    created_at?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    file_url?: string | null
                    id?: string
                    job_id?: string
                    notes?: string | null
                    number?: string
                    owner_id?: string
                    supplier_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "purchase_orders_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "purchase_orders_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            quotes: {
                Row: {
                    client_id: string
                    currency: Database["public"]["Enums"]["currency_code"]
                    date: string | null
                    expiry_date: string | null
                    id: string
                    items: Json | null
                    notes: string | null
                    owner_id: string
                    quote_number: string
                    status: Database["public"]["Enums"]["quote_status"]
                    total: number | null
                }
                Insert: {
                    client_id: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    expiry_date?: string | null
                    id?: string
                    items?: Json | null
                    notes?: string | null
                    owner_id: string
                    quote_number: string
                    status?: Database["public"]["Enums"]["quote_status"]
                    total?: number | null
                }
                Update: {
                    client_id?: string
                    currency?: Database["public"]["Enums"]["currency_code"]
                    date?: string | null
                    expiry_date?: string | null
                    id?: string
                    items?: Json | null
                    notes?: string | null
                    owner_id?: string
                    quote_number?: string
                    status?: Database["public"]["Enums"]["quote_status"]
                    total?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "quotes_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quotes_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            quote_items: {
                Row: {
                    amount: number | null
                    created_at: string
                    description: string
                    id: string
                    quantity: number | null
                    quote_id: string
                    rate: number | null
                    updated_at: string | null
                }
                Insert: {
                    amount?: number | null
                    created_at?: string
                    description: string
                    id?: string
                    quantity?: number | null
                    quote_id: string
                    rate?: number | null
                    updated_at?: string | null
                }
                Update: {
                    amount?: number | null
                    created_at?: string
                    description?: string
                    id?: string
                    quantity?: number | null
                    quote_id?: string
                    rate?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "quote_items_quote_id_fkey"
                        columns: ["quote_id"]
                        referencedRelation: "quotes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            suppliers: {
                Row: {
                    address: string | null
                    created_at: string
                    default_rate_hour: number | null
                    default_rate_word: number | null
                    email: string | null
                    id: string
                    name: string
                    notes: string | null
                    owner_id: string
                    phone: string | null
                    friendly_name: string | null
                    vat_number: string | null
                    secondary_email: string | null
                    secondary_phone: string | null
                    country: string | null
                    region: string | null
                    timezone: string | null
                    currency: Database["public"]["Enums"]["currency_code"] | null
                    minimum_fee: number | null
                    tax_rate: number | null
                    payment_terms: string | null
                    po_filename_format: string | null
                    cat_tool: string | null
                    avatar_url: string | null
                    updated_at: string
                    default_currency: Database["public"]["Enums"]["currency_code"] | null
                    default_rate_project: number | null
                    payment_method: string | null
                    specialization: string[] | null
                    contact_name: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    default_rate_hour?: number | null
                    default_rate_word?: number | null
                    email?: string | null
                    id?: string
                    name: string
                    notes?: string | null
                    owner_id: string
                    phone?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    default_rate_hour?: number | null
                    default_rate_word?: number | null
                    email?: string | null
                    id?: string
                    name?: string
                    notes?: string | null
                    owner_id?: string
                    phone?: string | null
                    friendly_name?: string | null
                    vat_number?: string | null
                    secondary_email?: string | null
                    secondary_phone?: string | null
                    country?: string | null
                    region?: string | null
                    timezone?: string | null
                    currency?: Database["public"]["Enums"]["currency_code"] | null
                    minimum_fee?: number | null
                    tax_rate?: number | null
                    payment_terms?: string | null
                    po_filename_format?: string | null
                    cat_tool?: string | null
                    avatar_url?: string | null
                    updated_at?: string
                    default_currency?: Database["public"]["Enums"]["currency_code"] | null
                    default_rate_project?: number | null
                    payment_method?: string | null
                    specialization?: string[] | null
                    contact_name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "suppliers_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_activities: {
                Row: {
                    created_at: string
                    date: string
                    description: string | null
                    id: string
                    owner_id: string
                    subject: string
                    supplier_id: string
                    type: Database["public"]["Enums"]["activity_type"]
                }
                Insert: {
                    created_at?: string
                    date?: string
                    description?: string | null
                    id?: string
                    owner_id: string
                    subject: string
                    supplier_id: string
                    type?: Database["public"]["Enums"]["activity_type"]
                }
                Update: {
                    created_at?: string
                    date?: string
                    description?: string | null
                    id?: string
                    owner_id?: string
                    subject?: string
                    supplier_id?: string
                    type?: Database["public"]["Enums"]["activity_type"]
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_activities_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_activities_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_evaluations: {
                Row: {
                    comment: string | null
                    created_at: string
                    criteria: Json | null
                    id: string
                    job_id: string | null
                    owner_id: string
                    rating: number
                    supplier_id: string
                }
                Insert: {
                    comment?: string | null
                    created_at?: string
                    criteria?: Json | null
                    id?: string
                    job_id?: string | null
                    owner_id: string
                    rating: number
                    supplier_id: string
                }
                Update: {
                    comment?: string | null
                    created_at?: string
                    criteria?: Json | null
                    id?: string
                    job_id?: string | null
                    owner_id?: string
                    rating?: number
                    supplier_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_evaluations_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_evaluations_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_evaluations_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_language_pairs: {
                Row: {
                    created_at: string
                    id: string
                    owner_id: string
                    source_language: string
                    supplier_id: string
                    target_language: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    owner_id: string
                    source_language: string
                    supplier_id: string
                    target_language: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    owner_id?: string
                    source_language?: string
                    supplier_id?: string
                    target_language?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_language_pairs_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_language_pairs_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_domains: {
                Row: {
                    created_at: string
                    domain: string
                    id: string
                    owner_id: string
                    supplier_id: string
                }
                Insert: {
                    created_at?: string
                    domain: string
                    id?: string
                    owner_id: string
                    supplier_id: string
                }
                Update: {
                    created_at?: string
                    domain?: string
                    id?: string
                    owner_id?: string
                    supplier_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_domains_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_domains_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_preferred_clients: {
                Row: {
                    client_id: string
                    created_at: string
                    owner_id: string
                    supplier_id: string
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    owner_id: string
                    supplier_id: string
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    owner_id?: string
                    supplier_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_preferred_clients_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_preferred_clients_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_preferred_clients_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_files: {
                Row: {
                    created_at: string
                    file_name: string
                    file_size: number | null
                    file_type: string | null
                    id: string
                    owner_id: string
                    storage_path: string
                    supplier_id: string
                }
                Insert: {
                    created_at?: string
                    file_name: string
                    file_size?: number | null
                    file_type?: string | null
                    id?: string
                    owner_id: string
                    storage_path: string
                    supplier_id: string
                }
                Update: {
                    created_at?: string
                    file_name?: string
                    file_size?: number | null
                    file_type?: string | null
                    id?: string
                    owner_id?: string
                    storage_path?: string
                    supplier_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_files_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_files_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_labels: {
                Row: {
                    label_id: string
                    owner_id: string
                    supplier_id: string
                }
                Insert: {
                    label_id: string
                    owner_id: string
                    supplier_id: string
                }
                Update: {
                    label_id?: string
                    owner_id?: string
                    supplier_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_labels_label_id_fkey"
                        columns: ["label_id"]
                        referencedRelation: "labels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_labels_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_labels_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            supplier_rates: {
                Row: {
                    created_at: string
                    currency: string
                    id: string
                    owner_id: string
                    rate: number
                    service_name: string
                    supplier_id: string
                    unit: string
                }
                Insert: {
                    created_at?: string
                    currency?: string
                    id?: string
                    owner_id: string
                    rate: number
                    service_name: string
                    supplier_id: string
                    unit: string
                }
                Update: {
                    created_at?: string
                    currency?: string
                    id?: string
                    owner_id?: string
                    rate?: number
                    service_name?: string
                    supplier_id?: string
                    unit?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "supplier_rates_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "supplier_rates_supplier_id_fkey"
                        columns: ["supplier_id"]
                        referencedRelation: "suppliers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    address: string | null
                    company_name: string | null
                    created_at: string
                    currency_default: Database["public"]["Enums"]["currency_code"] | null
                    email: string
                    id: string
                    logo_url: string | null
                    name: string | null
                }
                Insert: {
                    address?: string | null
                    company_name?: string | null
                    created_at?: string
                    currency_default?: Database["public"]["Enums"]["currency_code"] | null
                    email: string
                    id: string
                    logo_url?: string | null
                    name?: string | null
                }
                Update: {
                    address?: string | null
                    company_name?: string | null
                    created_at?: string
                    currency_default?: Database["public"]["Enums"]["currency_code"] | null
                    email?: string
                    id?: string
                    logo_url?: string | null
                    name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_invoice_number: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            generate_job_code: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            is_owner: {
                Args: {
                    owner: string
                }
                Returns: boolean
            }
        }
        Enums: {
            activity_type: "email" | "call" | "meeting" | "note" | "other"
            currency_code: "USD" | "EUR" | "CAD" | "MAD" | "GBP"
            invoice_status: "draft" | "sent" | "paid" | "overdue"
            job_status:
            | "created"
            | "in_progress"
            | "finished"
            | "invoiced"
            | "cancelled"
            | "on_hold"
            notification_type: "jobs" | "invoices" | "deadlines" | "outsourcing"
            pricing_type: "per_word" | "per_hour" | "flat_fee"
            quote_status: "draft" | "sent" | "accepted" | "rejected"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
