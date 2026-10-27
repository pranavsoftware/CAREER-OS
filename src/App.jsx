import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './views/Landing';
import About from './views/About';
import Login from './views/Login';
import NotFound from './views/NotFound';

// Student Pages
import StudentDashboard from './views/student/Dashboard';
import StudentProfile from './views/student/Profile';
import StudentResume from './views/student/Resume';
import StudentApplications from './views/student/Applications';
import StudentCertificates from './views/student/Certificates';
import StudentSkillGap from './views/student/SkillGap';
import StudentInterviewPrep from './views/student/InterviewPrep';
import StudentAiInterview from './views/student/AiInterview';
import StudentPortfolio from './views/student/Portfolio';
import StudentMail from './views/student/Mail';
import StudentInterviews from './views/student/Interviews';
import InterviewRoom from './views/InterviewRoom';

// University Pages
import UniversityDashboard from './views/university/Dashboard';
import UniversityStudents from './views/university/Students';
import UniversityStudentDetail from './views/university/StudentDetail';
import UniversityDrives from './views/university/Drives';
import UniversityDriveDetail from './views/university/DriveDetail';
import UniversityMailFilter from './views/university/MailFilter';

// Company Pages
import CompanyDashboard from './views/company/Dashboard';
import CompanyJobs from './views/company/Jobs';
import CompanyCandidates from './views/company/Candidates';
import CompanyCandidateDetail from './views/company/CandidateDetail';
import CompanyPipeline from './views/company/Pipeline';
import CompanyInterviews from './views/company/Interviews';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user?.role === 'university') return <Navigate to="/university/dashboard" replace />;
  if (user?.role === 'company') return <Navigate to="/company/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing, About & Login */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />

            {/* Student Protected Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/mail"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentMail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/resume"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentResume />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/skill-gap"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentSkillGap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/interview-prep"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentInterviewPrep />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/ai-interview"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentAiInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/portfolio"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentPortfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/interviews"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/calls"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentInterviews />
                </ProtectedRoute>
              }
            />

            {/* University Protected Routes */}
            <Route
              path="/university/dashboard"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university/students"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university/students/:id"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityStudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university/drives"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityDrives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university/drives/:id"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityDriveDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university/mail-filter"
              element={
                <ProtectedRoute allowedRole="university">
                  <UniversityMailFilter />
                </ProtectedRoute>
              }
            />

            {/* Company Protected Routes */}
            <Route
              path="/company/dashboard"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/jobs"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/candidates"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/candidates/:id"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyCandidateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/pipeline"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/interviews"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/calls"
              element={
                <ProtectedRoute allowedRole="company">
                  <CompanyInterviews />
                </ProtectedRoute>
              }
            />

            {/* Live Online Video Interview Room */}
            <Route path="/interview-room/:id" element={<InterviewRoom />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
