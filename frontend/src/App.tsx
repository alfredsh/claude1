import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Toaster } from './components/ui/toaster'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientLayout from './components/layout/PatientLayout'
import DoctorLayout from './components/layout/DoctorLayout'

// Patient pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientProfile from './pages/patient/Profile'
import LabResults from './pages/patient/LabResults'
import HealthMetrics from './pages/patient/HealthMetrics'
import AICoach from './pages/patient/AICoach'
import Nutrition from './pages/patient/Nutrition'
import Supplements from './pages/patient/Supplements'
import PatientRecommendations from './pages/patient/Recommendations'
import MedicalDocuments from './pages/patient/MedicalDocuments'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import PatientsList from './pages/doctor/PatientsList'
import PatientDetail from './pages/doctor/PatientDetail'
import DoctorAIAssistant from './pages/doctor/AIAssistant'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'DOCTOR' ? '/doctor' : '/patient'} replace />
            : <LandingPage />
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient routes */}
        <Route path="/patient" element={
          <ProtectedRoute role="PATIENT">
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PatientDashboard />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="lab" element={<LabResults />} />
          <Route path="metrics" element={<HealthMetrics />} />
          <Route path="ai-coach" element={<AICoach />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="supplements" element={<Supplements />} />
          <Route path="recommendations" element={<PatientRecommendations />} />
          <Route path="documents" element={<MedicalDocuments />} />
        </Route>

        {/* Doctor routes */}
        <Route path="/doctor" element={
          <ProtectedRoute role="DOCTOR">
            <DoctorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DoctorDashboard />} />
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="ai-assistant" element={<DoctorAIAssistant />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
