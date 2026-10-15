'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentMail from '@/views/student/Mail';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentMail />
    </ProtectedRoute>
  );
}
