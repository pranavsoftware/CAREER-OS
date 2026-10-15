'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentApplications from '@/views/student/Applications';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentApplications />
    </ProtectedRoute>
  );
}
