import React, { useState, useEffect } from 'react';
import { useStore } from '../services/storeContext';
import { Invoice, InvoiceLine } from '../types';
import { X, Plus, Trash2, Check, Calculator, FileText, Lock } from 'lucide-react';

interface InvoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
}

export const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
}) => {
  const { customers, products, storeSettings, createInvoice, updateInvoice, lockInvoice } = useStore();

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSiret, setCustomerSiret] = useState('');
  const [customerVatNumber, setCustomerVatNumber] = useState('');

  const [type, setType] = useState<Invoice['type']>('facture');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('Virement bancaire SEPA');
  const [paymentTerms, setPaymentTerms] = useState('Règlement à réception ou sous 30 jours.');
  const [shippingCostHt, setShippingCostHt] = useState(0);
  const [notes, setNotes] = useState('');

  const [lines, setLines] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    if (invoiceToEdit) {
      setCustomerId(invoiceToEdit.customerId);
      setCustomerName(invoiceToEdit.customerName);
      setCustomerAddress(invoiceToEdit.customerAddress);
      setCustomerSiret(invoiceToEdit.customerSiret || '');
      setCustomerVatNumber(invoiceToEdit.customerVatNumber || '');
      setType(invoiceToEdit.type);
      setIssueDate(invoiceToEdit.issueDate);
      setDueDate(invoiceToEdit.dueDate);
      setPaymentMethod(invoiceToEdit.paymentMethod);
      setPaymentTerms(invoiceToEdit.paymentTerms);
      setShippingCostHt(invoiceToEdit.shippingCostHt);
      setNotes(invoiceToEdit.notes || '');
      setLines(invoiceToEdit.lines);
    } else {
      // Default to first customer
      const defaultCust = customers[0];
      if (defaultCust) {
        setCustomerId(defaultCust.id);
        setCustomerName(
          defaultCust.type === 'professionnel' && defaultCust.companyName
            ? `${defaultCust.name} (${defaultCust.companyName})`
            : `${defaultCust.name} ${defaultCust.firstName || ''}`
        );
        setCustomerAddress(`${defaultCust.address}, ${defaultCust.postalCode} ${defaultCust.city}`);
        setCustomerSiret(defaultCust.siret || '');
        setCustomerVatNumber(defaultCust.vatNumber || '');
      }

      // Default with one line
      const firstProd = products[0];
      setLines([
        {
          id: `line-${Date.now()}`,
          productId: firstProd?.id,
          description: firstProd?.name || 'Produit alimentaire',
          quantity: 1,
          unit: firstProd?.unit || 'piece',
          unitPriceHt: firstProd?.priceHt || 10,
          vatRate: firstProd?.vatRate || 5.5,
          discountPercent: 0,
          totalHt: firstProd?.priceHt || 10,
          totalTtc: firstProd?.priceTtc || 10.55,
        },
      ]);
    }
  }, [invoiceToEdit, isOpen, customers, products]);

  if (!isOpen) return null;

  const handleCustomerChange = (selectedId: string) => {
    setCustomerId(selectedId);
    const found = customers.find((c) => c.id === selectedId);
    if (found) {
      setCustomerName(
        found.type === 'professionnel' && found.companyName
          ? `${found.name} (${found.companyName})`
          : `${found.name} ${found.firstName || ''}`
      );
      setCustomerAddress(`${found.address}, ${found.postalCode} ${found.city}`);
      setCustomerSiret(found.siret || '');
      setCustomerVatNumber(found.vatNumber || '');
    }
  };

  const handleAddLine = () => {
    const firstProd = products[0];
    const newLine: InvoiceLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      productId: firstProd?.id,
      description: firstProd?.name || 'Nouvelle ligne de produit',
      quantity: 1,
      unit: firstProd?.unit || 'piece',
      unitPriceHt: firstProd?.priceHt || 10,
      vatRate: firstProd?.vatRate || 5.5,
      discountPercent: 0,
      totalHt: firstProd?.priceHt || 10,
      totalTtc: firstProd?.priceTtc || 10.55,
    };
    setLines([...lines, newLine]);
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...lines];
    const qty = updated[index].quantity || 1;
    const disc = updated[index].discountPercent || 0;
    const lineHt = Math.round(qty * prod.priceHt * (1 - disc / 100) * 100) / 100;
    const lineTtc = Math.round(lineHt * (1 + prod.vatRate / 100) * 100) / 100;

    updated[index] = {
      ...updated[index],
      productId: prod.id,
      description: prod.name,
      unit: prod.unit,
      unitPriceHt: prod.priceHt,
      vatRate: prod.vatRate,
      totalHt: lineHt,
      totalTtc: lineTtc,
    };
    setLines(updated);
  };

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
    const updated = [...lines];
    const current = { ...updated[index], [field]: value };

    const qty = current.quantity || 0;
    const unitPrice = current.unitPriceHt || 0;
    const disc = current.discountPercent || 0;
    const rate = current.vatRate || 5.5;

    const totalHt = Math.round(qty * unitPrice * (1 - disc / 100) * 100) / 100;
    const totalTtc = Math.round(totalHt * (1 + rate / 100) * 100) / 100;

    current.totalHt = totalHt;
    current.totalTtc = totalTtc;
    updated[index] = current;
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Totals & VAT Breakdown
  const vatMap = new Map<number, { baseHt: number; vatAmount: number }>();
  let subtotalHt = 0;
  let totalTtc = 0;

  lines.forEach((l) => {
    subtotalHt += l.totalHt;
    totalTtc += l.totalTtc;
    const rate = l.vatRate;
    const prev = vatMap.get(rate) || { baseHt: 0, vatAmount: 0 };
    const vatVal = l.totalTtc - l.totalHt;
    vatMap.set(rate, {
      baseHt: Math.round((prev.baseHt + l.totalHt) * 100) / 100,
      vatAmount: Math.round((prev.vatAmount + vatVal) * 100) / 100,
    });
  });

  if (shippingCostHt > 0) {
    subtotalHt += shippingCostHt;
    totalTtc += shippingCostHt * 1.2; // Port à 20%
    const prev20 = vatMap.get(20) || { baseHt: 0, vatAmount: 0 };
    vatMap.set(20, {
      baseHt: Math.round((prev20.baseHt + shippingCostHt) * 100) / 100,
      vatAmount: Math.round((prev20.vatAmount + shippingCostHt * 0.2) * 100) / 100,
    });
  }

  const vatBreakdown = Array.from(vatMap.entries()).map(([rate, vals]) => ({
    rate,
    baseHt: vals.baseHt,
    vatAmount: vals.vatAmount,
  }));

  const handleSubmit = (e: React.FormEvent, andLock = false) => {
    e.preventDefault();
    if (!customerName.trim() || lines.length === 0) return;

    const payload = {
      type,
      customerId,
      customerName,
      customerAddress,
      customerSiret,
      customerVatNumber,
      issueDate,
      dueDate,
      lines,
      discountTotal: 0,
      shippingCostHt,
      subtotalHt: Math.round(subtotalHt * 100) / 100,
      vatBreakdown,
      totalTtc: Math.round(totalTtc * 100) / 100,
      paidAmount: invoiceToEdit ? invoiceToEdit.paidAmount : 0,
      paymentStatus: (invoiceToEdit ? invoiceToEdit.paymentStatus : 'brouillon') as any,
      paymentMethod,
      paymentTerms,
      legalMentions: storeSettings.legalMentions,
      isLocked: andLock,
      notes,
    };

    if (invoiceToEdit) {
      updateInvoice(invoiceToEdit.id, payload);
      if (andLock) lockInvoice(invoiceToEdit.id);
    } else {
      createInvoice(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8 rounded-xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-neutral-900 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                {invoiceToEdit
                  ? `Modifier la Facture : ${invoiceToEdit.invoiceNumber}`
                  : "Créer une nouvelle facture (Conformité légale FR)"}
              </h3>
              <p className="text-xs text-neutral-500">
                Ventilation de la TVA (5.5%, 10%, 20%), mentions légales obligatoires et décompte de l'indemnité 40 €.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document metadata & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Type de document
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
              >
                <option value="facture">Facture Définitive</option>
                <option value="devis">Devis Commercial</option>
                <option value="acompte">Facture d'Acompte</option>
                <option value="avoir">Avoir / Note de Crédit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Date d'Émission <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Date d'Échéance de Règlement <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
              />
            </div>

            {/* Client Picker */}
            <div className="md:col-span-3 pt-2 border-t border-neutral-200">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Client Destinataire
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.firstName || ''} {c.companyName ? `(${c.companyName})` : ''} [{c.type}]
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Raison sociale ou Nom complet"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
                />

                <input
                  type="text"
                  required
                  placeholder="Adresse postale complète (Rue, CP, Ville)"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <input
                  type="text"
                  placeholder="Numéro SIRET client (professionnel)"
                  value={customerSiret}
                  onChange={(e) => setCustomerSiret(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="N° TVA Intracommunautaire client"
                  value={customerVatNumber}
                  onChange={(e) => setCustomerVatNumber(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Lignes de Prestation / Produits ({lines.length})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Article / Description</th>
                    <th className="px-3 py-2.5 w-24 text-center">Qté</th>
                    <th className="px-3 py-2.5 w-20 text-center">Unité</th>
                    <th className="px-3 py-2.5 w-28 text-right">Prix HT</th>
                    <th className="px-3 py-2.5 w-24 text-center">TVA %</th>
                    <th className="px-3 py-2.5 w-20 text-center">Rem %</th>
                    <th className="px-3 py-2.5 w-28 text-right">Total HT</th>
                    <th className="px-3 py-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-neutral-50/50">
                      {/* Product Selector / Description */}
                      <td className="p-2 space-y-1">
                        <select
                          value={line.productId || ''}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full text-xs font-medium px-2 py-1 rounded border border-neutral-200 bg-white"
                        >
                          <option value="">(Saisie libre personnalisée)</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.priceHt.toFixed(2)} € HT · TVA {p.vatRate}%)
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Désignation précise du produit ou de la prestation..."
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-200"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-center px-2 py-1 text-xs font-mono font-bold rounded border border-neutral-200"
                        />
                      </td>

                      {/* Unit */}
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={line.unit}
                          onChange={(e) => handleLineChange(index, 'unit', e.target.value)}
                          className="w-full text-center px-1.5 py-1 text-xs rounded border border-neutral-200"
                        />
                      </td>

                      {/* Unit Price HT */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={line.unitPriceHt}
                          onChange={(e) => handleLineChange(index, 'unitPriceHt', parseFloat(e.target.value) || 0)}
                          className="w-full text-right px-2 py-1 text-xs font-mono rounded border border-neutral-200"
                        />
                      </td>

                      {/* VAT Rate */}
                      <td className="p-2 text-center">
                        <select
                          value={line.vatRate}
                          onChange={(e) => handleLineChange(index, 'vatRate', parseFloat(e.target.value))}
                          className="w-full text-center px-1 py-1 text-xs font-mono rounded border border-neutral-200 bg-neutral-50"
                        >
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={20}>20%</option>
                        </select>
                      </td>

                      {/* Discount % */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={line.discountPercent}
                          onChange={(e) => handleLineChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full text-center px-1.5 py-1 text-xs font-mono rounded border border-neutral-200"
                        />
                      </td>

                      {/* Total HT */}
                      <td className="p-2 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {line.totalHt.toFixed(2)} €
                      </td>

                      {/* Delete Line */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 1}
                          className="text-neutral-300 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Totals & VAT Breakdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            {/* Ventilation TVA */}
            <div>
              <span className="text-xs font-bold text-neutral-900 block mb-2">
                Ventilation Réglementaire de la TVA
              </span>
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-[10px] uppercase font-semibold text-neutral-500">
                    <tr>
                      <th className="px-3 py-1.5">Taux TVA</th>
                      <th className="px-3 py-1.5 text-right">Base HT</th>
                      <th className="px-3 py-1.5 text-right">Montant TVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
                    {vatBreakdown.map((vb) => (
                      <tr key={vb.rate}>
                        <td className="px-3 py-1.5 font-sans font-semibold">{vb.rate}%</td>
                        <td className="px-3 py-1.5 text-right">{vb.baseHt.toFixed(2)} €</td>
                        <td className="px-3 py-1.5 text-right">{vb.vatAmount.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Conditions & Délais de règlement
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white"
                />
              </div>
            </div>

            {/* Financial Totals */}
            <div className="space-y-2 text-xs font-mono text-neutral-700">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-bold text-neutral-900">{subtotalHt.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>Frais de livraison / port HT :</span>
                <input
                  type="number"
                  step="0.01"
                  value={shippingCostHt}
                  onChange={(e) => setShippingCostHt(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right px-2 py-0.5 rounded border border-neutral-200 bg-white"
                />
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span>Total TVA collectée :</span>
                <span className="font-semibold text-neutral-800">
                  {(totalTtc - subtotalHt).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold text-neutral-900 border-t border-neutral-300">
                <span>NET À PAYER (TTC) :</span>
                <span className="text-amber-900">{totalTtc.toFixed(2)} €</span>
              </div>

              <div className="pt-2 text-[11px] text-neutral-500 font-sans">
                Mentions légales obligatoires incluses : 40 € d'indemnité forfaitaire de recouvrement (clients pros), taux d'intérêt de retard 10.5%.
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Annuler
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md transition-colors"
              >
                <span>Enregistrer comme Brouillon</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Valider & Verrouiller la Facture</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
