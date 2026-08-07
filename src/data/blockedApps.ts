import { BlockedApp } from '../types/blocklist';

export const blockedApps: BlockedApp[] = [
{ id: 'instagram', name: 'Instagram', color: '#E1306C', blockedByDefault: true },
{ id: 'tiktok', name: 'TikTok', color: '#25F4EE', blockedByDefault: true },
{ id: 'youtube', name: 'YouTube', color: '#FF0000', blockedByDefault: true },
{ id: 'x', name: 'X / Twitter', color: '#1DA1F2', blockedByDefault: false },
{ id: 'reddit', name: 'Reddit', color: '#FF4500', blockedByDefault: false },
{ id: 'messages', name: 'Messages', color: '#34C759', blockedByDefault: false }];