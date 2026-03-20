import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export function SettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Cai dat"
      description="Cac tuy chinh he thong se xuat hien tai day."
    />
  );
}
