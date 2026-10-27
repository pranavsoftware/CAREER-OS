import ClientInterviewRoom from './ClientInterviewRoom';

export const dynamic = 'force-dynamic';

export default async function InterviewRoomPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const meetingId = resolvedParams?.id || '';
  return <ClientInterviewRoom meetingId={meetingId} />;
}
