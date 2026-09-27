import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { UserLayout } from "../components/layouts/UserLayout";
import { AdminLayout } from "../components/layouts/AdminLayout";
import { DemoLayout } from "../components/layouts/DemoLayout";
import { UserDashboard } from "../pages/UserDashboard";
import { DemoDashboard } from "../pages/DemoDashboard";
import { DevicesPage } from "../pages/DevicesPage";
import { UsagePage } from "../pages/UsagePage";
import { CostPage } from "../pages/CostPage";
import { AlertsPage } from "../pages/AlertsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { AdminOverview } from "../pages/admin/AdminOverview";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminDevicesPage } from "../pages/admin/AdminDevicesPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";
import { AdminAlertsPage } from "../pages/admin/AdminAlertsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";

function ProtectedRoute({ children, roles }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function DemoRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "demo") return <Navigate to="/dashboard" replace />;
  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/demo"
          element={
            <DemoRoute>
              <DemoLayout />
            </DemoRoute>
          }
        >
          <Route index element={<DemoDashboard />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["admin", "user"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="cost" element={<CostPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="devices" element={<AdminDevicesPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
