import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OfferDetailsView } from '@/components/matched-market/OfferDetailsView';
import { useAuth } from '@/contexts/AuthContext';
import { useUserType } from '@/hooks/useUserType';

const OfferDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { userType } = useUserType();
  const [offer, setOffer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  const fetchOffer = async () => {
    try {
      setIsLoading(true);
      
      // Handle demo offer
      if (id === 'demo-offer') {
        setOffer({
          id: 'demo-offer',
          offer_name: 'Investor Demo Offer',
          issuer_nationality: 'British',
          issuer_overview: 'British CIB',
          issuer_business_focus: 'SME Corporate loans, Large Corporate loans and consumer finance',
          structure_synthetic: true,
          structure_true_sale: false,
          structure_sts: false,
          structure_consumer_finance: false,
          additional_comments: 'Overall Asset Pool Size: €14.82M, Weighted Average Life: 4 years',
          status: 'active',
          structure: {
            id: 'demo-structure',
            structure_name: '400m (Demo Data Lite)',
            dataset_name: 'Demo Data Lite',
            weighted_avg_cost_bps: 350,
            tranches: [
              {
                id: 'senior-tranche',
                name: 'Senior Tranche',
                thickness: 67.5,
                coupon: 2.5,
                rating: 'AAA',
                tranche_order: 1
              },
              {
                id: 'mezzanine-tranche',
                name: 'Mezzanine Tranche',
                thickness: 20.2,
                coupon: 5.0,
                rating: 'BBB',
                tranche_order: 2
              },
              {
                id: 'equity-tranche',
                name: 'Equity Tranche',
                thickness: 12.3,
                coupon: 0,
                rating: 'Unrated',
                tranche_order: 3
              }
            ]
          }
        });
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch the issuer's company name from profiles
      let issuerCompany = null;
      if (data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company')
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching issuer company:', profileError);
        } else if (profileData?.company) {
          issuerCompany = profileData.company;
        }
      }

      // Fetch the structure separately if structure_id exists
      let offerWithStructure: any = { ...data, issuer_company: issuerCompany };
      if (data.structure_id) {
        const { data: structureData, error: structureError } = await supabase
          .from('tranche_structures')
          .select('*')
          .eq('id', data.structure_id)
          .single();

        if (!structureError && structureData) {
          offerWithStructure.structure = structureData;
        }
      }

      setOffer(offerWithStructure);
    } catch (error: any) {
      toast({
        title: 'Error loading offer',
        description: error.message,
        variant: 'destructive',
      });
      // Navigate back based on user type
      const backPath = userType === 'investor' 
        ? '/matched-market/transaction-hub' 
        : '/matched-market/manage-offers';
      navigate(backPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Check if we came from a specific page via state
    const from = (location.state as any)?.from;
    
    // Navigate back based on where we came from or user type
    if (from) {
      navigate(from);
    } else if (userType === 'investor') {
      navigate('/matched-market/transaction-hub');
    } else {
      navigate('/matched-market/manage-offers');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {userType === 'investor' ? 'Back to Transaction Hub' : 'Back to Manage Offers'}
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Offer Summary</h1>
          <p className="text-xl text-muted-foreground">{offer?.offer_name}</p>
          <p className="text-muted-foreground">
            View and manage offer details and investor interactions
          </p>
        </div>

        {offer && <OfferDetailsView offer={offer} onUpdate={fetchOffer} />}
      </div>
    </div>
  );
};

export default OfferDetails;
