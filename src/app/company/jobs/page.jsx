'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyJobs from '@/views/company/Jobs';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyJobs />
    </ProtectedRoute>
  );
}
