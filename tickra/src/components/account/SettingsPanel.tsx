'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Download, ExternalLink, Key, LogOut, Save, Shield, User } from 'lucide-react';
import { toast } from '@/components/site/ToastProvider';
import { cn } from '@/lib/cn';
import PasskeyEnroll from '@/components/auth/PasskeyEnroll';

type Locale = 'fr' | 'en';

type Profile = {
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  locale?: 'fr' | 'en' | null;
  theme?: 'light' | 'dark' | null;
  marketing_optin?: boolean | null;
  plan?: 'free' | 'pro' | 'lifetime' | null;
  cycle?: 'monthly' | 'annual' | 'once' | null;
  current_period_end?: string | null;
  stripe_customer?: string | null;
};

const copy = {
  fr: {
    sections: { profile: 'Profil', plan: 'Abonnement', preferences: 'Préférences', security: 'Sécurité', data: 'Mes données', danger: 'Zone dangereuse' },
    profileTitle: 'Profil',
    profileSubtitle: 'Vos informations publiques. L’email n’est pas modifiable — il provient de votre méthode de connexion.',
    emailLabel: 'Adresse e‑mail',
    displayNameLabel: 'Nom d’affichage',
    displayNamePlaceholder: 'Comment vous appeler ?',
    avatarUrlLabel: 'URL de votre avatar',
    avatarUrlPlaceholder: 'https://… (laissez vide pour utiliser vos initiales)',
    saveProfile: 'Enregistrer',
    saved: 'Enregistré',

    planTitle: 'Abonnement',
    planSubtitle: 'Votre plan actuel et le portail de facturation.',
    planLabels: { free: 'Gratuit', pro: 'Pro', lifetime: 'À vie' },
    cycleLabels: { monthly: 'mensuel', annual: 'annuel', once: 'paiement unique' },
    nextBilling: 'Prochaine échéance',
    openBilling: 'Gérer mon abonnement',
    upgradeCta: 'Voir les offres',
    noStripeYet: 'Aucun abonnement actif détecté. Souscrivez pour débloquer toutes les leçons.',

    prefsTitle: 'Préférences',
    prefsSubtitle: 'Langue, thème, e‑mails.',
    localeLabel: 'Langue',
    themeLabel: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    marketingLabel: 'E‑mails marketing',
    marketingHint: 'Édito, nouveautés, conseils trading. Désactivable en un clic.',
    savePreferences: 'Mettre à jour',

    securityTitle: 'Sécurité',
    securitySubtitle: 'Votre session, votre mot de passe.',
    sessionEmail: 'Session active',
    signOut: 'Se déconnecter',
    passwordNotice: 'Vous vous êtes connecté avec Google. Le mot de passe est géré directement chez Google.',
    managePassword: 'Gérer mon mot de passe Google',

    dataTitle: 'Mes données',
    dataSubtitle: 'Téléchargez une copie complète de votre profil, de votre progression, de vos notes et favoris au format JSON.',
    dataCta: 'Télécharger mes données',
    dataDownloading: 'Préparation…',

    dangerTitle: 'Zone dangereuse',
    dangerSubtitle: 'Supprimer votre compte est définitif. Toute votre progression, vos notes, vos favoris seront effacés.',
    deleteCta: 'Supprimer mon compte',
    deleteConfirmPrompt: 'Tapez DELETE pour confirmer la suppression :',
    deletePlaceholder: 'DELETE',
    deleteConfirmCta: 'Supprimer définitivement',
    deleteCancel: 'Annuler',
    deleted: 'Compte supprimé. À bientôt.',

    loading: 'Chargement…',
    notConfigured: 'Base de données non configurée — vos modifications ne seront pas persistées.',
  },
  en: {
    sections: { profile: 'Profile', plan: 'Subscription', preferences: 'Preferences', security: 'Security', data: 'My data', danger: 'Danger zone' },
    profileTitle: 'Profile',
    profileSubtitle: 'Your public information. Email is not editable — it comes from your sign-in method.',
    emailLabel: 'Email address',
    displayNameLabel: 'Display name',
    displayNamePlaceholder: 'How should we call you?',
    avatarUrlLabel: 'Avatar URL',
    avatarUrlPlaceholder: 'https://… (leave empty to use your initials)',
    saveProfile: 'Save',
    saved: 'Saved',

    planTitle: 'Subscription',
    planSubtitle: 'Your current plan and billing portal.',
    planLabels: { free: 'Free', pro: 'Pro', lifetime: 'Lifetime' },
    cycleLabels: { monthly: 'monthly', annual: 'annual', once: 'one-time' },
    nextBilling: 'Next billing',
    openBilling: 'Manage subscription',
    upgradeCta: 'See plans',
    noStripeYet: 'No active subscription detected. Subscribe to unlock all lessons.',

    prefsTitle: 'Preferences',
    prefsSubtitle: 'Language, theme, emails.',
    localeLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    marketingLabel: 'Marketing emails',
    marketingHint: 'Editorial, releases, trading tips. One-click unsubscribe.',
    savePreferences: 'Update',

    securityTitle: 'Security',
    securitySubtitle: 'Your session, your password.',
    sessionEmail: 'Active session',
    signOut: 'Sign out',
    passwordNotice: 'You signed in with Google. Your password is managed there.',
    managePassword: 'Manage Google password',

    dataTitle: 'My data',
    dataSubtitle: 'Download a full copy of your profile, progress, notes and bookmarks as JSON.',
    dataCta: 'Download my data',
    dataDownloading: 'Preparing…',

    dangerTitle: 'Danger zone',
    dangerSubtitle: 'Deleting your account is permanent. All your progress, notes, bookmarks will be erased.',
    deleteCta: 'Delete my account',
    deleteConfirmPrompt: 'Type DELETE to confirm:',
    deletePlaceholder: 'DELETE',
    deleteConfirmCta: 'Delete permanently',
    deleteCancel: 'Cancel',
    deleted: 'Account deleted. See you.',

    loading: 'Loading…',
    notConfigured: 'Database not configured — your changes will not persist.',
  },
};

