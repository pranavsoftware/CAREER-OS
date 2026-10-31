'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AspirantApplications from '@/views/aspirant/Applications';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="aspirant">
      <AspirantApplications />
    </ProtectedRoute>
  );
}

