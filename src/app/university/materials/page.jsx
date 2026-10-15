'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityMaterials from '@/views/university/Materials';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityMaterials />
    </ProtectedRoute>
  );
}
