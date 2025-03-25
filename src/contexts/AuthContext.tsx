
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserAsAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Verificar se o usuário é admin
        if (session?.user) {
          const userRole = session.user.user_metadata?.role;
          setIsAdmin(userRole === 'admin');
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Verificar se o usuário é admin
      if (session?.user) {
        const userRole = session.user.user_metadata?.role;
        setIsAdmin(userRole === 'admin');
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const setUserAsAdmin = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para se tornar um administrador.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar os metadados do usuário para incluir a função de admin
      const { error } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      });

      if (error) throw error;

      // Atualizar o estado local
      setIsAdmin(true);
      
      toast({
        title: "Sucesso!",
        description: "Você agora é um administrador do sistema.",
      });
    } catch (error) {
      console.error('Erro ao definir usuário como admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir você como administrador.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    logout,
    setUserAsAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
