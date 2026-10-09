import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentResume from './pages/student/Resume';
import StudentApplications from './pages/student/Applications';
import StudentCertificates from './pages/student/Certificates';
import StudentSkillGap from './pages/student/SkillGap';
import StudentInterviewPrep from './pages/student/InterviewPrep';
import StudentPortfolio from './pages/student/Portfolio';

// University Pages
import UniversityDashboard from './pages/university/Dashboard';
import UniversityStudents from './pages/university/Students';
import UniversityStudentDetail from './pages/university/StudentDetail';
import UniversityDrives from './pages/university/Drives';
import UniversityDriveDetail from './pages/university/DriveDetail';
import UniversityMailFilter from './pages/university/MailFilter';

// Company Pages
import CompanyDashboard from './pages/company/Dashboard';
import CompanyJobs from './pages/company/Jobs';
import CompanyCandidates from './pages/company/Candidates';
import CompanyCandidateDetail from './pages/company/CandidateDetail';
import CompanyPipeline from './pages/company/Pipeline';

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
            {/* Public Landing & Login */}
            <Route path="/" element={<Landing />} />
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
              path="/student/portfolio"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentPortfolio />
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

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
