export interface CompanyProfile {
  id: number;
  company_name: string;
  brand_name: string;
  slogan: string;
  address: string;
  city: string;
  postal_code: string;
  email: string;
  phone: string;
  website: string;
  npwp: string | null;
  nib: string | null;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  logo_path: string | null;
  stamp_signature_path: string | null;
  qr_verification_mode?: 'offline' | 'online';
  public_base_url?: string;
  updated_at?: string;
}

export interface Client {
  id: number;
  client_code: string;
  name: string;
  pic_name: string | null;
  pic_phone: string;
  pic_email: string | null;
  address: string | null;
  client_type: 'B2B' | 'B2G' | 'B2C' | 'UMKM';
  tax_number: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductService {
  id: number;
  code: string;
  name: string;
  category: 'SAAS' | 'IT_SERVICE' | 'HARDWARE' | 'LICENSE';
  description: string | null;
  default_price: number;
  billing_unit: string;
  is_active: number;
  created_at?: string;
}

export type DocumentType = 'QUOTATION' | 'INVOICE';
export type DocumentStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface DocumentItem {
  id?: number;
  document_id?: number;
  product_service_id?: number | null;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  sort_order?: number;
}

export interface Document {
  id: number;
  document_type: DocumentType;
  document_number: string;
  reference_number: string | null;
  client_id: number;
  issue_date: string;
  due_date: string | null;
  valid_until: string | null;
  payment_terms: string;
  status: DocumentStatus;
  
  subtotal: number;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  withholding_tax_rate: number;
  withholding_tax_amount: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  
  notes: string | null;
  payment_instructions: string | null;
  signed_by: string;
  signer_title: string;
  created_at?: string;
  updated_at?: string;
  
  // Joins
  client_name?: string;
  client_code?: string;
  client_address?: string;
  pic_name?: string;
  pic_phone?: string;
  pic_email?: string;
  items?: DocumentItem[];
}

export interface Payment {
  id: number;
  receipt_number: string;
  document_id: number;
  payment_date: string;
  amount: number;
  terbilang: string;
  payment_method: 'BANK_TRANSFER' | 'QRIS' | 'TUNAI';
  bank_destination: string | null;
  proof_reference: string | null;
  notes: string | null;
  received_by: string;
  created_at?: string;
  
  // Joins
  document_number?: string;
  document_type?: DocumentType;
  client_name?: string;
}

export interface DashboardMetrics {
  totalRevenueMonth: number;
  unpaidTotal: number;
  totalCashInflow: number;
  activeInvoicesCount: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
  activeQuotationsCount: number;
}

export type CompanyDocumentCategory =
  | 'AKTA'
  | 'KEMENKUMHAM'
  | 'NIB'
  | 'NPWP'
  | 'SPPKP'
  | 'KTP_DIREKSI'
  | 'REKENING_BANK'
  | 'SERTIFIKASI'
  | 'LAINNYA';

export interface CompanyDocument {
  id: number;
  document_category: CompanyDocumentCategory;
  title: string;
  document_number: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  issue_date: string | null;
  expiry_date: string | null;
  is_lifetime: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

