'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyPipeline from '@/views/company/Pipeline';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyPipeline />
    </ProtectedRoute>
  );
}
