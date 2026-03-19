import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userPlan: 'free' | 'pro' | 'ultra' | null;
  credits: number;
  useCredits: (amount: number) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userPlan: null,
  credits: 0,
  useCredits: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'ultra' | null>(null);
  const [credits, setCredits] = useState<number>(0);

  const useCredits = (amount: number) => {
    if (userPlan === 'pro' || userPlan === 'ultra') return true;
    if (credits >= amount) {
      const newCredits = credits - amount;
      setCredits(newCredits);
      localStorage.setItem(`credits_${user?.email}`, newCredits.toString());
      return true;
    }
    return false;
  };

  const fetchPlan = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserPlan(null);
      return;
    }
    
    if (currentUser.email === 'snelle.edward@gmail.com') {
      setUserPlan('ultra');
      return;
    }
    
    try {
      // Try to fetch from a profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', currentUser.id)
        .single();
        
      if (data && data.plan) {
        setUserPlan(data.plan as 'free' | 'pro' | 'ultra');
        return;
      }
    } catch (e) {
      console.warn('Could not fetch profile plan, falling back to metadata', e);
    }
    
    // Fallback to user_metadata or 'free'
    const plan = currentUser.user_metadata?.plan || 'free';
    setUserPlan(plan as 'free' | 'pro' | 'ultra');
    
    if (plan === 'free') {
      const savedCredits = localStorage.getItem(`credits_${currentUser.email}`);
      if (savedCredits !== null) {
        setCredits(parseInt(savedCredits, 10));
      } else {
        setCredits(10); // Default 10 credits for free users
        localStorage.setItem(`credits_${currentUser.email}`, '10');
      }
    }
  };

  useEffect(() => {
    // Check for mock user first
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr) {
      try {
        const mockData = JSON.parse(mockUserStr);
        setUser({ id: 'mock-123', email: mockData.email } as any);
        
        if (mockData.email === 'snelle.edward@gmail.com') {
          setUserPlan('ultra');
        } else {
          setUserPlan(mockData.plan || 'free');
          if ((mockData.plan || 'free') === 'free') {
            const savedCredits = localStorage.getItem(`credits_${mockData.email}`);
            if (savedCredits !== null) {
              setCredits(parseInt(savedCredits, 10));
            } else {
              setCredits(10);
              localStorage.setItem(`credits_${mockData.email}`, '10');
            }
          }
        }
        
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchPlan(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchPlan(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userPlan, credits, useCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
