'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentDashboard from '@/views/student/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  );
}
