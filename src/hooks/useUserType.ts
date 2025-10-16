import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'investor' | 'issuer' | null;

export const useUserType = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserType();
  }, []);

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserType(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_type', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error checking user type:', error);
        setUserType(null);
      } else {
        setUserType(data as UserType);
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { userType, isLoading };
};
