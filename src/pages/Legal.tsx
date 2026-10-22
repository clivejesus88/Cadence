import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';

const EFFECTIVE_DATE = 'October 22, 2026';
const CONTACT_EMAIL = 'support@cadence.app';

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="hit-slop glass-inset flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white active:scale-95">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl text-white">{title}</h1>
      </header>
      <p className="mt-2 px-1 text-xs text-neutral-500">Last updated {EFFECTIVE_DATE}</p>
      <div className="legal mt-6 space-y-5 text-sm leading-6 text-neutral-300">{children}</div>
    </div>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 font-display text-lg text-white">{children}</h2>;
}

export function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        Cadence is a focus timer for students. This policy explains what we collect,
        why, and the choices you have. Questions? Email{' '}
        <a className="text-ember-400" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <H>What we collect</H>
      <ul className="list-disc space-y-1.5 pl-5">
        <li><span className="text-neutral-200">Account data:</span> your email address and, if you provide it, a display name.</li>
        <li><span className="text-neutral-200">Study data:</span> tasks, focus sessions, preferences, goals, and distraction-plan rules you create.</li>
        <li><span className="text-neutral-200">Subscription data:</span> your plan status and PayPal subscription reference. We never see or store your card details — PayPal handles payment.</li>
        <li><span className="text-neutral-200">Push data:</span> a device push endpoint and key, plus your timezone, used only to deliver reminders you enable.</li>
        <li><span className="text-neutral-200">Diagnostics:</span> crash and error reports (Sentry) containing technical context, not your study content.</li>
      </ul>

      <H>How we use it</H>
      <p>
        To run the app, sync your data across your devices, deliver reminders you turn
        on, process subscriptions, and keep the service reliable and secure. We do not
        sell your data or use it for advertising.
      </p>

      <H>Where it is stored</H>
      <p>
        Data is stored in our Supabase backend and, for offline use, in your browser's
        local storage on your device. Payments are processed by PayPal under their own
        privacy policy.
      </p>

      <H>Retention & deletion</H>
      <p>
        Your data is kept while your account is active. You can delete your study data
        from the app, or email us to delete your account and associated data.
      </p>

      <H>Your rights</H>
      <p>
        Depending on where you live, you may have the right to access, correct, export,
        or delete your personal data, and to object to certain processing. Contact us to
        exercise these rights.
      </p>

      <H>Children</H>
      <p>
        Cadence is intended for students and is not directed at children under the age
        required by your local law to consent to data processing. If you believe a child
        has provided data, contact us and we will remove it.
      </p>

      <H>Changes</H>
      <p>
        We may update this policy. Material changes will be reflected by the date above.
      </p>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        These terms govern your use of Cadence. By using the app you agree to them. If
        you do not agree, please do not use the app.
      </p>

      <H>The service</H>
      <p>
        Cadence provides focus timers, study tracking, planning tools, and reminders. It
        is a productivity aid, not medical or professional advice. You are responsible
        for how you use it.
      </p>

      <H>Accounts</H>
      <p>
        You may use Cadence as a guest (data stays on your device) or create an account
        to sync. Keep your credentials secure and let us know about any unauthorised use.
      </p>

      <H>Subscriptions & billing</H>
      <p>
        Cadence Pro is a paid subscription billed through PayPal on a monthly or yearly
        basis. It renews automatically until cancelled. You can cancel any time through
        PayPal; access continues until the end of the current period. Prices are shown
        before purchase. Except where required by law, payments are non-refundable.
      </p>

      <H>Acceptable use</H>
      <p>
        Do not misuse the service, attempt to access others' data, disrupt the service,
        or use it for anything unlawful.
      </p>

      <H>Availability</H>
      <p>
        We aim to keep Cadence available but provide it "as is" without warranties.
        Features may change or be withdrawn.
      </p>

      <H>Limitation of liability</H>
      <p>
        To the maximum extent permitted by law, Cadence is not liable for indirect or
        consequential losses arising from your use of the app.
      </p>

      <H>Changes</H>
      <p>We may update these terms; continued use means you accept the updated terms.</p>

      <H>Contact</H>
      <p>
        Questions about these terms? Email{' '}
        <a className="text-ember-400" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
