'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CertificateReview from '@/views/university/CertificateReview';

export default function UniversityCertificateReviewPage() {
  return (
    <ProtectedRoute allowedRole="university">
      <CertificateReview />
    </ProtectedRoute>
  );
}

