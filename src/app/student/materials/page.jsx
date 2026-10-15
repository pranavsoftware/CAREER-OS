'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentMaterials from '@/views/student/Materials';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentMaterials />
    </ProtectedRoute>
  );
}
