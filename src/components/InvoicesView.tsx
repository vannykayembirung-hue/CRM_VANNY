import React, { useState, useMemo } from 'react';
import { useStore } from '../services/storeContext';
import { Invoice } from '../types';
import {
  FileText,
  Plus,
  Printer,
  Copy,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Trash2,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { InvoicePrintModal } from './InvoicePrintModal';

interface InvoicesViewProps {
  onOpenNewInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenNewInvoice,
  onEditInvoice,
}) => {
  const {
    invoices,
    duplicateInvoice,
    createCreditNote,
    updateInvoice,
    deleteInvoice,
  } = useStore();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);

  // Financial KPIs
  const kpis = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalCreditNotes = 0;

    invoices.forEach((inv) => {
      if (inv.type === 'avoir') {
        totalCreditNotes += inv.totalTtc;
      } else {
        totalInvoiced += inv.totalTtc;
        totalPaid += inv.paidAmount;
        if (inv.paymentStatus === 'en_attente' || inv.paymentStatus === 'en_retard') {
          totalPending += inv.totalTtc - inv.paidAmount;
        }
      }
    });

    return {
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalCreditNotes: Math.round(totalCreditNotes * 100) / 100,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedStatus !== 'all' && inv.paymentStatus !== selectedStatus) return false;
      if (selectedType !== 'all' && inv.type !== selectedType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchCust = inv.customerName.toLowerCase().includes(q);
        return matchNum || matchCust;
      }
      return true;
    });
  }, [invoices, selectedStatus, selectedType, search]);

  const handleMarkAsPaid = (inv: Invoice) => {
    updateInvoice(inv.id, {
      paidAmount: inv.totalTtc,
      paymentStatus: 'payee',
    });
  };

  const handleCreateAvoir = (inv: Invoice) => {
    const reason = prompt('Motif de l\'avoir (ex: Retour produit, Geste commercial, Erreur de facturation) :');
    if (!reason || !reason.trim()) return;
    createCreditNote(inv.id, reason.trim());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Facturation, Devis & Avoirs (Conformité France)
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              Législation CGI
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Séquentialité stricte sans rupture, ventilation TVA 5.5/10/20%, export PDF et mentions légales obligatoires.
          </p>
        </div>

        <button
          onClick={onOpenNewInvoice}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 mb-1">Total Facturé TTC</div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {kpis.totalInvoiced.toFixed(2)} €
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {invoices.filter((i) => i.type === 'facture').length} factures émises
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 mb-1">Total Encaissé</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {kpis.totalPaid.toFixed(2)} €
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Règlements SEPA & Caisses
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 mb-1">Encours & Impayés</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-800">
            {kpis.totalPending.toFixed(2)} €
          </div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            À recouvrer (indemnité 40€ pro)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 mb-1">Avoirs / Notes de Crédit</div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-700">
            {kpis.totalCreditNotes.toFixed(2)} €
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Remboursements légaux tracés
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de facture (ex: FAC-2026-0001) ou nom client..."
            className="flex-1 w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-600 focus:outline-none"
          />

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Tous les types de document</option>
              <option value="facture">Factures</option>
              <option value="avoir">Avoirs</option>
              <option value="devis">Devis</option>
              <option value="acompte">Acomptes</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Tous les statuts de paiement</option>
              <option value="payee">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="en_retard">En retard</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Numéro Document</th>
                <th className="px-4 py-3">Date Émission / Échéance</th>
                <th className="px-4 py-3">Client Destinataire</th>
                <th className="px-4 py-3 text-right">Montant HT</th>
                <th className="px-4 py-3 text-right">Montant TTC</th>
                <th className="px-4 py-3 text-center">Statut Règlement</th>
                <th className="px-4 py-3 text-center">Verrouillage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInvoices.map((inv) => {
                const isAvoir = inv.type === 'avoir';
                const isPaid = inv.paymentStatus === 'payee';
                const isPending = inv.paymentStatus === 'en_attente';
                const isDraft = inv.paymentStatus === 'brouillon';

                return (
                  <tr key={inv.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Number */}
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span className={isAvoir ? 'text-rose-700' : 'text-neutral-900'}>
                          {inv.invoiceNumber}
                        </span>
                        {isAvoir && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-sans font-medium">
                            Avoir
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      <div>Émis : {new Date(inv.issueDate).toLocaleDateString('fr-FR')}</div>
                      <div>Éch. : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 truncate max-w-xs">
                        {inv.customerName}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                        {inv.customerAddress}
                      </div>
                    </td>

                    {/* HT */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-600">
                      {inv.subtotalHt.toFixed(2)} €
                    </td>

                    {/* TTC */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {inv.totalTtc.toFixed(2)} €
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isDraft
                            ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isPaid && <CheckCircle className="h-3 w-3" />}
                        {isPending && <Clock className="h-3 w-3" />}
                        {inv.paymentStatus === 'payee'
                          ? 'Payée'
                          : inv.paymentStatus === 'en_attente'
                          ? 'En attente'
                          : inv.paymentStatus === 'brouillon'
                          ? 'Brouillon'
                          : 'En retard'}
                      </span>
                    </td>

                    {/* Lock status */}
                    <td className="px-4 py-3 text-center">
                      {inv.isLocked ? (
                        <span
                          title="Facture verrouillée conformément à la loi anti-fraude TVA"
                          className="inline-flex items-center text-neutral-500"
                        >
                          <Lock className="h-3.5 w-3.5 text-neutral-500" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">Brouillon</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Print / PDF view */}
                        <button
                          onClick={() => setPrintTarget(inv)}
                          title="Aperçu avant impression légale & Export PDF"
                          className="p-1.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Edit (if unlocked) */}
                        {!inv.isLocked && (
                          <button
                            onClick={() => onEditInvoice(inv)}
                            title="Modifier la facture"
                            className="p-1.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Mark Paid if not yet */}
                        {!isPaid && !isAvoir && (
                          <button
                            onClick={() => handleMarkAsPaid(inv)}
                            title="Enregistrer l'encaissement"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateInvoice(inv.id)}
                          title="Dupliquer la facture (nouveau numéro séquentiel)"
                          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        {/* Issue Credit Note (Avoir) if locked and not already credit note */}
                        {inv.isLocked && !isAvoir && (
                          <button
                            onClick={() => handleCreateAvoir(inv)}
                            title="Émettre un Avoir légal sur cette facture"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete draft */}
                        {!inv.isLocked && (
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer le brouillon de facture ${inv.invoiceNumber} ?`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            title="Supprimer le brouillon"
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print / PDF Modal */}
      {printTarget && (
        <InvoicePrintModal
          isOpen={true}
          onClose={() => setPrintTarget(null)}
          invoice={printTarget}
        />
      )}
    </div>
  );
};
