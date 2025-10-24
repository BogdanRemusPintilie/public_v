import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'investor' | 'issuer' | null;

export const useUserType = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserType = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('🔍 useUserType - checking user type for:', user?.id, user?.email);
      
      if (!user) {
        console.log('❌ useUserType - no user found');
        setUserType(null);
        setIsLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_user_type', {
        _user_id: user.id
      });

      console.log('📊 useUserType - RPC result:', { data, error: rpcError, email: user.email });

      if (rpcError) {
        console.error('❌ Error checking user type:', rpcError);
        setError(rpcError.message);
        setUserType(null);
      } else {
        console.log('✅ useUserType - setting userType to:', data, 'for user:', user.email);
        setUserType(data as UserType);
      }
    } catch (error) {
      console.error('❌ Error checking user type:', error);
      setError('Failed to check user type');
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserType();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 useUserType - auth state changed:', event);
      if (session?.user) {
        // Small delay to ensure session is fully established
        setTimeout(() => checkUserType(), 100);
      } else {
        setUserType(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = () => {
    console.log('🔄 Manual refresh of user type requested');
    checkUserType();
  };

  return { userType, isLoading, error, refresh };
};
