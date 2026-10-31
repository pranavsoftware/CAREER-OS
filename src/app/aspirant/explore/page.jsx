'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CollegeExplorer from '@/views/aspirant/Explore';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="aspirant">
      <CollegeExplorer />
    </ProtectedRoute>
  );
}

