import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  company_type: 'seer_capital' | 'general';
  role: 'admin' | 'company_user' | 'viewer';
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_profile', { _user_id: user.id });

        if (error) throw error;

        if (data && data.length > 0) {
          setProfile(data[0]);
        } else {
          // Create default profile if none exists
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  };

  const hasCompanyAccess = (companyType: 'seer_capital' | 'general') => {
    return profile?.company_type === companyType;
  };

  return {
    profile,
    loading,
    updateProfile,
    hasCompanyAccess,
  };
};