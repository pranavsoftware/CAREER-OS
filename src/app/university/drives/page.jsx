'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityDrives from '@/views/university/Drives';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityDrives />
    </ProtectedRoute>
  );
}
