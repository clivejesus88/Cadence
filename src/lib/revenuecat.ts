import { Purchases } from '@revenuecat/purchases-js';

const apiKey = import.meta.env.VITE_REVENUECAT_WEB_API_KEY?.trim() ?? '';

export function isRevenueCatConfigured(): boolean {
  return apiKey.length > 0;
}

export async function getRevenueCatPurchases(appUserId: string): Promise<Purchases> {
  if (!apiKey) {
    throw new Error('RevenueCat checkout is not configured. Set VITE_REVENUECAT_WEB_API_KEY.');
  }
  if (!appUserId || appUserId === 'guest') {
    throw new Error('Sign in to an account before starting a subscription.');
  }

  if (!Purchases.isConfigured()) {
    return Purchases.configure({ apiKey, appUserId });
  }

  const purchases = Purchases.getSharedInstance();
  if (purchases.getAppUserId() !== appUserId) {
    await purchases.changeUser(appUserId);
  }
  return purchases;
}
