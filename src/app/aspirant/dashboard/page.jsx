'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AspirantDashboard from '@/views/aspirant/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="aspirant">
      <AspirantDashboard />
    </ProtectedRoute>
  );
}

