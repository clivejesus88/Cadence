import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, CalendarClockIcon, ChevronLeftIcon, GlobeIcon, LockIcon, PlusIcon, ShieldCheckIcon, SmartphoneIcon, CrownIcon, XIcon } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { blockedApps } from '../data/blockedApps';
import { BlockingRule, BlockingRuleKind } from '../types/blocklist';
import { isPro, FeatureKey } from '../utils/premium';
import { ToggleSwitch } from '../components/profile/ToggleSwitch';
import { UpgradeSheet } from '../components/premium/UpgradeSheet';
import { Modal, ModalHeader } from '../components/ui/Modal';

const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const kindOptions: { kind: BlockingRuleKind; label: string; icon: typeof SmartphoneIcon }[] = [
  { kind: 'app', label: 'Apps', icon: SmartphoneIcon },
  { kind: 'schedule', label: 'Schedule', icon: CalendarClockIcon },
  { kind: 'website', label: 'Websites', icon: GlobeIcon }];

function makeId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function ruleTitle(rule: BlockingRule): string {
  if (rule.kind === 'app') {
    const apps = (rule.appIds ?? []);
    if (apps.length === 1) {
      const app = blockedApps.find((a) => a.id === apps[0]);
      return `Avoid ${app?.name ?? 'app'}`;
    }
    return `Avoid ${apps.length} apps`;
  }
  if (rule.kind === 'schedule') return 'Scheduled focus windows';
  const sites = (rule.websites ?? []);
  return sites.length === 1 ? `Avoid ${sites[0]}` : `Avoid ${sites.length} websites`;
}

function ruleSummary(rule: BlockingRule): string {
  if (rule.kind === 'app') return 'Reminds you to keep these closed during focus';
  if (rule.kind === 'website') return 'Reminds you to keep these tabs closed';
  const days = (rule.days ?? []).map((d) => dayLabels[d]).join(', ');
  const window = rule.start && rule.end ? `${rule.start}–${rule.end}` : 'any time';
  return `${days || 'Every day'} · ${window}`;
}

