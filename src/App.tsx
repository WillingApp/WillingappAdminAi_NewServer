import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Requests from './pages/Requests';
import Content from './pages/Content';
import Groups from './pages/Groups';
import Feedbacks from './pages/Feedbacks';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { MetadataProvider } from './context/MetadataContext';
import { LoadingOverlay, Box } from '@mantine/core';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box h="100vh" pos="relative">
        <LoadingOverlay visible={true} overlayProps={{ blur: 2 }} />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <MetadataProvider>
        {isAuthenticated ? (
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/content" element={<Content />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/feedbacks" element={<Feedbacks />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </MetadataProvider>
    </BrowserRouter>
  );
}

export default App;
