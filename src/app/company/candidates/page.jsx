'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyCandidates from '@/views/company/Candidates';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyCandidates />
    </ProtectedRoute>
  );
}