export function BlockingRules() {
  const navigate = useNavigate();
  const { profile, preferences, updatePreference } = useSettings();
  const pro = isPro(profile);
  const rules = preferences.blockingRules;
  const [editing, setEditing] = useState<BlockingRule | null>(null);
  const [upgrade, setUpgrade] = useState<FeatureKey | null>(null);

  const persist = (next: BlockingRule[]) => updatePreference('blockingRules', next);

  const toggleRule = (id: string) => {
    persist(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const removeRule = (id: string) => {
    persist(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate('/app/profile')} aria-label="Back to profile" className="hit-slop glass-inset flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white active:scale-95">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl text-white">Distraction plan</h1>
      </header>

      {pro ?
      <>
        <p className="mt-2 text-sm text-neutral-400">
          Cadence can't close other apps for you — but it can remind you what you chose to avoid, by app, schedule, or website.
        </p>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Rules</p>
            <button
              onClick={() => setEditing({ id: '', kind: 'app', title: '', enabled: true, appIds: [], createdAt: Date.now() })}
              className="inline-flex items-center gap-1.5 rounded-full bg-ember-500 text-ink-950 hit-slop px-3.5 py-2 text-xs font-bold transition-colors hover:bg-ember-400">
              <PlusIcon className="h-4 w-4" />
              Add rule
            </button>
          </div>

          {rules.length === 0 &&
          <div className="glass rounded-2xl px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                <ShieldCheckIcon className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-white">No rules yet</p>
              <p className="mt-1 text-xs text-neutral-500">Add a schedule, app, or website to plan your focus.</p>
            </div>
          }

          <div className="space-y-2.5">
            {rules.map((rule) =>
            <div key={rule.id} className={`glass rounded-2xl px-4 py-3.5 transition-opacity ${rule.enabled ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                    {rule.kind === 'app' ? <SmartphoneIcon className="h-4 w-4 text-ember-400" /> : rule.kind === 'website' ? <GlobeIcon className="h-4 w-4 text-ember-400" /> : <CalendarClockIcon className="h-4 w-4 text-ember-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{ruleTitle(rule)}</p>
                    <p className="truncate text-xs text-neutral-400">{ruleSummary(rule)}</p>
                  </div>
                  <ToggleSwitch label={rule.title} checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                  <button
                    onClick={() => removeRule(rule.id)}
                    aria-label="Delete rule"
                    className="hit-slop flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/10 hover:text-white active:scale-90">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </>
      :
      <section className="glass-strong relative mt-6 overflow-hidden rounded-2xl p-5">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-ember-500/20 blur-[60px]" />
          </div>
          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 to-orange-600">
              <LockIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Advanced distraction plan</p>
              <p className="mt-0.5 text-xs text-neutral-400">Plan by schedule, per app, or per website with Pro.</p>
              <button
                onClick={() => setUpgrade('blockingRules')}
                className="hit-slop mt-3 inline-flex items-center gap-1.5 rounded-full bg-ember-500/15 px-3.5 py-2 text-xs font-semibold text-ember-400 transition-colors hover:bg-ember-500/25 active:bg-ember-500/30">
                <CrownIcon className="h-3.5 w-3.5" />
                Unlock distraction plan
              </button>
            </div>
          </div>
        </section>
      }

      <UpgradeSheet feature={upgrade} onClose={() => setUpgrade(null)} />
      {editing && <RuleEditor initial={editing} onClose={() => setEditing(null)} onSave={(next) => {
          if (next.id) {
            persist(rules.map((r) => (r.id === next.id ? next : r)));
          } else {
            persist([...rules, { ...next, id: makeId('r') }]);
          }
          setEditing(null);
        }} />}
    </div>);

}

interface RuleEditorProps {
  initial: BlockingRule;
  onClose: () => void;
  onSave: (rule: BlockingRule) => void;
}

function StepLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ember-500/20 text-[11px] font-bold text-ember-400">
        {n}
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
    </div>
  );
}

function AppChip({ app, on, onToggle }: { app: { id: string; name: string; color: string }; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
      on ? 'border-ember-400 bg-ember-500/15 text-white' : 'border-white/8 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] active:bg-white/[0.12]'}`
      }>
      
      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: app.color }} />
      <span className="min-w-0 flex-1 truncate text-left">{app.name}</span>
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
      on ? 'bg-ember-500 text-ink-950' : 'bg-white/10 text-transparent'}`
      }>
        
        <CheckIcon className="h-3 w-3" />
      </span>
    </button>
  );
}

function RuleEditor({ initial, onClose, onSave }: RuleEditorProps) {
  const [kind, setKind] = useState<BlockingRuleKind>(initial.kind);
  const [appIds, setAppIds] = useState<string[]>(initial.appIds ?? []);
  const [days, setDays] = useState<number[]>(initial.days ?? []);
  const [start, setStart] = useState(initial.start ?? '09:00');
  const [end, setEnd] = useState(initial.end ?? '17:00');
  const [websitesRaw, setWebsitesRaw] = useState((initial.websites ?? []).join(', '));

  const toggleApp = (id: string) => {
    setAppIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };
  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const canSave = kind === 'app' ? appIds.length > 0 : kind === 'schedule' ? days.length > 0 : websitesRaw.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: initial.id,
      kind,
      title: ruleTitle({ ...initial, kind, appIds, days, websites: parsedWebsites() }),
      enabled: initial.enabled,
      appIds: kind === 'app' || kind === 'schedule' ? appIds : undefined,
      days: kind === 'schedule' ? days : undefined,
      start: kind === 'schedule' ? start : undefined,
      end: kind === 'schedule' ? end : undefined,
      websites: kind === 'website' ? parsedWebsites() : undefined,
      createdAt: initial.createdAt
    });
  };

  const parsedWebsites = () =>
    websitesRaw.split(',').map((w) => w.trim().toLowerCase()).filter((w) => w.length > 0);

  const selectedApps = blockedApps.filter((a) => appIds.includes(a.id));

  return (
    <Modal open onClose={onClose} variant="center">
      <ModalHeader
      eyebrow="Blocking rule"
      title={initial.id ? 'Edit rule' : 'New rule'}
      subtitle="Choose what you'll be reminded to avoid during focus."
      onClose={onClose} />

      <div className="modal-divider my-5 h-px" />

        <StepLabel n="1" title="Rule type" />
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {kindOptions.map(({ kind: k, label, icon: Icon }) => {
            const active = kind === k;
            return (
              <button
                type="button"
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-all active:scale-95 ${
                active ? 'border-ember-400 bg-ember-500/15 text-white' : 'border-white/8 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] active:bg-white/[0.12]'}`
                }>
                
                <Icon className={`h-5 w-5 ${active ? 'text-ember-400' : 'text-neutral-400'}`} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="my-6 h-px bg-white/5" />

        <StepLabel n="2" title={
            kind === 'app' ? 'Choose apps' : kind === 'schedule' ? 'Set the schedule' : 'Add websites'
          }
        />

        {kind === 'app' &&
        <>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {blockedApps.map((app) =>
            <AppChip key={app.id} app={app} on={appIds.includes(app.id)} onToggle={() => toggleApp(app.id)} />
            )}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {appIds.length === 0 ? 'Pick at least one app to avoid.' : `${appIds.length} app${appIds.length === 1 ? '' : 's'} in your plan · you'll be nudged during focus`}
          </p>
        </>
        }

        {kind === 'schedule' &&
        <>
          <div className="mt-3 space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-400">Days of the week</p>
              <div className="flex gap-2">
                {dayLabels.map((label, i) => {
                  const active = days.includes(i);
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleDay(i)}
                      aria-pressed={active}
                      className={`flex-1 rounded-2xl border py-3.5 text-xs font-bold transition-all active:scale-95 ${
                      active ? 'border-ember-400 bg-ember-500 text-ink-950' : 'border-white/8 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] active:bg-white/[0.12]'}`
                      }>
                      
                        {label}
                      </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rule-start" className="mb-2 block text-xs font-medium text-neutral-400">Starts at</label>
                <input
                  id="rule-start"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="glass-inset w-full rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-ember-400" />
                
              </div>
              <div>
                <label htmlFor="rule-end" className="mb-2 block text-xs font-medium text-neutral-400">Ends at</label>
                <input
                  id="rule-end"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="glass-inset w-full rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-ember-400" />
                
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3.5">
              <p className="mb-2 text-xs font-medium text-neutral-400">Apps to avoid in this window</p>
              {appIds.length === 0 ?
              <p className="text-xs text-neutral-500 py-1">No apps selected — nothing extra to avoid right now.</p> :
              <div className="flex flex-wrap gap-1.5">
                {selectedApps.map((a) =>
                <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-neutral-200">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                    {a.name}
                  </span>
                )}
              </div>
              }
            </div>
          </div>
        </>
        }

        {kind === 'website' &&
        <>
          <div className="relative mt-3">
            <GlobeIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
            <input
              value={websitesRaw}
              onChange={(e) => setWebsitesRaw(e.target.value)}
              placeholder="instagram.com, reddit.com"
              type="text"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="glass-inset w-full rounded-2xl py-3 pl-10 pr-3.5 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <p className="mt-2.5 text-xs text-neutral-500">
            {parsedWebsites().length === 0 ?
            'Separate sites with commas — e.g. instagram.com, reddit.com' :
            `${parsedWebsites().length} site${parsedWebsites().length === 1 ? '' : 's'} in your plan`}
          </p>
        </>
        }

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="glass rounded-full px-6 py-4 text-[15px] font-semibold text-neutral-300 transition-colors hover:text-white active:scale-[0.98]">
            
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 rounded-full py-4 text-[15px] font-bold transition-transform active:scale-[0.98] ${
            canSave ? 'bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 text-white' : 'bg-white/10 text-neutral-500'}`
            }>
            
              Save rule
            </button>
        </div>
    </Modal>);

}