'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityAdmissions from '@/views/university/Admissions';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityAdmissions />
    </ProtectedRoute>
  );
}

