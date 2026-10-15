import React, { useState } from 'react';
import { StoreProvider } from './services/storeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ArticlesView } from './components/ArticlesView';
import { ArticleModal } from './components/ArticleModal';
import { MovementsView } from './components/MovementsView';
import { MovementModal } from './components/MovementModal';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { PosView } from './components/PosView';
import { LotsView } from './components/LotsView';
import { SuppliersView } from './components/SuppliersView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { AuditTrashView } from './components/AuditTrashView';
import { NeonView } from './components/NeonView';
import { Product, Invoice } from './types';

const MainApp: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Modals state
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [movementModalOpen, setMovementModalOpen] = useState(false);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const [filterLotsProductId, setFilterLotsProductId] = useState<string | undefined>(undefined);

  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setArticleModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setArticleModalOpen(true);
  };

  const handleOpenNewInvoice = () => {
    setInvoiceToEdit(null);
    setInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setInvoiceModalOpen(true);
  };

  const handleViewLots = (productId?: string) => {
    setFilterLotsProductId(productId);
    setActiveView('lots');
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 overflow-hidden font-sans antialiased">
      {/* 3-Zone Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewProduct={handleOpenNewProduct}
        onOpenNewMovement={() => setMovementModalOpen(true)}
        onOpenNewInvoice={handleOpenNewInvoice}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/60">
          {activeView === 'dashboard' && (
            <DashboardView
              setActiveView={setActiveView}
              onOpenNewProduct={handleOpenNewProduct}
              onOpenNewMovement={() => setMovementModalOpen(true)}
              onOpenNewInvoice={handleOpenNewInvoice}
            />
          )}

          {activeView === 'articles' && (
            <ArticlesView
              onOpenNewProduct={handleOpenNewProduct}
              onEditProduct={handleEditProduct}
              onViewLots={handleViewLots}
            />
          )}

          {activeView === 'movements' && (
            <MovementsView
              onOpenNewMovement={() => setMovementModalOpen(true)}
            />
          )}

          {activeView === 'lots' && (
            <LotsView filterProductId={filterLotsProductId} />
          )}

          {activeView === 'invoices' && (
            <InvoicesView
              onOpenNewInvoice={handleOpenNewInvoice}
              onEditInvoice={handleEditInvoice}
            />
          )}

          {activeView === 'pos' && <PosView />}

          {activeView === 'suppliers' && <SuppliersView />}

          {activeView === 'customers' && <CustomersView />}

          {activeView === 'inventory' && <InventoryView />}

          {activeView === 'audit' && <AuditTrashView />}

          {activeView === 'neon' && <NeonView />}
        </main>
      </div>

      {/* Global Modals */}
      <ArticleModal
        isOpen={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        productToEdit={productToEdit}
      />

      <MovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
      />

      <InvoiceEditorModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceToEdit={invoiceToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
