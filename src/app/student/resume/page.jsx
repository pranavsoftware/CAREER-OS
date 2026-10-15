'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentResume from '@/views/student/Resume';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentResume />
    </ProtectedRoute>
  );
}
