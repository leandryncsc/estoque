import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ImprovedMiniPOS from "./pages/ImprovedMiniPOS";
import Suppliers from "./pages/Suppliers";
import Entries from "./pages/Entries";
import Exits from "./pages/Exits";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import { useUserType } from "@/hooks/useUserType";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {(() => {
          const { type } = useUserType();
          return (
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              {type === "vendedor" ? (
                <>
                  <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
                  <Route path="/pos" element={<AppLayout><ImprovedMiniPOS /></AppLayout>} />
                  <Route path="/suppliers" element={<AppLayout><Suppliers /></AppLayout>} />
                </>
              ) : (
                <>
                  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
                  <Route path="/pos" element={<AppLayout><ImprovedMiniPOS /></AppLayout>} />
                  <Route path="/suppliers" element={<AppLayout><Suppliers /></AppLayout>} />
                  <Route path="/entries" element={<AppLayout><Entries /></AppLayout>} />
                  <Route path="/exits" element={<AppLayout><Exits /></AppLayout>} />
                  <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
                  <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          );
        })()}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
