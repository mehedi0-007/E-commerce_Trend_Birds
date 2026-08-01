import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { AppLayout } from './components/AppLayout';
import { ForbiddenView } from './components/ForbiddenView';

import { DashboardView } from './views/DashboardView';
import { PermissionsView } from './views/PermissionsView';
import { RolesView } from './views/RolesView';
import { UsersView } from './views/UsersView';
import { MediaView } from './views/MediaView';
import { CategoriesView } from './views/CategoriesView';
import { BrandsView } from './views/BrandsView';
import { AttributesView } from './views/AttributesView';
import { ProductsView } from './views/ProductsView';

const WatchGuard: React.FC<{ moduleName: string; children: React.ReactElement }> = ({
  moduleName,
  children,
}) => {
  const { canWatch } = useAuth();
  if (!canWatch(moduleName)) {
    return <ForbiddenView moduleName={moduleName} />;
  }
  return children;
};

const ProtectedRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardView />} />
        <Route
          path="permissions"
          element={
            <WatchGuard moduleName="permission">
              <PermissionsView />
            </WatchGuard>
          }
        />

        <Route
          path="media"
          element={
            <WatchGuard moduleName="media">
              <MediaView />
            </WatchGuard>
          }
        />
        <Route
          path="categories"
          element={
            <WatchGuard moduleName="category">
              <CategoriesView />
            </WatchGuard>
          }
        />
        <Route
          path="brands"
          element={
            <WatchGuard moduleName="brand">
              <BrandsView />
            </WatchGuard>
          }
        />
        <Route
          path="attributes"
          element={
            <WatchGuard moduleName="attribute">
              <AttributesView />
            </WatchGuard>
          }
        />
        <Route
          path="products"
          element={
            <WatchGuard moduleName="product">
              <ProductsView />
            </WatchGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route
        path="roles"
        element={
          <WatchGuard moduleName="role">
            <RolesView />
          </WatchGuard>
        }
      />
      <Route
        path="users"
        element={
          <WatchGuard moduleName="user">
            <UsersView />
          </WatchGuard>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginViewWrapper />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

const LoginViewWrapper: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginView />;
};

export default App;
