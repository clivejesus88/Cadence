export interface BlockedApp {
  id: string;
  name: string;
  color: string;
  blockedByDefault: boolean;
}

export type BlockingRuleKind = 'app' | 'schedule' | 'website';

export interface BlockingRule {
  id: string;
  kind: BlockingRuleKind;
  title: string;
  enabled: boolean;
  appIds?: string[];
  days?: number[]; // 0 = Sunday ... 6 = Saturday
  start?: string; // "HH:mm"
  end?: string;
  websites?: string[];
  createdAt: number;
}