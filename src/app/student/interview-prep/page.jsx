'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentInterviewPrep from '@/views/student/InterviewPrep';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentInterviewPrep />
    </ProtectedRoute>
  );
}
