import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { History, Trash2, RotateCcw, ShieldCheck, Filter } from 'lucide-react';

export const AuditTrashView: React.FC = () => {
  const { auditLogs, trashItems, restoreFromTrash, emptyTrashItem, clearTrash } = useStore();
  const [activeTab, setActiveTab] = useState<'audit' | 'trash'>('audit');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Journal d'Audit Immuable & Corbeille
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
              Audit Trail Traçabilité
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Historique complet des créations, modifications, renommages et corbeille avec restauration instantanée.
          </p>
        </div>

        {activeTab === 'trash' && trashItems.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Vider définitivement tous les éléments de la corbeille ?')) {
                clearTrash();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Vider la corbeille ({trashItems.length})</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-4">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Journal d'Audit ({auditLogs.length} événements)</span>
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'trash'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          <span>Corbeille & Restauration ({trashItems.length})</span>
        </button>
      </div>

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-neutral-200">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs font-medium px-2 py-1 rounded border border-neutral-200 bg-white"
            >
              <option value="all">Toutes les actions</option>
              <option value="create">Création (create)</option>
              <option value="update">Mise à jour (update)</option>
              <option value="rename">Renommage (rename)</option>
              <option value="delete">Suppression / Corbeille (delete)</option>
              <option value="restore">Restauration (restore)</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Horodatage</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Utilisateur (Clerk)</th>
                    <th className="px-4 py-3">Entité & ID</th>
                    <th className="px-4 py-3">Détails & Valeurs Avant/Après</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            log.action === 'create'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.action === 'rename'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : log.action === 'delete'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : log.action === 'restore'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
                        {log.userName}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {log.entity} · {log.entityId}
                      </td>

                      <td className="px-4 py-3 text-neutral-700">
                        <div>{log.details}</div>
                        {log.oldValue && log.newValue && (
                          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                            <span className="line-through text-rose-500">{log.oldValue}</span>
                            {' → '}
                            <span className="text-emerald-600 font-semibold">{log.newValue}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Trash */}
      {activeTab === 'trash' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          {trashItems.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">
              <Trash2 className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <span>La corbeille est vide.</span>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {trashItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {item.entityType}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Supprimé le {new Date(item.deletedAt).toLocaleString('fr-FR')} par {item.deletedBy}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreFromTrash(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restaurer</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer définitivement "${item.title}" ?`)) {
                          emptyTrashItem(item.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                      title="Suppression définitive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
