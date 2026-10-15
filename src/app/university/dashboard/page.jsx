'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityDashboard from '@/views/university/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityDashboard />
    </ProtectedRoute>
  );
}
