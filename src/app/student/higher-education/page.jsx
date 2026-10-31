'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import HigherEducation from '@/views/student/HigherEducation';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <HigherEducation />
    </ProtectedRoute>
  );
}

