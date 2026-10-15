import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { NEON_POSTGRES_SCHEMA_SQL, PRISMA_SCHEMA } from '../services/exportNeonSql';
import {
  Check,
  Copy,
  Database,
  Download,
  Globe,
  Server,
  ShieldAlert,
  Terminal,
  UserRound,
} from 'lucide-react';

export const NeonView: React.FC = () => {
  const { isNeonConnected, currentUser } = useStore();
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedPrisma, setCopiedPrisma] = useState(false);

  const copyToClipboard = async (text: string, setter: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      window.setTimeout(() => setter(false), 2000);
    } catch {
      window.alert('Copie impossible dans ce navigateur. Sélectionnez le texte manuellement.');
    }
  };

  const downloadSql = () => {
    const blob = new Blob([NEON_POSTGRES_SCHEMA_SQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'neon_schema_saveurs_terroirs.sql';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            État technique de l’application
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            MODE DÉMO
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Les connexions à Neon et Clerk ne sont pas encore implémentées.
        </p>
      </div>

      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Ne saisissez pas de données réelles dans cette démo.</p>
            <p className="text-xs leading-relaxed">
              Il n’y a ni connexion à une base de données, ni authentification réelle, ni contrôle d’accès serveur.
              N’entrez pas de mot de passe DATABASE_URL dans cette page. Une future connexion devra être réalisée
              par une API serveur, avec les secrets conservés côté serveur.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-rose-50 text-rose-700">
                <Database className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900">Base de données</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-700">
              <span className={`h-2 w-2 rounded-full ${isNeonConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isNeonConnected ? 'Connectée' : 'Non connectée'}
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Aucune vérification réelle de Neon n’est effectuée. La variable <code className="font-mono">DATABASE_URL</code>
            devra être configurée uniquement dans l’environnement du serveur, jamais dans le navigateur.
          </p>
        </section>

        <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                <UserRound className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900">Authentification</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800">
              Non configurée
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            L’utilisateur affiché et le sélecteur de rôle sont des données de démonstration, pas une session Clerk.
          </p>
          <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
            <div className="text-neutral-500">Utilisateur de démonstration :</div>
            <div className="font-semibold text-neutral-900">{currentUser.name}</div>
            <div className="text-neutral-400 font-mono text-[11px]">{currentUser.email}</div>
            <div className="text-amber-700 font-bold uppercase text-[10px] mt-1">
              Rôle simulé : {currentUser.role}
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className="p-1.5 rounded-md bg-neutral-900 text-white">
              <Globe className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-neutral-900">Déploiement</h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Le projet actuel est une interface Vite côté navigateur. Le déploiement du site seul n’ajoute ni API,
            ni stockage durable, ni authentification.
          </p>
        </section>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
        Les schémas exportés ci-dessous sont des brouillons techniques. Ils ne sont pas encore synchronisés avec
        l’ensemble des données de l’application : ne les appliquez pas à une base de production.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-700" />
                Brouillon de schéma PostgreSQL
              </h3>
              <p className="text-xs text-neutral-500">À revoir avant toute utilisation réelle.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSql}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                title="Télécharger le brouillon SQL"
                aria-label="Télécharger le brouillon SQL"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(NEON_POSTGRES_SCHEMA_SQL, setCopiedSql)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copié !' : 'Copier SQL'}</span>
              </button>
            </div>
          </div>
          <pre className="h-64 overflow-y-auto p-3 bg-neutral-900 text-neutral-200 rounded-lg text-[11px] font-mono leading-relaxed">
            {NEON_POSTGRES_SCHEMA_SQL}
          </pre>
        </section>

        <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-700" />
                Brouillon de schéma Prisma
              </h3>
              <p className="text-xs text-neutral-500">À revoir avant toute utilisation réelle.</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(PRISMA_SCHEMA, setCopiedPrisma)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
            >
              {copiedPrisma ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedPrisma ? 'Copié !' : 'Copier Prisma'}</span>
            </button>
          </div>
          <pre className="h-64 overflow-y-auto p-3 bg-neutral-900 text-neutral-200 rounded-lg text-[11px] font-mono leading-relaxed">
            {PRISMA_SCHEMA}
          </pre>
        </section>
      </div>
    </div>
  );
};
