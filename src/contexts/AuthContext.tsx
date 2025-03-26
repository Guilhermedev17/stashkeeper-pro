
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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
  setSpecificUserAsAdmin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userRole = session.user.user_metadata?.role;
          if (session.user.email === 'guissantos50@gmail.com') {
            setIsAdmin(true);
            if (userRole !== 'admin') {
              supabase.auth.updateUser({
                data: { role: 'admin' }
              }).then(({ data, error }) => {
                if (error) {
                  console.error('Error updating user role:', error);
                } else {
                  console.log('User role updated to admin for guissantos50@gmail.com');
                }
              });
            }
          } else {
            setIsAdmin(userRole === 'admin');
          }
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userRole = session.user.user_metadata?.role;
        if (session.user.email === 'guissantos50@gmail.com') {
          setIsAdmin(true);
          if (userRole !== 'admin') {
            supabase.auth.updateUser({
              data: { role: 'admin' }
            }).then(({ data, error }) => {
              if (error) {
                console.error('Error updating user role:', error);
              } else {
                console.log('User role updated to admin for guissantos50@gmail.com');
              }
            });
          }
        } else {
          setIsAdmin(userRole === 'admin');
        }
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
      const { error } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      });

      if (error) throw error;

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

  const setSpecificUserAsAdmin = async (email: string): Promise<void> => {
    try {
      const { data, error } = await supabase.rpc('get_user_id_by_email', { 
        user_email: email 
      });
      
      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Usuário não encontrado",
          description: `Não foi possível encontrar um usuário com o email ${email}`,
          variant: "destructive",
        });
        return;
      }
      
      // Call the edge function with explicit typing for userId
      const userId = data as string;
      const { error: updateError } = await supabase.functions.invoke('update-user-role', {
        body: { userId, role: 'admin' }
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Sucesso!",
        description: `O usuário ${email} agora é um administrador do sistema.`,
      });
    } catch (error) {
      console.error('Erro ao definir usuário como admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir o usuário como administrador. Consulte os logs para mais detalhes.",
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
    setSpecificUserAsAdmin,
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
