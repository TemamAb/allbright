import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

import NotFound from "@/components/NotFound";
import Dashboard from "@/components/Dashboard";
import StrategiesPage from "@/components/StrategiesPage";
import Telemetry from "@/components/Telemetry";
import Stream from "@/components/Stream";
import Trades from "@/components/Trades";
import Vault from "@/components/Vault"; // This is the updated Vault logic
import Copilot from "@/components/Copilot";
import SetupPage from "@/components/SetupPage";
import AuditPage from "@/components/AuditPage";
import Layout from "@/components/Layout";
import { GateKeeperDashboard } from "@/components/GateKeeperDashboard";
import { WalletProvider } from "@/context/WalletContext";
import { StrategiesProvider } from "@/context/StrategiesContext";
import { setBaseUrl } from "@/lib/api";
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

// API base handled by env/lib/api.ts

// Socket Context for High-Speed Telemetry
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    if (!API_BASE_URL) {
      console.warn("[Socket] No API_BASE_URL configured, skipping socket connection");
      return;
    }

    const s = io(API_BASE_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

function AppProviders({ children }: { children: ReactNode }) {
  return (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark" themes={['dark']}>

      <QueryClientProvider client={queryClient}>
        <StrategiesProvider>
          <WalletProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </WalletProvider>
        </StrategiesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/strategies" component={StrategiesPage} />
          <Route path="/stream" component={Stream} />
          <Route path="/trades" component={Trades} />
          <Route path="/vault" component={Vault} />
          <Route path="/copilot" component={Copilot} />
          <Route path="/telemetry" component={Telemetry} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster position="bottom-right" richColors />
    </AppProviders>
  );
}
