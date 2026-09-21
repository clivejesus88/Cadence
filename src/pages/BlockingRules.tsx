import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClockIcon, ChevronLeftIcon, GlobeIcon, LockIcon, PlusIcon, ShieldCheckIcon, SmartphoneIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { blockedApps } from '../data/blockedApps';
import { BlockingRule, BlockingRuleKind } from '../types/blocklist';
import { isPro, FeatureKey } from '../utils/premium';
import { ToggleSwitch } from '../components/profile/ToggleSwitch';
import { UpgradeSheet } from '../components/premium/UpgradeSheet';

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
      return `Block ${app?.name ?? 'app'}`;
    }
    return `Block ${apps.length} apps`;
  }
  if (rule.kind === 'schedule') return 'Scheduled blocking';
  const sites = (rule.websites ?? []);
  return sites.length === 1 ? `Block ${sites[0]}` : `Block ${sites.length} websites`;
}

function ruleSummary(rule: BlockingRule): string {
  if (rule.kind === 'app') return 'Blocks selected apps during focus';
  if (rule.kind === 'website') return 'Blocks selected sites during focus';
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
        <button onClick={() => navigate('/app/profile')} aria-label="Back to profile" className="glass-inset flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl text-white">Blocking rules</h1>
      </header>

      {pro ?
      <>
        <p className="mt-2 text-sm text-neutral-400">Customize what stays muted — by app, schedule, or website.</p>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Rules</p>
            <button
              onClick={() => setEditing({ id: '', kind: 'app', title: '', enabled: true, appIds: [], createdAt: Date.now() })}
              className="inline-flex items-center gap-1.5 rounded-full bg-ember-500 text-ink-950 px-3.5 py-2 text-xs font-bold transition-colors hover:bg-ember-400">
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
              <p className="mt-1 text-xs text-neutral-500">Add a schedule, app, or website rule to take control.</p>
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
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/10 hover:text-white">
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
              <p className="text-sm font-semibold text-white">Advanced blocking rules</p>
              <p className="mt-0.5 text-xs text-neutral-400">Block by schedule, per app, or per website with Pro.</p>
              <button
                onClick={() => setUpgrade('blockingRules')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ember-500/15 px-3.5 py-2 text-xs font-semibold text-ember-400 transition-colors hover:bg-ember-500/25">
                <SparklesIcon className="h-3.5 w-3.5" />
                Unlock blocking rules
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="glass-strong relative w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-3xl px-5 pt-5 pb-6">
        
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-lg text-white">{initial.id ? 'Edit rule' : 'New rule'}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="glass-inset w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          {kindOptions.map(({ kind: k, label, icon: Icon }) =>
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            kind === k ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
            }>
            
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {kind === 'app' &&
          <>
            <p className="text-xs text-neutral-500">Select apps to block during focus</p>
            <div className="grid grid-cols-2 gap-2">
              {blockedApps.map((app) =>
              <button
                key={app.id}
                onClick={() => toggleApp(app.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                appIds.includes(app.id) ? 'bg-ember-500/20 border border-ember-400 text-white' : 'glass-inset text-neutral-300'}`
                }>
                
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: app.color }} />
                  {app.name}
                </button>
              )}
            </div>
          </>
          }

          {kind === 'schedule' &&
          <>
            <div>
              <p className="text-xs text-neutral-500 mb-2">Days</p>
              <div className="flex gap-1.5">
                {dayLabels.map((label, i) =>
                <button
                  key={label}
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  days.includes(i) ? 'bg-ember-500 text-ink-950' : 'glass-inset text-neutral-300'}`
                  }>
                  
                    {label}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1.5 block">Start</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="glass-inset w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1.5 block">End</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="glass-inset w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-2">Apps to mute in this window</p>
              <div className="grid grid-cols-2 gap-2">
                {blockedApps.map((app) =>
                <button
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  appIds.includes(app.id) ? 'bg-ember-500/20 border border-ember-400 text-white' : 'glass-inset text-neutral-300'}`
                  }>
                  
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: app.color }} />
                    {app.name}
                  </button>
                )}
              </div>
            </div>
          </>
          }

          {kind === 'website' &&
          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Websites to block (comma separated)</p>
            <input
              value={websitesRaw}
              onChange={(e) => setWebsitesRaw(e.target.value)}
              placeholder="instagram.com, reddit.com"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none" />
            
          </div>
          }
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full mt-6 py-4 rounded-full font-semibold text-[15px] transition-transform active:scale-[0.98] ${
          canSave ? 'bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 text-white' : 'bg-white/10 text-neutral-500'}`
          }>
          
            Save rule
          </button>
      </motion.div>
    </div>);
}