const initialsFor = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function SettingsPanel({ locale, email }: { locale: Locale; email: string }) {
  const t = copy[locale];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch('/api/me/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { user: Profile | null; configured?: boolean }) => {
        setProfile(data.user ?? { email });
        setConfigured(data.configured ?? false);
        setReady(true);
      })
      .catch(() => {
        setProfile({ email });
        setConfigured(false);
        setReady(true);
      });
  }, [email]);

  const patch = async (body: Partial<Profile>, setSaving: (b: boolean) => void) => {
    setSaving(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ tone: 'success', title: t.saved });
        setProfile((p) => (p ? { ...p, ...body } : p));
      }
    } finally {
      setSaving(false);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch(`/api/billing/portal?locale=${locale}`, { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else toast({ tone: 'error', title: data.error ?? 'error' });
    } finally {
      setOpeningPortal(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/me/export', { cache: 'no-store' });
      if (!res.ok) {
        toast({ tone: 'error', title: locale === 'fr' ? 'Export indisponible' : 'Export unavailable' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `tickra-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await fetch('/api/me/account', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      toast({ tone: 'success', title: t.deleted });
      setTimeout(() => {
        window.location.href = `/${locale}`;
      }, 1200);
    } finally {
      setDeleting(false);
    }
  };

  if (!ready) {
    return <p className="text-[14px] text-muted">{t.loading}</p>;
  }

  return (
    <div className="space-y-3">
      {!configured ? (
        <div className="flex items-start gap-3 rounded-sm border border-line/60 bg-elevated p-4 text-[13px] text-muted">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 text-down" strokeWidth={1.75} />
          <span>{t.notConfigured}</span>
        </div>
      ) : null}

      {/* ─── Profile ─────────────────────────────────────────────────────── */}
      <Section
        icon={<User className="h-4 w-4" strokeWidth={1.6} />}
        title={t.profileTitle}
        subtitle={t.profileSubtitle}
      >
        <div className="flex items-start gap-5">
          <Avatar url={profile?.avatar_url ?? null} fallback={initialsFor(profile?.display_name || email)} />
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t.emailLabel} value={email} readOnly />
            <Field
              label={t.displayNameLabel}
              value={profile?.display_name ?? ''}
              placeholder={t.displayNamePlaceholder}
              onChange={(v) => setProfile((p) => (p ? { ...p, display_name: v } : p))}
            />
            <div className="md:col-span-2">
              <Field
                label={t.avatarUrlLabel}
                value={profile?.avatar_url ?? ''}
                placeholder={t.avatarUrlPlaceholder}
                onChange={(v) => setProfile((p) => (p ? { ...p, avatar_url: v } : p))}
              />
            </div>
          </div>
        </div>
        <ActionRow>
          <PrimaryButton
            pending={savingProfile}
            onClick={() =>
              patch(
                {
                  display_name: profile?.display_name ?? null,
                  avatar_url: profile?.avatar_url ?? null,
                },
                setSavingProfile,
              )
            }
          >
            <Save aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            {t.saveProfile}
          </PrimaryButton>
        </ActionRow>
      </Section>

      {/* ─── Plan ────────────────────────────────────────────────────────── */}
      <Section
        icon={<CreditCard className="h-4 w-4" strokeWidth={1.6} />}
        title={t.planTitle}
        subtitle={t.planSubtitle}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-3xl font-medium tracking-tight text-ink">
              {t.planLabels[profile?.plan ?? 'free']}
              {profile?.cycle ? (
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  · {t.cycleLabels[profile.cycle]}
                </span>
              ) : null}
            </div>
            {profile?.current_period_end ? (
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {t.nextBilling} · {new Date(profile.current_period_end).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
              </div>
            ) : null}
            {!profile?.plan || profile.plan === 'free' ? (
              <p className="mt-3 max-w-md text-[13.5px] text-muted">{t.noStripeYet}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.stripe_customer ? (
              <PrimaryButton pending={openingPortal} onClick={openPortal}>
                <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                {t.openBilling}
              </PrimaryButton>
            ) : (
              <LinkButton href={`/${locale}/pricing`}>{t.upgradeCta}</LinkButton>
            )}
          </div>
        </div>
      </Section>

      {/* ─── Preferences ──────────────────────────────────────────────── */}
      <Section
        icon={<Key className="h-4 w-4" strokeWidth={1.6} />}
        title={t.prefsTitle}
        subtitle={t.prefsSubtitle}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            label={t.localeLabel}
            value={profile?.locale ?? locale}
            onChange={(v) => setProfile((p) => (p ? { ...p, locale: v as 'fr' | 'en' } : p))}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
          />
          <SelectField
            label={t.themeLabel}
            value={profile?.theme ?? 'light'}
            onChange={(v) => setProfile((p) => (p ? { ...p, theme: v as 'light' | 'dark' } : p))}
            options={[
              { value: 'light', label: t.themeLight },
              { value: 'dark', label: t.themeDark },
            ]}
          />
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-sm border border-line bg-canvas p-4">
          <input
            type="checkbox"
            checked={Boolean(profile?.marketing_optin)}
            onChange={(e) => setProfile((p) => (p ? { ...p, marketing_optin: e.target.checked } : p))}
            className="mt-0.5 h-4 w-4 accent-ink"
          />
          <span>
            <span className="block text-[14.5px] text-ink">{t.marketingLabel}</span>
            <span className="block text-[12.5px] text-muted">{t.marketingHint}</span>
          </span>
        </label>

        <ActionRow>
          <PrimaryButton
            pending={savingPrefs}
            onClick={() =>
              patch(
                {
                  locale: profile?.locale ?? undefined,
                  theme: profile?.theme ?? undefined,
                  marketing_optin: Boolean(profile?.marketing_optin),
                },
                setSavingPrefs,
              )
            }
          >
            <Check aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            {t.savePreferences}
          </PrimaryButton>
        </ActionRow>
      </Section>

      {/* ─── Security ─────────────────────────────────────────────────── */}
      <Section
        icon={<Shield className="h-4 w-4" strokeWidth={1.6} />}
        title={t.securityTitle}
        subtitle={t.securitySubtitle}
      >
        <div className="space-y-5">
          <div className="rounded-sm border border-line bg-canvas p-4">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {t.sessionEmail}
            </div>
            <div className="mt-2 text-[14.5px] text-ink">{email}</div>
          </div>

          <div className="rounded-sm border border-line bg-canvas p-4">
            <p className="text-[13.5px] text-muted">{t.passwordNotice}</p>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[13.5px] text-ink underline underline-offset-4 decoration-line transition-colors hover:decoration-ink"
            >
              {t.managePassword}
              <ExternalLink aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
            </a>
          </div>

          {/* TICKRA-PHASE-2.7: Passkeys (Web Authn) — biometric login. */}
          <div className="rounded-sm border border-line bg-canvas p-4">
            <PasskeyEnroll locale={locale} />
          </div>

          <ActionRow>
            <form action={`/api/auth/signout?locale=${locale}`} method="post">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[13.5px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
              >
                <LogOut aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.signOut}
              </button>
            </form>
          </ActionRow>
        </div>
      </Section>

      {/* ─── Data export ──────────────────────────────────────────────── */}
      <Section
        icon={<Download className="h-4 w-4" strokeWidth={1.75} />}
        title={t.dataTitle}
        subtitle={t.dataSubtitle}
      >
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[13.5px] font-medium tracking-tight text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          {exporting ? t.dataDownloading : t.dataCta}
        </button>
      </Section>

      {/* ─── Danger zone ──────────────────────────────────────────────── */}
      <Section
        icon={<AlertTriangle className="h-4 w-4 text-down" strokeWidth={1.75} />}
        title={t.dangerTitle}
        subtitle={t.dangerSubtitle}
        danger
      >
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-down px-4 text-[13.5px] font-medium tracking-tight text-down transition-colors hover:bg-down hover:text-canvas"
          >
            {t.deleteCta}
          </button>
        ) : (
          <div className="space-y-4">
            <label className="block text-[13.5px] text-ink">
              {t.deleteConfirmPrompt}
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={t.deletePlaceholder}
                className="mt-2 block h-11 w-full max-w-xs rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-down focus-visible:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDelete}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium tracking-tight transition-colors',
                  deleteConfirm === 'DELETE' && !deleting
                    ? 'bg-down text-canvas hover:bg-down/90'
                    : 'cursor-not-allowed bg-line text-subtle',
                )}
              >
                {t.deleteConfirmCta}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm('');
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[13.5px] font-medium tracking-tight text-muted transition-colors hover:border-ink hover:text-ink"
              >
                {t.deleteCancel}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── building blocks ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <article
      className={cn(
        'rounded-sm border bg-surface p-7 md:p-9',
        danger ? 'border-down/40' : 'border-line',
      )}
    >
      <header className="mb-7 flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border',
            danger ? 'border-down/40 text-down' : 'border-line text-ink',
          )}
        >
          {icon}
        </span>
        <div>
          <div className={cn('font-display text-lg font-medium tracking-tight', danger ? 'text-down' : 'text-ink')}>
            {title}
          </div>
          {subtitle ? <div className="mt-1 max-w-2xl text-[13.5px] text-muted">{subtitle}</div> : null}
        </div>
      </header>
      <div>{children}</div>
    </article>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'mt-2 block h-11 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none',
          readOnly && 'cursor-not-allowed bg-elevated text-muted',
        )}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block h-11 w-full rounded-sm border border-line bg-canvas px-3 text-[15px] text-ink focus-visible:border-ink focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 flex justify-end gap-2 border-t border-line/60 pt-5">{children}</div>;
}

function PrimaryButton({
  pending,
  onClick,
  children,
}: {
  pending?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
    >
      {children}
    </a>
  );
}

function Avatar({ url, fallback }: { url: string | null; fallback: string }) {
  if (url) {
    return (
      // Avatar comes from an arbitrary external provider URL; next/image would
      // require whitelisting every possible remote host. A plain img with a
      // no-referrer policy is the right call here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-16 w-16 flex-shrink-0 rounded-full border border-line object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-line bg-elevated font-display text-xl font-medium tracking-tight text-ink"
    >
      {fallback}
    </span>
  );
}
