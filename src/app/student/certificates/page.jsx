'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentCertificates from '@/views/student/Certificates';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentCertificates />
    </ProtectedRoute>
  );
}
