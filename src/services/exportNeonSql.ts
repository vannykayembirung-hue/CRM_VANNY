export const NEON_POSTGRES_SCHEMA_SQL = `-- =============================================================================
-- SAVEURS & TERROIRS - SCHEMA POSTGRESQL POUR NEON (SERVERLESS POSTGRES)
-- Compatible Vercel Serverless, Node.js TypeScript Backend & Prisma / Drizzle
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES / SETTINGS
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'France',
    phone VARCHAR(50),
    email VARCHAR(255),
    siret VARCHAR(30) NOT NULL,
    vat_number VARCHAR(30) NOT NULL,
    rcs VARCHAR(100),
    ape_code VARCHAR(100),
    capital VARCHAR(50),
    iban VARCHAR(50),
    bic VARCHAR(20),
    default_vat_rate NUMERIC(4, 2) DEFAULT 5.50,
    invoice_prefix VARCHAR(20) DEFAULT 'FAC-2026-',
    quote_prefix VARCHAR(20) DEFAULT 'DEV-2026-',
    credit_note_prefix VARCHAR(20) DEFAULT 'AV-2026-',
    late_fee_rate NUMERIC(5, 2) DEFAULT 10.50,
    recovery_fee NUMERIC(6, 2) DEFAULT 40.00,
    legal_mentions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (CLERK SYNCHRONIZED)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    clerk_id VARCHAR(128) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'caissier', -- admin, gerant, caissier, stock, comptable
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) DEFAULT 'producteur',
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    siret VARCHAR(30),
    vat_number VARCHAR(30),
    payment_terms_days INTEGER DEFAULT 30,
    rating INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. PRODUCTS (ARTICLES)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(128),
    primary_supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
    unit VARCHAR(32) NOT NULL DEFAULT 'piece', -- piece, kg, g, litre, cl, lot
    packaging VARCHAR(64),
    unit_weight_kg NUMERIC(8, 3),
    barcodes TEXT[] DEFAULT '{}',
    price_ht NUMERIC(10, 2) NOT NULL,
    vat_rate NUMERIC(4, 2) NOT NULL DEFAULT 5.50, -- 5.5, 10, 20
    price_ttc NUMERIC(10, 2) NOT NULL,
    purchase_price_ht NUMERIC(10, 2) NOT NULL,
    margin_percent NUMERIC(5, 2) DEFAULT 0,
    price_per_kg NUMERIC(10, 2),
    is_weighable BOOLEAN DEFAULT FALSE,
    is_bio BOOLEAN DEFAULT FALSE,
    is_local BOOLEAN DEFAULT FALSE,
    is_aop BOOLEAN DEFAULT FALSE,
    origin_country VARCHAR(100) DEFAULT 'France',
    allergens TEXT[] DEFAULT '{}',
    dlc_ddm_default_days INTEGER DEFAULT 30,
    min_stock NUMERIC(10, 2) DEFAULT 5,
    max_stock NUMERIC(10, 2) DEFAULT 50,
    reorder_point NUMERIC(10, 2) DEFAULT 10,
    has_batch_management BOOLEAN DEFAULT TRUE,
    current_stock NUMERIC(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- 6. BATCHES (LOTS AVEC DLC/DDM)
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(128) NOT NULL,
    reception_date DATE NOT NULL,
    manufacturing_date DATE,
    dlc_date DATE NOT NULL,
    ddm_date DATE,
    initial_quantity NUMERIC(10, 2) NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    location_id VARCHAR(64),
    supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_order_ref VARCHAR(64),
    purchase_price_ht NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'conforme', -- conforme, alerte_proche, perime, retire
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_dlc ON batches(dlc_date);

-- 7. STOCK MOVEMENTS (ENTREES, SORTIES, PERTES, RECEPTIONS)
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL, -- entree, sortie, perte_casse, peremption, ajustement, transfert
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    batch_id VARCHAR(64) REFERENCES batches(id) ON DELETE SET NULL,
    batch_number VARCHAR(128),
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    unit_price_ht NUMERIC(10, 2) NOT NULL,
    total_value_ht NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    reference_doc VARCHAR(128),
    source_location VARCHAR(64),
    target_location VARCHAR(64),
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);

-- 8. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) DEFAULT 'particulier', -- particulier, professionnel
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    siret VARCHAR(30),
    vat_number VARCHAR(30),
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(32) DEFAULT 'Bronze',
    total_spent NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. INVOICES (FACTURATION LEGALE FRANCAISE)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'facture', -- facture, avoir, acompte, devis
    original_invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_siret VARCHAR(30),
    customer_vat_number VARCHAR(30),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_ht NUMERIC(12, 2) NOT NULL,
    discount_total NUMERIC(10, 2) DEFAULT 0,
    shipping_cost_ht NUMERIC(10, 2) DEFAULT 0,
    vat_breakdown JSONB NOT NULL DEFAULT '[]',
    total_ttc NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    payment_status VARCHAR(32) DEFAULT 'brouillon', -- brouillon, en_attente, payee, partiellement_payee, en_retard, annulee
    payment_method VARCHAR(64) DEFAULT 'Virement bancaire SEPA',
    payment_terms TEXT,
    legal_mentions TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    unit_price_ht NUMERIC(10, 2) NOT NULL,
    vat_rate NUMERIC(4, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    total_ht NUMERIC(10, 2) NOT NULL,
    total_ttc NUMERIC(10, 2) NOT NULL
);

-- 10. SALES / POS TICKETS
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(64) UNIQUE NOT NULL,
    cashier_name VARCHAR(128) NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal_ht NUMERIC(10, 2) NOT NULL,
    total_ttc NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    cash_given NUMERIC(10, 2),
    change_returned NUMERIC(10, 2),
    status VARCHAR(32) DEFAULT 'payee',
    invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE SET NULL
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL, -- create, update, rename, delete, restore
    details TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
`;

