export type UserRole = 'admin' | 'gerant' | 'caissier' | 'stock' | 'comptable';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clerkId?: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  brandName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  siret: string;
  vatNumber: string; // Numéro TVA intracommunautaire
  rcs: string;
  apeCode: string;
  capital: string;
  iban: string;
  bic: string;
  defaultVatRate: number; // 5.5, 10, or 20
  invoicePrefix: string;
  quotePrefix: string;
  creditNotePrefix: string;
  lateFeeInterestRate: number; // e.g. 10%
  recoveryFee: number; // 40€ légal pro
  legalMentions: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface LocationArea {
  id: string;
  name: string;
  type: 'rayon' | 'chambre_froide' | 'reserve' | 'vitrine' | 'congelateur';
  targetTemp?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl?: string;
  categoryId: string;
  brand: string;
  primarySupplierId: string;
  unit: 'piece' | 'kg' | 'g' | 'litre' | 'cl' | 'barquette' | 'lot';
  packaging?: string;
  unitWeightKg?: number;
  barcodes: string[];
  priceHt: number;
  vatRate: 5.5 | 10 | 20;
  priceTtc: number;
  purchasePriceHt: number;
  marginPercent: number;
  pricePerKg?: number;
  isWeighable: boolean;
  isBio: boolean;
  isLocal: boolean;
  isAop: boolean;
  originCountry: string;
  allergens: string[];
  nutritionalInfo?: {
    caloriesKcal: number;
    fat: number;
    carbs: number;
    protein: number;
    salt: number;
  };
  dlcDdmDefaultDays: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  hasBatchManagement: boolean;
  currentStock: number;
  active: boolean;
  deletedAt?: string | null;
  version: number;
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string; // Numéro de lot fournisseur ou interne
  receptionDate: string; // YYYY-MM-DD
  manufacturingDate?: string;
  dlcDate: string; // Date Limite de Consommation
  ddmDate?: string; // Date de Durabilité Minimale
  initialQuantity: number;
  currentQuantity: number;
  unit: string;
  locationId: string;
  supplierId: string;
  purchaseOrderRef?: string;
  purchasePriceHt: number;
  status: 'conforme' | 'alerte_proche' | 'perime' | 'retire';
  notes?: string;
  deletedAt?: string | null;
}

export type MovementType =
  | 'entree'
  | 'sortie'
  | 'perte_casse'
  | 'peremption'
  | 'ajustement'
  | 'transfert'
  | 'retour_fournisseur';

export interface StockMovement {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number; // positive for in, negative for out
  unit: string;
  unitPriceHt: number;
  totalValueHt: number;
  reason: string;
  referenceDoc?: string; // Bon de commande, Ticket, Facture
  sourceLocation?: string;
  targetLocation?: string;
  createdBy: string;
  createdAt: string; // ISO string
}

export interface Supplier {
  id: string;
  name: string;
  type: 'producteur' | 'grossiste' | 'cooperative' | 'artisan';
  contactName: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  vatNumber?: string;
  paymentTermsDays: number; // 30j, 45j, 60j
  rating: number; // 1-5
  notes?: string;
  active: boolean;
  deletedAt?: string | null;
}

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
  unitPriceHt: number;
  vatRate: number;
  totalHt: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'brouillon' | 'envoye' | 'confirme' | 'recu_partiel' | 'recu_total' | 'annule';
  lines: PurchaseOrderLine[];
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  notes?: string;
  createdBy: string;
  deletedAt?: string | null;
}

export interface Customer {
  id: string;
  type: 'particulier' | 'professionnel';
  name: string;
  firstName?: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  siret?: string;
  vatNumber?: string;
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Argent' | 'Or';
  totalSpent: number;
  notes?: string;
  active: boolean;
  deletedAt?: string | null;
}

export interface SaleLine {
  id: string;
  productId: string;
  productName: string;
  isWeighable: boolean;
  quantity: number;
  weightKg?: number;
  unit: string;
  unitPriceHt: number;
  vatRate: number;
  discountPercent: number;
  totalHt: number;
  totalTtc: number;
  batchId?: string;
}

export interface Sale {
  id: string;
  ticketNumber: string;
  posSessionId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  date: string;
  lines: SaleLine[];
  subtotalHt: number;
  vatBreakdown: { rate: number; baseHt: number; vatAmount: number }[];
  totalTtc: number;
  paymentMethod: 'carte' | 'especes' | 'titre_resto' | 'virement' | 'mixte';
  cashGiven?: number;
  changeReturned?: number;
  status: 'payee' | 'annulee' | 'remboursee';
  invoiceId?: string;
}

export interface InvoiceLine {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  vatRate: 5.5 | 10 | 20;
  discountPercent: number;
  totalHt: number;
  totalTtc: number;
}

export interface InvoiceHistoryItem {
  timestamp: string;
  author: string;
  action: string;
  details?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Ex: FAC-2026-0001
  type: 'facture' | 'avoir' | 'acompte' | 'devis';
  originalInvoiceId?: string; // Si avoir
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerSiret?: string;
  customerVatNumber?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lines: InvoiceLine[];
  discountTotal: number;
  shippingCostHt: number;
  subtotalHt: number;
  vatBreakdown: { rate: number; baseHt: number; vatAmount: number }[];
  totalTtc: number;
  paidAmount: number;
  paymentStatus: 'brouillon' | 'en_attente' | 'payee' | 'partiellement_payee' | 'en_retard' | 'annulee';
  paymentMethod: string;
  paymentTerms: string;
  legalMentions: string;
  isLocked: boolean; // Once validated/locked, edit requires duplicate or credit note
  notes?: string;
  history: InvoiceHistoryItem[];
  deletedAt?: string | null;
}

export interface StockCountLine {
  id: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  theoreticalQty: number;
  countedQty: number;
  differenceQty: number;
  differenceValueHt: number;
  unit: string;
}

export interface StockCount {
  id: string;
  name: string;
  type: 'tournant' | 'partiel' | 'complet';
  date: string;
  status: 'en_cours' | 'valide' | 'annule';
  lines: StockCountLine[];
  validatedBy?: string;
  validatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  entity: string;
  entityId: string;
  action: 'create' | 'update' | 'rename' | 'delete' | 'restore';
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface TrashItem {
  id: string;
  entityType: 'product' | 'supplier' | 'customer' | 'invoice' | 'purchaseOrder' | 'batch';
  entityId: string;
  title: string;
  deletedAt: string;
  deletedBy: string;
  data: any;
}
