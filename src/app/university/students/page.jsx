'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityStudents from '@/views/university/Students';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityStudents />
    </ProtectedRoute>
  );
}
