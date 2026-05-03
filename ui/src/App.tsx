import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

import NotFound from "@/components/NotFound";
import Dashboard from "@/components/Dashboard";
import StrategiesPage from "@/components/StrategiesPage";
import Stream from "@/components/Stream";
import Trades from "@/components/Trades";
import Copilot from "@/components/Copilot";
import SetupWizard from "@/components/SetupWizard";
import Layout from "@/components/Layout";
import Telemetry from "@/components/Telemetry"; // Ensure Telemetry is imported
import Vault from "@/components/WalletPage"; // Vault is now WalletPage
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
      console.error("[allbright] VITE_API_BASE_URL is missing. UI will be restricted to offline mode.");
      return;
    }

    const s = io(API_BASE_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    s.on("connect", () => setIsConnected(true));
    s.on("connect_error", (err) => {
      console.error("[Socket] Connection failed:", err.message);
      setIsConnected(false);
    });
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
          <Route path="/setup" component={SetupWizard} />
          <Route path="/strategies" component={StrategiesPage} />
          <Route path="/stream" component={Stream} /> {/* Stream page */}
          <Route path="/trades" component={Trades} /> {/* Trade History page */}
          <Route path="/vault" component={Vault} /> {/* Vault page (WalletPage) */}
          <Route path="/copilot" component={Copilot} /> {/* Alpha-Copilot page */}
          <Route path="/telemetry" component={Telemetry} /> {/* Telemetry page */}
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster position="bottom-right" richColors />
    </AppProviders>
  );
}
