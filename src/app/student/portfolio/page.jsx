'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import StudentPortfolio from '@/views/student/Portfolio';

export default function StudentPortfolioPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentPortfolio />
    </ProtectedRoute>
  );
}