export const VERCEL_JSON_CONFIG = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "DATABASE_URL": "@neon_database_url",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk_publishable_key",
    "CLERK_SECRET_KEY": "@clerk_secret_key"
  }
}`;

export const PRISMA_SCHEMA = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Store {
  id               String   @id @default(uuid())
  name             String
  brandName        String
  address          String
  city             String
  postalCode       String
  siret            String
  vatNumber        String
  rcs              String
  apeCode          String
  defaultVatRate   Decimal  @default(5.50)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Product {
  id               String          @id @default(uuid())
  sku              String          @unique
  name             String
  description      String?
  imageUrl         String?
  categoryId       String?
  brand            String?
  unit             String          @default("piece")
  priceHt          Decimal
  vatRate          Decimal         @default(5.50)
  priceTtc         Decimal
  purchasePriceHt  Decimal
  isWeighable      Boolean         @default(false)
  isBio            Boolean         @default(false)
  isLocal          Boolean         @default(false)
  isAop            Boolean         @default(false)
  currentStock     Decimal         @default(0)
  batches          Batch[]
  movements        StockMovement[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  deletedAt        DateTime?
}

model Batch {
  id               String          @id @default(uuid())
  productId        String
  product          Product         @relation(fields: [productId], references: [id])
  batchNumber      String
  receptionDate    DateTime
  dlcDate          DateTime
  ddmDate          DateTime?
  initialQuantity  Decimal
  currentQuantity  Decimal
  unit             String
  status           String          @default("conforme")
  movements        StockMovement[]
  createdAt        DateTime        @default(now())
}

model StockMovement {
  id           String   @id @default(uuid())
  type         String
  productId    String
  product      Product  @relation(fields: [productId], references: [id])
  batchId      String?
  batch        Batch?   @relation(fields: [batchId], references: [id])
  quantity     Decimal
  unit         String
  unitPriceHt  Decimal
  totalValueHt Decimal
  reason       String
  createdAt    DateTime @default(now())
}

model Invoice {
  id             String        @id @default(uuid())
  invoiceNumber  String        @unique
  type           String        @default("facture")
  customerId     String
  customerName   String
  issueDate      DateTime
  dueDate        DateTime
  subtotalHt     Decimal
  totalTtc       Decimal
  paymentStatus  String        @default("brouillon")
  isLocked       Boolean       @default(false)
  lines          InvoiceLine[]
  createdAt      DateTime      @default(now())
}

model InvoiceLine {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Decimal
  unitPriceHt Decimal
  vatRate     Decimal
  totalHt     Decimal
  totalTtc    Decimal
}
`;
