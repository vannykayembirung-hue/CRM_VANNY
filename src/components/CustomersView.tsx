import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Customer } from '../types';
import {
  Users,
  Plus,
  Award,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { RenameModal } from './RenameModal';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, deleteCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  // New Customer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<Customer['type']>('particulier');
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lyon');
  const [postalCode, setPostalCode] = useState('69002');
  const [siret, setSiret] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomer({
      type,
      name: name.trim(),
      firstName: firstName.trim() || undefined,
      companyName: companyName.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      siret: siret.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
    });

    setModalOpen(false);
    setName('');
    setFirstName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Fichier Clients & Programme de Fidélité
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Cagnotte & Paliers
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Suivi des clients particuliers et professionnels, historique d'achats et cumul des points de fidélité.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, raison sociale, email, téléphone..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900">
                    {cust.name} {cust.firstName || ''}
                  </span>
                  <button
                    onClick={() => setRenameTarget({ id: cust.id, name: cust.name })}
                    title="Renommer le client (Exigence transversale)"
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-700 transition-opacity p-0.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {cust.companyName && (
                  <div className="text-xs font-medium text-neutral-600">
                    {cust.companyName}
                  </div>
                )}
                <span className="text-[11px] text-neutral-400 capitalize">
                  Compte {cust.type}
                </span>
              </div>

              {/* Loyalty Tier Badge */}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  cust.loyaltyTier === 'Or'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : cust.loyaltyTier === 'Argent'
                    ? 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                    : 'bg-orange-50 text-orange-900 border border-orange-200'
                }`}
              >
                <Award className="h-3 w-3" />
                <span>{cust.loyaltyTier}</span>
              </div>
            </div>

            {/* Loyalty points bar */}
            <div className="p-3 bg-neutral-50 rounded-lg flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-neutral-500 block text-[10px]">Points Fidélité</span>
                <span className="text-base font-black text-amber-900">
                  {cust.loyaltyPoints} pts
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px]">Total Dépensé</span>
                <span className="font-bold text-neutral-900">
                  {cust.totalSpent.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate">{cust.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-neutral-400" />
                <span>{cust.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate">
                  {cust.address}, {cust.postalCode} {cust.city}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => {
                  if (confirm(`Déplacer le client "${cust.name}" vers la corbeille ?`)) {
                    deleteCustomer(cust.id);
                  }
                }}
                className="text-neutral-300 hover:text-rose-600 p-1 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Nouveau Client
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Type de client
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('particulier')}
                    className={`py-1.5 text-xs font-semibold rounded border ${
                      type === 'particulier' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'
                    }`}
                  >
                    Particulier
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('professionnel')}
                    className={`py-1.5 text-xs font-semibold rounded border ${
                      type === 'professionnel' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'
                    }`}
                  >
                    Professionnel (B2B)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de famille"
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
              </div>

              {type === 'professionnel' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Raison Sociale de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: SAS Le Bistrot Gourmand"
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@..."
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06..."
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresse de facturation / livraison"
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs"
                >
                  Créer la fiche client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Transversal Rename Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={true}
          onClose={() => setRenameTarget(null)}
          entityType="customer"
          entityId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
    </div>
  );
};
