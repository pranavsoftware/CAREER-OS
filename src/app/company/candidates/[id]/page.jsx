'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyCandidateDetail from '@/views/company/CandidateDetail';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyCandidateDetail />
    </ProtectedRoute>
  );
}
