'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentInterviews from '@/views/student/Interviews';

export default function StudentCallsPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentInterviews />
    </ProtectedRoute>
  );
}
