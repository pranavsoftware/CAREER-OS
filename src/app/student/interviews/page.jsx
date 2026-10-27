'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentInterviews from '@/views/student/Interviews';

export default function StudentInterviewsPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentInterviews />
    </ProtectedRoute>
  );
}
