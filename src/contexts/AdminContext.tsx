import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AdminContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora em milissegundos

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(async () => {
      await logout();
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(timer);
  };

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    let mounted = true;

    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          // Defer async operations with setTimeout
          setTimeout(async () => {
            if (!mounted) return;
            const isAdmin = await checkAdminRole(session.user.id);
            setIsAuthenticated(isAdmin);
            setUser(isAdmin ? session.user : null);
            setIsLoading(false);
            if (isAdmin) {
              resetInactivityTimer();
            }
          }, 0);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          if (inactivityTimer) {
            clearTimeout(inactivityTimer);
          }
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        setIsAuthenticated(isAdmin);
        setUser(isAdmin ? session.user : null);
        if (isAdmin) {
          resetInactivityTimer();
        }
      }
      setIsLoading(false);
    });

    // Listener de atividade do usuário
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (isAuthenticated) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const isAdmin = await checkAdminRole(data.user.id);
        if (!isAdmin) {
          await supabase.auth.signOut();
          return { success: false, error: "Usuário não tem permissões de administrador" };
        }
        return { success: true };
      }

      return { success: false, error: "Erro ao fazer login" };
    } catch (error) {
      return { success: false, error: "Erro inesperado ao fazer login" };
    }
  };

  const logout = async () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};
