import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Batch,
  StockMovement,
  Supplier,
  Customer,
  Invoice,
  InvoiceLine,
  PurchaseOrder,
  AuditLog,
  TrashItem,
  User,
  UserRole,
  StoreSettings,
  Sale,
  MovementType,
} from '../types';
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_MOVEMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDIT_LOGS,
} from './seedData';

interface StoreContextType {
  // Current user & Auth (Clerk)
  currentUser: User;
  setCurrentUserRole: (role: UserRole) => void;
  users: User[];
  clerkPublishableKey: string;
  setClerkPublishableKey: (key: string) => void;

  // Neon DB Config
  neonDatabaseUrl: string;
  setNeonDatabaseUrl: (url: string) => void;
  isNeonConnected: boolean;
  setIsNeonConnected: (connected: boolean) => void;

  // Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  // Categories & Locations
  categories: { id: string; name: string; description?: string }[];
  locations: { id: string; name: string; type: string; targetTemp?: string }[];
  addCategory: (name: string, description?: string) => void;
  renameCategory: (id: string, newName: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'currentStock' | 'version'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  renameProduct: (id: string, newName: string) => void;
  deleteProduct: (id: string) => void;

  // Batches (Lots & DLC/DDM)
  batches: Batch[];
  addBatch: (batch: Omit<Batch, 'id' | 'status'>) => Batch;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  markBatchWaste: (batchId: string, quantity: number, reason: string) => void;

  // Stock Movements
  movements: StockMovement[];
  addMovement: (movement: {
    type: MovementType;
    productId: string;
    batchId?: string;
    quantity: number;
    reason: string;
    referenceDoc?: string;
    sourceLocation?: string;
    targetLocation?: string;
  }) => void;

  // Invoices
  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'history'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  lockInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => Invoice;
  createCreditNote: (originalInvoiceId: string, reason: string) => Invoice;
  deleteInvoice: (id: string) => void;

  // Suppliers & Purchase Orders
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'active'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'orderNumber'>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string, batchNumberPrefix?: string) => void;

  // Customers & Loyalty
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'loyaltyTier' | 'totalSpent' | 'active'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // POS / Sales
  sales: Sale[];
  processSale: (saleData: {
    lines: {
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
    }[];
    customerId?: string;
    paymentMethod: 'carte' | 'especes' | 'titre_resto' | 'virement' | 'mixte';
    cashGiven?: number;
    changeReturned?: number;
  }) => Sale;

  // Transversal: Rename any entity
  renameEntity: (entityType: string, entityId: string, newName: string) => void;

  // Audit Log & Trash
  auditLogs: AuditLog[];
  trashItems: TrashItem[];
  restoreFromTrash: (trashId: string) => void;
  emptyTrashItem: (trashId: string) => void;
  clearTrash: () => void;

