import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import UploadPage from './pages/dashboard/UploadPage';
import EditorPage from './pages/dashboard/EditorPage';
import ATSReportPage from './pages/dashboard/ATSReportPage';
import VersionsPage from './pages/dashboard/VersionsPage';
import TemplatesPage from './pages/dashboard/TemplatesPage';
import BillingPage from './pages/dashboard/BillingPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AdminPage from './pages/AdminPage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import SubscriptionModal from './components/payment/SubscriptionModal';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const showModal = useUIStore((s) => s.showSubscriptionModal);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2433',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {showModal && <SubscriptionModal />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="editor/:id" element={<EditorPage />} />
          <Route path="ats/:id" element={<ATSReportPage />} />
          <Route path="versions" element={<VersionsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
