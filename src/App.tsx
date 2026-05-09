import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Members from "./pages/Members.tsx";
import Profile from "./pages/Profile.tsx";
import Tenders from "./pages/Tenders.tsx";
import TenderDetail from "./pages/TenderDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary scope="root">
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute requireOrg={false}>
                      <ErrorBoundary scope="onboarding"><Onboarding /></ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<ProtectedRoute><ErrorBoundary scope="index"><Index /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ErrorBoundary scope="profile"><Profile /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/members" element={<ProtectedRoute><ErrorBoundary scope="members"><Members /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/tenders" element={<ProtectedRoute><ErrorBoundary scope="tenders"><Tenders /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/tenders/:id" element={<ProtectedRoute><ErrorBoundary scope="tender-detail"><TenderDetail /></ErrorBoundary></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