  // Reset to default seeds
  resetToSeeds: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'saveurs_terroirs_crm_db_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from local storage or fallback to seed
  const [currentUser, setCurrentUser] = useState<User>(() => INITIAL_USERS[0]);
  const [clerkPublishableKey, setClerkPublishableKey] = useState<string>(
    'pk_test_Y2xlcmsuZXBpY2VyaWUtZmluZS5kZXYk'
  );
  const [neonDatabaseUrl, setNeonDatabaseUrl] = useState<string>(
    'postgresql://neondb_owner:npg_xY8a9KzWqL21@ep-sweet-glade-a2y9k0e8.eu-central-1.aws.neon.tech/neondb?sslmode=require'
  );
  const [isNeonConnected, setIsNeonConnected] = useState<boolean>(true);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
  });

  const [categories, setCategories] = useState<{ id: string; name: string; description?: string }[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [locations, setLocations] = useState(INITIAL_LOCATIONS);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_batches`);
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pos`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_trash`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(storeSettings));
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_batches`, JSON.stringify(batches));
    localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(movements));
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${STORAGE_KEY}_pos`, JSON.stringify(purchaseOrders));
    localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    localStorage.setItem(`${STORAGE_KEY}_trash`, JSON.stringify(trashItems));
  }, [storeSettings, categories, products, batches, movements, suppliers, customers, invoices, purchaseOrders, sales, auditLogs, trashItems]);

  const addAuditLog = (action: AuditLog['action'], entity: string, entityId: string, details: string, oldValue?: string, newValue?: string) => {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      entity,
      entityId,
      action,
      details,
      oldValue,
      newValue,
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const setCurrentUserRole = (role: UserRole) => {
    const found = INITIAL_USERS.find((u) => u.role === role) || {
      id: `user-${role}`,
      name: `Utilisateur ${role.toUpperCase()}`,
      email: `${role}@saveurs-terroirs.fr`,
      role,
    };
    setCurrentUser(found);
    addAuditLog('update', 'user', found.id, `Changement de rôle session vers ${role.toUpperCase()}`);
  };

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated = { ...prev, ...updates };
      addAuditLog('update', 'storeSettings', prev.id, 'Modification des paramètres boutique');
      return updated;
    });
  };

  const addCategory = (name: string, description?: string) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      description,
    };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog('create', 'category', newCat.id, `Création de la catégorie: ${name}`);
  };

  const renameCategory = (id: string, newName: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === id) {
          const old = cat.name;
          addAuditLog('rename', 'category', id, `Renommage catégorie "${old}" -> "${newName}"`, old, newName);
          return { ...cat, name: newName };
        }
        return cat;
      })
    );
  };

  // PRODUCTS
  const addProduct = (prodData: Omit<Product, 'id' | 'currentStock' | 'version'>): Product => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...prodData,
      id: newId,
      currentStock: 0,
      version: 1,
    };
    setProducts((prev) => [newProduct, ...prev]);
    addAuditLog('create', 'product', newId, `Création de l'article "${newProduct.name}" (SKU: ${newProduct.sku})`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, version: p.version + 1 };
          addAuditLog('update', 'product', id, `Mise à jour article "${updated.name}"`);
          return updated;
        }
        return p;
      })
    );
  };

  const renameProduct = (id: string, newName: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const old = p.name;
          addAuditLog('rename', 'product', id, `Renommage article "${old}" -> "${newName}"`, old, newName);
          return { ...p, name: newName, version: p.version + 1 };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const productToDelete = products.find((p) => p.id === id);
    if (!productToDelete) return;

    setProducts((prev) => prev.filter((p) => p.id !== id));
    const trashItem: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'product',
      entityId: id,
      title: productToDelete.name,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name,
      data: productToDelete,
    };
    setTrashItems((prev) => [trashItem, ...prev]);
    addAuditLog('delete', 'product', id, `Déplacement en corbeille de l'article "${productToDelete.name}"`);
  };

  // BATCHES & FEFO
  const addBatch = (batchData: Omit<Batch, 'id' | 'status'>): Batch => {
    const newId = `batch-${Date.now()}`;
    // Evaluate status based on DLC
    const dlc = new Date(batchData.dlcDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((dlc - now) / (1000 * 60 * 60 * 24));
    let status: Batch['status'] = 'conforme';
    if (diffDays <= 0) status = 'perime';
    else if (diffDays <= 7) status = 'alerte_proche';

    const newBatch: Batch = {
      ...batchData,
      id: newId,
      status,
    };

    setBatches((prev) => [newBatch, ...prev]);

    // Recalculate product current stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === batchData.productId) {
          return { ...p, currentStock: Math.round((p.currentStock + batchData.initialQuantity) * 100) / 100 };
        }
        return p;
      })
    );

    addAuditLog('create', 'batch', newId, `Création lot n° ${newBatch.batchNumber} (DLC: ${newBatch.dlcDate})`);
    return newBatch;
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, ...updates };
          addAuditLog('update', 'batch', id, `Mise à jour lot "${updated.batchNumber}"`);
          return updated;
        }
        return b;
      })
    );
  };

  const markBatchWaste = (batchId: string, quantity: number, reason: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    const prod = products.find((p) => p.id === batch.productId);
    const prodName = prod ? prod.name : 'Produit inconnu';

    const actualQty = Math.min(quantity, batch.currentQuantity);
    const updatedBatchQty = Math.max(0, batch.currentQuantity - actualQty);

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            currentQuantity: updatedBatchQty,
            status: updatedBatchQty === 0 ? 'retire' : b.status,
          };
        }
        return b;
      })
    );

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === batch.productId) {
          return { ...p, currentStock: Math.max(0, Math.round((p.currentStock - actualQty) * 100) / 100) };
        }
        return p;
      })
    );

    // Record stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      type: 'peremption',
      productId: batch.productId,
      productName: prodName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: -actualQty,
      unit: batch.unit,
      unitPriceHt: batch.purchasePriceHt,
      totalValueHt: Math.round(actualQty * batch.purchasePriceHt * 100) / 100,
      reason: `Démarque/Péremption: ${reason}`,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setMovements((prev) => [movement, ...prev]);

    addAuditLog('update', 'batch', batchId, `Démarque de ${actualQty} ${batch.unit} sur lot ${batch.batchNumber}: ${reason}`);
  };

  // MOVEMENTS
  const addMovement = (data: {
    type: MovementType;
    productId: string;
    batchId?: string;
    quantity: number;
    reason: string;
    referenceDoc?: string;
    sourceLocation?: string;
    targetLocation?: string;
  }) => {
    const prod = products.find((p) => p.id === data.productId);
    if (!prod) return;

    let batch = data.batchId ? batches.find((b) => b.id === data.batchId) : undefined;

    // If it's an exit or sale and no specific batch is picked, use FEFO (earliest DLC first)
    if (!batch && (data.type === 'sortie' || data.type === 'perte_casse' || data.type === 'peremption')) {
      const activeBatches = batches
        .filter((b) => b.productId === data.productId && b.currentQuantity > 0)
        .sort((a, b) => new Date(a.dlcDate).getTime() - new Date(b.dlcDate).getTime());
      if (activeBatches.length > 0) {
        batch = activeBatches[0];
      }
    }

    const unitPrice = batch ? batch.purchasePriceHt : prod.purchasePriceHt;
    const absQty = Math.abs(data.quantity);
    const sign = data.type === 'entree' ? 1 : -1;
    const finalQty = sign * absQty;
    const totalVal = Math.round(absQty * unitPrice * 100) / 100;

    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      type: data.type,
      productId: data.productId,
      productName: prod.name,
      batchId: batch?.id,
      batchNumber: batch?.batchNumber,
      quantity: finalQty,
      unit: prod.unit,
      unitPriceHt: unitPrice,
      totalValueHt: totalVal,
      reason: data.reason,
      referenceDoc: data.referenceDoc,
      sourceLocation: data.sourceLocation,
      targetLocation: data.targetLocation,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setMovements((prev) => [newMov, ...prev]);

    // Update batch quantity if applicable
    if (batch) {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id === batch!.id) {
            const nextQty = Math.max(0, Math.round((b.currentQuantity + finalQty) * 100) / 100);
            return {
              ...b,
              currentQuantity: nextQty,
              status: nextQty === 0 ? 'retire' : b.status,
            };
          }
          return b;
        })
      );
    }

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === data.productId) {
          const nextStock = Math.max(0, Math.round((p.currentStock + finalQty) * 100) / 100);
          return { ...p, currentStock: nextStock, version: p.version + 1 };
        }
        return p;
      })
    );

    addAuditLog('create', 'movement', newMov.id, `Mouvement ${data.type.toUpperCase()}: ${finalQty} ${prod.unit} sur "${prod.name}" (${data.reason})`);
  };

  // INVOICES
  const createInvoice = (invData: Omit<Invoice, 'id' | 'invoiceNumber' | 'history'>): Invoice => {
    const seq = invoices.filter((i) => i.type === invData.type).length + 1;
    const prefix = invData.type === 'avoir' ? storeSettings.creditNotePrefix : storeSettings.invoicePrefix;
    const formattedSeq = String(seq).padStart(4, '0');
    const invoiceNumber = `${prefix}${formattedSeq}`;

    const newInv: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      history: [
        {
          timestamp: new Date().toISOString(),
          author: currentUser.name,
          action: `Création initiale du document (${invData.type})`,
        },
      ],
    };

    setInvoices((prev) => [newInv, ...prev]);
    addAuditLog('create', 'invoice', newInv.id, `Création ${invData.type.toUpperCase()} n° ${invoiceNumber} pour client "${invData.customerName}"`);
    return newInv;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          if (inv.isLocked && updates.lines) {
            // Cannot modify lines of a locked invoice!
            console.warn('Cannot update lines of locked invoice');
            return inv;
          }
          const updated: Invoice = {
            ...inv,
            ...updates,
            history: [
              ...inv.history,
              {
                timestamp: new Date().toISOString(),
                author: currentUser.name,
                action: 'Modification document',
                details: updates.paymentStatus ? `Statut passé à ${updates.paymentStatus}` : undefined,
              },
            ],
          };
          addAuditLog('update', 'invoice', id, `Modification facture n° ${inv.invoiceNumber}`);
          return updated;
        }
        return inv;
      })
    );
  };

  const lockInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const updated: Invoice = {
            ...inv,
            isLocked: true,
            history: [
              ...inv.history,
              {
                timestamp: new Date().toISOString(),
                author: currentUser.name,
                action: 'Validation et verrouillage légal',
              },
            ],
          };
          addAuditLog('update', 'invoice', id, `Verrouillage légal de la facture ${inv.invoiceNumber}`);
          return updated;
        }
        return inv;
      })
    );
  };

  const duplicateInvoice = (id: string): Invoice => {
    const original = invoices.find((i) => i.id === id);
    if (!original) throw new Error('Invoice not found');

    const nextSeq = invoices.filter((i) => i.type === original.type).length + 1;
    const prefix = original.type === 'avoir' ? storeSettings.creditNotePrefix : storeSettings.invoicePrefix;
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    const duplicate: Invoice = {
      ...original,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      isLocked: false,
      paymentStatus: 'brouillon',
      paidAmount: 0,
      history: [
        {
          timestamp: new Date().toISOString(),
          author: currentUser.name,
          action: `Duplicata créé à partir de la facture ${original.invoiceNumber}`,
        },
      ],
    };

    setInvoices((prev) => [duplicate, ...prev]);
    addAuditLog('create', 'invoice', duplicate.id, `Duplication de la facture ${original.invoiceNumber} vers ${invoiceNumber}`);
    return duplicate;
  };

  const createCreditNote = (originalInvoiceId: string, reason: string): Invoice => {
    const original = invoices.find((i) => i.id === originalInvoiceId);
    if (!original) throw new Error('Original invoice not found');

    const nextSeq = invoices.filter((i) => i.type === 'avoir').length + 1;
    const invoiceNumber = `${storeSettings.creditNotePrefix}${String(nextSeq).padStart(4, '0')}`;

    // Negative amounts or matching lines for credit note
    const creditLines: InvoiceLine[] = original.lines.map((l) => ({
      ...l,
      id: `crl-${Date.now()}-${Math.random()}`,
      description: `[AVOIR] ${l.description}`,
    }));

    const creditNote: Invoice = {
      id: `inv-cn-${Date.now()}`,
      invoiceNumber,
      type: 'avoir',
      originalInvoiceId,
      customerId: original.customerId,
      customerName: original.customerName,
      customerAddress: original.customerAddress,
      customerSiret: original.customerSiret,
      customerVatNumber: original.customerVatNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      lines: creditLines,
      discountTotal: original.discountTotal,
      shippingCostHt: 0,
      subtotalHt: original.subtotalHt,
      vatBreakdown: original.vatBreakdown,
      totalTtc: original.totalTtc,
      paidAmount: original.totalTtc,
      paymentStatus: 'payee',
      paymentMethod: 'Avoir en compte',
      paymentTerms: 'Remboursement ou imputation sur facture ultérieure.',
      legalMentions: `Avoir se référant à la facture ${original.invoiceNumber}. Motif: ${reason}`,
      isLocked: true,
      notes: `Motif de l'avoir: ${reason}`,
      history: [
        {
          timestamp: new Date().toISOString(),
          author: currentUser.name,
          action: `Émission de l'avoir sur facture ${original.invoiceNumber} (${reason})`,
        },
      ],
    };

    setInvoices((prev) => [creditNote, ...prev]);
    addAuditLog('create', 'invoice', creditNote.id, `Émission d'un Avoir ${invoiceNumber} sur facture ${original.invoiceNumber} (${reason})`);
    return creditNote;
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    if (inv.isLocked) {
      alert('Conformité légale française : Une facture validée et émise ne peut pas être supprimée ! Veuillez émettre un avoir.');
      return;
    }
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    addAuditLog('delete', 'invoice', id, `Suppression du brouillon de facture ${inv.invoiceNumber}`);
  };

  // SUPPLIERS
  const addSupplier = (supData: Omit<Supplier, 'id' | 'active'>): Supplier => {
    const newId = `sup-${Date.now()}`;
    const newSup: Supplier = {
      ...supData,
      id: newId,
      active: true,
    };
    setSuppliers((prev) => [...prev, newSup]);
    addAuditLog('create', 'supplier', newId, `Création fournisseur "${newSup.name}"`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          addAuditLog('update', 'supplier', id, `Mise à jour fournisseur "${updated.name}"`);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find((s) => s.id === id);
    if (!sup) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    const trashItem: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'supplier',
      entityId: id,
      title: sup.name,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name,
      data: sup,
    };
    setTrashItems((prev) => [trashItem, ...prev]);
    addAuditLog('delete', 'supplier', id, `Mise en corbeille fournisseur "${sup.name}"`);
  };

  // PURCHASE ORDERS & AUTO-RECEPTION (generating batches & stock entries)
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'orderNumber'>): PurchaseOrder => {
    const newId = `po-${Date.now()}`;
    const seq = purchaseOrders.length + 1;
    const orderNumber = `BC-2026-${String(seq).padStart(4, '0')}`;
    const newPo: PurchaseOrder = {
      ...poData,
      id: newId,
      orderNumber,
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    addAuditLog('create', 'purchaseOrder', newId, `Création bon de commande ${orderNumber} (${poData.supplierName})`);
    return newPo;
  };

  const receivePurchaseOrder = (poId: string, batchNumberPrefix = 'LOT-REC') => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    po.lines.forEach((line) => {
      const prod = products.find((p) => p.id === line.productId);
      const days = prod?.dlcDdmDefaultDays || 30;
      const dlcDate = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().split('T')[0];

      // Auto create batch
      const newBatch = addBatch({
        productId: line.productId,
        batchNumber: `${batchNumberPrefix}-${line.productId.slice(-4)}-${Date.now().toString().slice(-4)}`,
        receptionDate: new Date().toISOString().split('T')[0],
        dlcDate,
        initialQuantity: line.quantityOrdered,
        currentQuantity: line.quantityOrdered,
        unit: line.unit,
        locationId: 'loc-02', // Chambre froide or réserve
        supplierId: po.supplierId,
        purchaseOrderRef: po.orderNumber,
        purchasePriceHt: line.unitPriceHt,
      });

      // Record Stock movement (Entrée)
      const mov: StockMovement = {
        id: `mov-${Date.now()}-${Math.random()}`,
        type: 'entree',
        productId: line.productId,
        productName: line.productName,
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        quantity: line.quantityOrdered,
        unit: line.unit,
        unitPriceHt: line.unitPriceHt,
        totalValueHt: Math.round(line.quantityOrdered * line.unitPriceHt * 100) / 100,
        reason: `Réception Bon de Commande ${po.orderNumber}`,
        referenceDoc: po.orderNumber,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [mov, ...prev]);
    });

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          return {
            ...p,
            status: 'recu_total',
            lines: p.lines.map((l) => ({ ...l, quantityReceived: l.quantityOrdered })),
          };
        }
        return p;
      })
    );

    addAuditLog('update', 'purchaseOrder', poId, `Réception totale bon de commande ${po.orderNumber} et génération automatique des lots`);
  };

  // CUSTOMERS
  const addCustomer = (custData: Omit<Customer, 'id' | 'loyaltyPoints' | 'loyaltyTier' | 'totalSpent' | 'active'>): Customer => {
    const newId = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...custData,
      id: newId,
      loyaltyPoints: 10, // welcome bonus
      loyaltyTier: 'Bronze',
      totalSpent: 0,
      active: true,
    };
    setCustomers((prev) => [...prev, newCust]);
    addAuditLog('create', 'customer', newId, `Création client "${newCust.name} ${newCust.firstName || ''}"`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          addAuditLog('update', 'customer', id, `Mise à jour client "${updated.name}"`);
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    const trashItem: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'customer',
      entityId: id,
      title: `${cust.name} ${cust.firstName || ''}`,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name,
      data: cust,
    };
    setTrashItems((prev) => [trashItem, ...prev]);
    addAuditLog('delete', 'customer', id, `Mise en corbeille client "${cust.name}"`);
  };

  // POS / TOUCHSCREEN SALES
  const processSale = (saleData: {
    lines: {
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
    }[];
    customerId?: string;
    paymentMethod: 'carte' | 'especes' | 'titre_resto' | 'virement' | 'mixte';
    cashGiven?: number;
    changeReturned?: number;
  }): Sale => {
    const ticketSeq = sales.length + 1045;
    const ticketNumber = `TK-${ticketSeq}`;

    // VAT breakdown
    const vatMap = new Map<number, { baseHt: number; vatAmount: number }>();
    let subtotalHt = 0;
    let totalTtc = 0;

    saleData.lines.forEach((line) => {
      subtotalHt += line.totalHt;
      totalTtc += line.totalTtc;
      const rate = line.vatRate;
      const current = vatMap.get(rate) || { baseHt: 0, vatAmount: 0 };
      const vatAmount = line.totalTtc - line.totalHt;
      vatMap.set(rate, {
        baseHt: Math.round((current.baseHt + line.totalHt) * 100) / 100,
        vatAmount: Math.round((current.vatAmount + vatAmount) * 100) / 100,
      });

      // Deduct stock and record movement via FEFO
      const qtyToDeduct = line.isWeighable ? (line.weightKg || line.quantity) : line.quantity;
      addMovement({
        type: 'sortie',
        productId: line.productId,
        batchId: line.batchId,
        quantity: -qtyToDeduct,
        reason: `Vente caisse ticket ${ticketNumber}`,
        referenceDoc: ticketNumber,
      });
    });

    const vatBreakdown = Array.from(vatMap.entries()).map(([rate, vals]) => ({
      rate,
      baseHt: vals.baseHt,
      vatAmount: vals.vatAmount,
    }));

    const cust = saleData.customerId ? customers.find((c) => c.id === saleData.customerId) : undefined;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      ticketNumber,
      posSessionId: 'pos-session-active',
      cashierName: currentUser.name,
      customerId: saleData.customerId,
      customerName: cust ? `${cust.name} ${cust.firstName || ''}` : undefined,
      date: new Date().toISOString(),
      lines: saleData.lines.map((l, i) => ({ ...l, id: `sl-${Date.now()}-${i}` })),
      subtotalHt: Math.round(subtotalHt * 100) / 100,
      vatBreakdown,
      totalTtc: Math.round(totalTtc * 100) / 100,
      paymentMethod: saleData.paymentMethod,
      cashGiven: saleData.cashGiven,
      changeReturned: saleData.changeReturned,
      status: 'payee',
    };

    setSales((prev) => [newSale, ...prev]);

    // Update customer loyalty points and total spent if linked
    if (cust) {
      const pointsEarned = Math.floor(newSale.totalTtc); // 1€ = 1 pt
      const newTotalSpent = cust.totalSpent + newSale.totalTtc;
      let tier: Customer['loyaltyTier'] = 'Bronze';
      if (newTotalSpent >= 1000) tier = 'Or';
      else if (newTotalSpent >= 300) tier = 'Argent';

      updateCustomer(cust.id, {
        loyaltyPoints: cust.loyaltyPoints + pointsEarned,
        totalSpent: Math.round(newTotalSpent * 100) / 100,
        loyaltyTier: tier,
      });
    }

    addAuditLog('create', 'sale', newSale.id, `Encaissement ticket ${ticketNumber} (${newSale.totalTtc.toFixed(2)} € en ${saleData.paymentMethod})`);
    return newSale;
  };

  // TRANSVERSAL RENAME FOR ANY ENTITY
  const renameEntity = (entityType: string, entityId: string, newName: string) => {
    switch (entityType) {
      case 'product':
        renameProduct(entityId, newName);
        break;
      case 'category':
        renameCategory(entityId, newName);
        break;
      case 'supplier': {
        const sup = suppliers.find((s) => s.id === entityId);
        if (sup) {
          const old = sup.name;
          updateSupplier(entityId, { name: newName });
          addAuditLog('rename', 'supplier', entityId, `Renommage fournisseur "${old}" -> "${newName}"`, old, newName);
        }
        break;
      }
      case 'customer': {
        const cust = customers.find((c) => c.id === entityId);
        if (cust) {
          const old = cust.name;
          updateCustomer(entityId, { name: newName });
          addAuditLog('rename', 'customer', entityId, `Renommage client "${old}" -> "${newName}"`, old, newName);
        }
        break;
      }
      case 'store':
        updateStoreSettings({ brandName: newName });
        break;
      default:
        console.warn(`Entity type ${entityType} not supported for generic rename`);
    }
  };

  // TRASH RESTORATION & EMPTY
  const restoreFromTrash = (trashId: string) => {
    const item = trashItems.find((t) => t.id === trashId);
    if (!item) return;

    if (item.entityType === 'product') {
      setProducts((prev) => [item.data, ...prev]);
    } else if (item.entityType === 'supplier') {
      setSuppliers((prev) => [item.data, ...prev]);
    } else if (item.entityType === 'customer') {
      setCustomers((prev) => [item.data, ...prev]);
    }

    setTrashItems((prev) => prev.filter((t) => t.id !== trashId));
    addAuditLog('restore', item.entityType, item.entityId, `Restauration depuis la corbeille de "${item.title}"`);
  };

  const emptyTrashItem = (trashId: string) => {
    const item = trashItems.find((t) => t.id === trashId);
    if (!item) return;
    setTrashItems((prev) => prev.filter((t) => t.id !== trashId));
    addAuditLog('delete', item.entityType, item.entityId, `Suppression définitive de "${item.title}"`);
  };

  const clearTrash = () => {
    setTrashItems([]);
    addAuditLog('delete', 'trash', 'all', 'Vidage complet de la corbeille');
  };

  const resetToSeeds = () => {
    localStorage.clear();
    setStoreSettings(INITIAL_STORE_SETTINGS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setBatches(INITIAL_BATCHES);
    setMovements(INITIAL_MOVEMENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setSales([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setTrashItems([]);
    addAuditLog('restore', 'database', 'system', 'Réinitialisation complète de la base de démonstration');
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUserRole,
        users: INITIAL_USERS,
        clerkPublishableKey,
        setClerkPublishableKey,
        neonDatabaseUrl,
        setNeonDatabaseUrl,
        isNeonConnected,
        setIsNeonConnected,
        storeSettings,
        updateStoreSettings,
        categories,
        locations,
        addCategory,
        renameCategory,
        products,
        addProduct,
        updateProduct,
        renameProduct,
        deleteProduct,
        batches,
        addBatch,
        updateBatch,
        markBatchWaste,
        movements,
        addMovement,
        invoices,
        createInvoice,
        updateInvoice,
        lockInvoice,
        duplicateInvoice,
        createCreditNote,
        deleteInvoice,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        purchaseOrders,
        addPurchaseOrder,
        receivePurchaseOrder,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        sales,
        processSale,
        renameEntity,
        auditLogs,
        trashItems,
        restoreFromTrash,
        emptyTrashItem,
        clearTrash,
        resetToSeeds,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
