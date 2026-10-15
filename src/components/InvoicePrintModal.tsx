import React from 'react';
import { Invoice } from '../types';
import { useStore } from '../services/storeContext';
import { Printer, Download, X, ShieldCheck } from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { storeSettings } = useStore();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const el = document.getElementById('printable-invoice');
    if (!el) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${invoice.invoiceNumber} - ${storeSettings.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left; }
    th { background: #f9f9f9; font-size: 11px; text-transform: uppercase; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 15px; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8 rounded-xl bg-neutral-100 shadow-2xl border border-neutral-300 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top bar controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-amber-400">
              {invoice.invoiceNumber}
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-300">
              Aperçu avant impression légale A4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Télécharger Facture</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded shadow-xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-white transition-colors ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-neutral-200">
          <div
            id="printable-invoice"
            className="w-full max-w-[800px] bg-white p-10 shadow-lg rounded-sm text-neutral-900 text-xs font-sans leading-normal"
          >
            {/* Header: Company and Document Title */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-6 mb-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  {storeSettings.brandName}
                </h1>
                <div className="text-neutral-600 space-y-0.5 mt-1 text-[11px]">
                  <div>{storeSettings.address}</div>
                  <div>
                    {storeSettings.postalCode} {storeSettings.city}, {storeSettings.country}
                  </div>
                  <div>Tél : {storeSettings.phone} · {storeSettings.email}</div>
                  <div className="font-mono text-neutral-500 pt-1">
                    SIRET : {storeSettings.siret} · {storeSettings.rcs}
                  </div>
                  <div className="font-mono text-neutral-500">
                    N° TVA intracommunautaire : {storeSettings.vatNumber}
                  </div>
                  <div className="font-mono text-neutral-500">
                    Code APE : {storeSettings.apeCode} · Capital : {storeSettings.capital}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-neutral-900 text-white font-mono font-bold text-sm tracking-wide rounded-sm mb-2">
                  {invoice.type === 'avoir' ? 'AVOIR / NOTE DE CRÉDIT' : 'FACTURE'}
                </div>
                <div className="text-base font-bold font-mono text-neutral-900">
                  N° {invoice.invoiceNumber}
                </div>
                <div className="text-neutral-500 text-[11px] mt-1 space-y-0.5">
                  <div>Date d'émission : <span className="font-semibold text-neutral-800">{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</span></div>
                  <div>Date d'échéance : <span className="font-semibold text-neutral-800">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span></div>
                  {invoice.originalInvoiceId && (
                    <div className="text-rose-600 font-medium">Facture d'origine liée : {invoice.originalInvoiceId}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Block */}
            <div className="flex justify-end mb-8">
              <div className="w-1/2 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Client / Facturé à :
                </div>
                <div className="text-sm font-bold text-neutral-900">
                  {invoice.customerName}
                </div>
                <div className="text-neutral-600 text-xs whitespace-pre-line">
                  {invoice.customerAddress}
                </div>
                {invoice.customerSiret && (
                  <div className="text-[11px] font-mono text-neutral-500 pt-1">
                    SIRET : {invoice.customerSiret}
                  </div>
                )}
                {invoice.customerVatNumber && (
                  <div className="text-[11px] font-mono text-neutral-500">
                    N° TVA : {invoice.customerVatNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="mb-6">
              <table className="w-full text-left text-xs border border-neutral-200">
                <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] font-bold uppercase text-neutral-600">
                  <tr>
                    <th className="px-3 py-2.5">Désignation des Marchandises / Services</th>
                    <th className="px-3 py-2.5 text-center w-16">Qté</th>
                    <th className="px-3 py-2.5 text-center w-16">Unité</th>
                    <th className="px-3 py-2.5 text-right w-24">Prix Unit. HT</th>
                    <th className="px-3 py-2.5 text-center w-16">Taux TVA</th>
                    <th className="px-3 py-2.5 text-right w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {invoice.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-neutral-900">
                          {line.description}
                        </div>
                        {line.discountPercent > 0 && (
                          <div className="text-[10px] text-amber-700">
                            Remise appliquée : {line.discountPercent}%
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-center text-neutral-500">
                        {line.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {line.unitPriceHt.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium">
                        {line.vatRate}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {line.totalHt.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary: VAT breakdown + Totals */}
            <div className="grid grid-cols-2 gap-6 items-start mb-8">
              {/* VAT Breakdown Table */}
              <div>
                <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  Ventilation de la Taxe sur la Valeur Ajoutée (TVA)
                </div>
                <table className="w-full text-left text-xs border border-neutral-200">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-semibold text-neutral-500">
                    <tr>
                      <th className="px-2.5 py-1.5">Taux TVA</th>
                      <th className="px-2.5 py-1.5 text-right">Base HT</th>
                      <th className="px-2.5 py-1.5 text-right">Montant Taxe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono tabular-nums text-[11px]">
                    {invoice.vatBreakdown.map((vb) => (
                      <tr key={vb.rate}>
                        <td className="px-2.5 py-1.5 font-sans font-medium">{vb.rate}%</td>
                        <td className="px-2.5 py-1.5 text-right">{vb.baseHt.toFixed(2)} €</td>
                        <td className="px-2.5 py-1.5 text-right">{vb.vatAmount.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bank Details (IBAN / BIC) */}
                <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200 text-[11px] space-y-1">
                  <div className="font-bold text-neutral-800">
                    Coordonnées Bancaires pour Virement SEPA :
                  </div>
                  <div className="font-mono text-neutral-700">
                    IBAN : {storeSettings.iban}
                  </div>
                  <div className="font-mono text-neutral-700">
                    BIC : {storeSettings.bic}
                  </div>
                </div>
              </div>

              {/* Total Financial Summary */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-600">Total Hors Taxes (HT) :</span>
                  <span className="font-bold text-neutral-900">{invoice.subtotalHt.toFixed(2)} €</span>
                </div>
                {invoice.shippingCostHt > 0 && (
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-600">Frais de transport / port HT :</span>
                    <span className="text-neutral-900">{invoice.shippingCostHt.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-600">Total TVA :</span>
                  <span className="font-semibold text-neutral-800">
                    {(invoice.totalTtc - invoice.subtotalHt).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold text-neutral-900 border-t border-neutral-300">
                  <span>TOTAL TTC :</span>
                  <span className="text-neutral-950 font-black">{invoice.totalTtc.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-neutral-600 border-t border-neutral-200 pt-2">
                  <span>Montant déjà réglé :</span>
                  <span className="font-medium text-emerald-700">{invoice.paidAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-1 text-sm font-bold text-neutral-900 bg-white p-2 rounded border border-neutral-200">
                  <span>NET À PAYER :</span>
                  <span className="text-amber-900">
                    {Math.max(0, invoice.totalTtc - invoice.paidAmount).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory French Legal Mentions */}
            <div className="border-t border-neutral-200 pt-4 text-[10px] text-neutral-500 space-y-1">
              <div className="font-semibold text-neutral-700">
                Mentions Légales & Conditions de Paiement (Loi de Modernisation de l'Économie) :
              </div>
              <p>
                Mode de règlement convenu : {invoice.paymentMethod}. {invoice.paymentTerms}
              </p>
              <p>
                {storeSettings.legalMentions}
              </p>
              <p>
                En cas de retard de paiement, seront exigibles : une indemnité forfaitaire pour frais de recouvrement de 40 € (Article D.441-5 du Code de Commerce) ainsi que des pénalités de retard calculées au taux de 10,5 % l'an. Aucun escompte pour règlement anticipé.
              </p>
              <div className="pt-2 text-[9px] text-neutral-400 text-center">
                Document généré électroniquement par le système ERP Saveurs & Terroirs certifié conforme.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
