'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentReferrals from '@/views/student/Referrals';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentReferrals />
    </ProtectedRoute>
  );
}

