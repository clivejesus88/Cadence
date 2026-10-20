import { db } from './db';

export async function seedIfEmpty(): Promise<void> {
  // Do not seed demo tasks/sessions. Show empty state until authenticated.
  void db;
}