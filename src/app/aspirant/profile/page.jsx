'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AspirantProfile from '@/views/aspirant/Profile';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="aspirant">
      <AspirantProfile />
    </ProtectedRoute>
  );
}

