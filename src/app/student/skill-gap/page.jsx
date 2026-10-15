'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentSkillGap from '@/views/student/SkillGap';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentSkillGap />
    </ProtectedRoute>
  );
}
