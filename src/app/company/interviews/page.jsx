'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CompanyInterviews from '@/views/company/Interviews';

export default function CompanyInterviewsPage() {
  return (
    <ProtectedRoute allowedRole="company">
      <CompanyInterviews />
    </ProtectedRoute>
  );
}
