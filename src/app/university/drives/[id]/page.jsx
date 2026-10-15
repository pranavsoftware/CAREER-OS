'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityDriveDetail from '@/views/university/DriveDetail';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityDriveDetail />
    </ProtectedRoute>
  );
}
