'use client';

import dynamic from 'next/dynamic';

const InterviewRoom = dynamic(() => import('@/views/InterviewRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-300 font-medium text-sm">Connecting to secure interview room...</p>
    </div>
  ),
});

export default function ClientInterviewRoom({ meetingId }) {
  return <InterviewRoom meetingId={meetingId} />;
}
