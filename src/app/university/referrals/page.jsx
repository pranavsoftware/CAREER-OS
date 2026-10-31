'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UniversityReferrals from '@/views/university/Referrals';

export default function Page() {
  return (
    <ProtectedRoute allowedRole="university">
      <UniversityReferrals />
    </ProtectedRoute>
  );
}

