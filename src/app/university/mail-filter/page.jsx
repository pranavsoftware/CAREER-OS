'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityMailFilter from '@/views/university/MailFilter';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityMailFilter />
    </ProtectedRoute>
  );
}
