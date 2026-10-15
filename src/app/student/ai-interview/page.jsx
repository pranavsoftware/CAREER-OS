'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentAiInterview from '@/views/student/AiInterview';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentAiInterview />
    </ProtectedRoute>
  );
}
