'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentProfile from '@/views/student/Profile';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentProfile />
    </ProtectedRoute>
  );
}
