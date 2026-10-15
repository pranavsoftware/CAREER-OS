'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyDashboard from '@/views/company/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyDashboard />
    </ProtectedRoute>
  );
}
