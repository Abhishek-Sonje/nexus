import { loadDashboard } from '../lib/dashboard';
import { Observatory } from './observatory';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const snapshot = await loadDashboard().catch(() => null);
  return <Observatory snapshot={snapshot} />;
}
