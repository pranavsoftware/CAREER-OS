'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RecordsImport from '@/views/university/RecordsImport';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <RecordsImport />
    </ProtectedRoute>
  );
}

