'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityInsights from '@/views/company/UniversityInsights';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <UniversityInsights />
    </ProtectedRoute>
  );
}

