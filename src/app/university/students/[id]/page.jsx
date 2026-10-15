'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityStudentDetail from '@/views/university/StudentDetail';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityStudentDetail />
    </ProtectedRoute>
  );
}
