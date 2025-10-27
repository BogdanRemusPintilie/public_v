import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserType } from '@/hooks/useUserType';
import { Loader2, Settings } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Unified stages for both issuers and investors
const STAGES = [
  'Offer issued',
  'Interest indicated',
  'NDA executed',
  'Transaction details',
  'Indicative offer',
  'Full loan tape',
  'Firm offer',
  'Compliance Review',
  'Allocation',
  'Transaction completed'
] as const;

const getStageColor = (stageStatus: 'blank' | 'opened' | 'in-process' | 'completed') => {
  switch (stageStatus) {
    case 'blank':
      return 'bg-muted';
    case 'opened':
      return 'bg-purple-500';
    case 'in-process':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-purple-500';
    default:
      return 'bg-muted';
  }
};

export function ManageOffersView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userType, isLoading: userTypeLoading } = useUserType();
  type ResponseCount = { 
    total: number; 
    interested: number; 
    status: string; 
    hasCounterPrice?: boolean;
    hasDataAccess?: boolean;
    offerResponse?: any;
  };
  
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, ResponseCount>>({});
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    console.log('🔍 ManageOffersView - user:', user?.id, user?.email, 'userType:', userType, 'loading:', userTypeLoading);
    if (user && !userTypeLoading && userType) {
      console.log('✅ Fetching offers for userType:', userType, 'user:', user.email);
      fetchOffers();
    }
  }, [user, userType, userTypeLoading]);

  const determineTransactionStatus = (
    offerResponse: any,
    nda: any,
    offerId: string
  ): string => {
    // Special handling for demo offer
    if (offerId === 'demo-offer') {
      return 'Full loan tape';
    }

    // If investor has submitted a firm offer, check for compliance
    if (offerResponse?.firm_price_status === 'accepted' || offerResponse?.firm_price_status === 'submitted') {
      // Check if any compliance item has moved from pending status
      const complianceStatus = offerResponse?.compliance_status;
      if (complianceStatus && (
        (complianceStatus.kyc?.status && complianceStatus.kyc.status !== 'pending') ||
        (complianceStatus.aml?.status && complianceStatus.aml.status !== 'pending') ||
        (complianceStatus.creditCommittee?.status && complianceStatus.creditCommittee.status !== 'pending') ||
        (complianceStatus.legalReview?.status && complianceStatus.legalReview.status !== 'pending')
      )) {
        return 'Compliance Review';
      }
      return 'Firm offer';
    }

    // If issuer has sent acknowledgement receipt, full loan tape completed - move to Firm offer stage
    if (offerResponse?.issuer_response) {
      return 'Firm offer';
    }

    // If investor has submitted an indicative price, full loan tape is current
    if (offerResponse?.indicative_price) {
      return 'Full loan tape';
    }

    // If investor acknowledged requirements, move to transaction details
    if (offerResponse?.requirements_acknowledged) {
      return 'Transaction details';
    }

    // NDA executed
    if (nda?.status === 'accepted') {
      return 'NDA executed';
    }

    // If no response yet, it's just issued
    if (!offerResponse) {
      return 'Offer issued';
    }

    // If declined, keep at offer issued
    if (offerResponse.status === 'declined') {
      return 'Offer issued';
    }

    // Interest indicated (interested or accepted)
    if (offerResponse.status === 'interested' || offerResponse.status === 'accepted') {
      return 'Interest indicated';
    }

    return 'Offer issued';
  };

  const fetchOffers = async () => {
    if (!userType) {
      console.error('❌ ManageOffersView - Cannot fetch offers: userType is not set');
      setIsLoading(false);
      return;
    }

    if (!user?.id || !user?.email) {
      console.error('❌ ManageOffersView - Cannot fetch offers: user ID or email missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📊 Fetching offers - userType:', userType, 'user:', user.email);
      
      let offersData;
      
      // Fetch offers based on user type
      if (userType === 'investor') {
        // For investors: fetch offers shared with them
        const { data, error } = await supabase
          .from('offers')
          .select(`
            *,
            structure:tranche_structures(*)
          `)
          .contains('shared_with_emails', [user.email])
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching investor offers:', error);
          throw error;
        }
        console.log('📥 Investor offers fetched:', data?.length || 0);
        offersData = data || [];
      } else {
        // For issuers: fetch their own offers
        const { data, error } = await supabase
          .from('offers')
          .select(`
            *,
            structure:tranche_structures(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching issuer offers:', error);
          throw error;
        }
        console.log('📥 Issuer offers fetched:', data?.length || 0);
        offersData = data || [];
      }
      
      console.log('✅ Total offers to display:', offersData.length);
      setOffers(offersData);

      // Batch fetch all related data to avoid N+1 queries
      if (offersData && offersData.length > 0) {
        const counts: Record<string, ResponseCount> = {};
        const offerIds = offersData.map(o => o.id);
        
        if (userType === 'investor') {
          // For investors: batch fetch their responses, NDAs, and dataset shares
          const [responsesResult, ndasResult, sharesResult] = await Promise.all([
            supabase
              .from('offer_responses')
              .select('*')
              .in('offer_id', offerIds)
              .eq('investor_id', user?.id),
            supabase
              .from('ndas')
              .select('*')
              .in('offer_id', offerIds)
              .eq('investor_id', user?.id),
            supabase
              .from('dataset_shares')
              .select('id, dataset_name')
              .eq('shared_with_user_id', user?.id)
          ]);

          // Create maps for quick lookup
          const responseMap = new Map(responsesResult.data?.map(r => [r.offer_id, r]) || []);
          const ndaMap = new Map(ndasResult.data?.map(n => [n.offer_id, n]) || []);
          const sharesByDataset = new Map(sharesResult.data?.map(s => [s.dataset_name, s]) || []);

          // Process each offer using the maps
          offersData.forEach(offer => {
            const myResponse = responseMap.get(offer.id);
            const myNda = ndaMap.get(offer.id);
            const hasDataAccess = !!sharesByDataset.get(offer.structure?.dataset_name || '');
            
            const status = determineTransactionStatus(myResponse, myNda, offer.id);
            counts[offer.id] = {
              total: myResponse ? 1 : 0,
              interested: myResponse?.status === 'interested' ? 1 : 0,
              status: status,
              hasCounterPrice: myResponse?.counter_price != null,
              hasDataAccess,
              offerResponse: myResponse
            };
          });
        } else {
          // For issuers: batch fetch all responses and NDAs for their offers
          const [responsesResult, ndasResult] = await Promise.all([
            supabase
              .from('offer_responses')
              .select('*')
              .in('offer_id', offerIds),
            supabase
              .from('ndas')
              .select('*')
              .in('offer_id', offerIds)
          ]);

          // Group responses and NDAs by offer_id
          const responsesByOffer = new Map<string, any[]>();
          const ndasByOffer = new Map<string, any[]>();
          
          responsesResult.data?.forEach(r => {
            const existing = responsesByOffer.get(r.offer_id) || [];
            existing.push(r);
            responsesByOffer.set(r.offer_id, existing);
          });
          
          ndasResult.data?.forEach(n => {
            const existing = ndasByOffer.get(n.offer_id) || [];
            existing.push(n);
            ndasByOffer.set(n.offer_id, existing);
          });

          // Batch fetch dataset shares for all unique investor IDs with accepted NDAs
          const investorIdsWithAcceptedNdas = new Set<string>();
          ndasResult.data?.forEach(nda => {
            if (nda.status === 'accepted') {
              investorIdsWithAcceptedNdas.add(nda.investor_id);
            }
          });

          let datasetSharesMap = new Map<string, Set<string>>();
          if (investorIdsWithAcceptedNdas.size > 0) {
            const { data: allShares } = await supabase
              .from('dataset_shares')
              .select('dataset_name, shared_with_user_id')
              .eq('owner_id', user?.id)
              .in('shared_with_user_id', Array.from(investorIdsWithAcceptedNdas));

            // Map dataset_name -> Set of investor IDs with access
            allShares?.forEach(share => {
              const existing = datasetSharesMap.get(share.dataset_name) || new Set();
              existing.add(share.shared_with_user_id);
              datasetSharesMap.set(share.dataset_name, existing);
            });
          }

          // Process each offer
          offersData.forEach(offer => {
            const responses = responsesByOffer.get(offer.id) || [];
            const ndas = ndasByOffer.get(offer.id) || [];
            const investorsWithAccess = datasetSharesMap.get(offer.structure?.dataset_name || '') || new Set();

            if (responses.length > 0) {
              let mostAdvancedStatus = 'Offer issued';
              let hasAnyCounterPrice = false;
              let hasAnyDataAccess = false;
              let mostAdvancedResponse: any = null;
              
              const statusPriority = [
                'Offer issued',
                'Interest indicated',
                'NDA executed',
                'Transaction details',
                'Indicative offer',
                'Full loan tape',
                'Firm offer',
                'Compliance Review',
                'Allocation',
                'Transaction completed'
              ];

              responses.forEach(response => {
                const matchingNda = ndas.find(n => n.investor_id === response.investor_id);
                
                // Check data access from pre-fetched map
                if (matchingNda?.status === 'accepted' && investorsWithAccess.has(response.investor_id)) {
                  hasAnyDataAccess = true;
                }
                
                const status = determineTransactionStatus(response, matchingNda, offer.id);
                
                if (response.counter_price != null) {
                  hasAnyCounterPrice = true;
                }
                
                const currentPriority = statusPriority.indexOf(mostAdvancedStatus);
                const newPriority = statusPriority.indexOf(status);
                
                if (newPriority > currentPriority) {
                  mostAdvancedStatus = status;
                  mostAdvancedResponse = response;
                }
              });

              counts[offer.id] = {
                total: responses.length,
                interested: responses.filter(r => r.status === 'interested').length,
                status: mostAdvancedStatus,
                hasCounterPrice: hasAnyCounterPrice,
                hasDataAccess: hasAnyDataAccess,
                offerResponse: mostAdvancedResponse
              };
            } else {
              counts[offer.id] = {
                total: 0,
                interested: 0,
                status: 'Offer issued',
                hasCounterPrice: false,
                hasDataAccess: false
              };
            }
          });
        }
        
        setResponseCounts(counts);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load offers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer deleted successfully',
      });

      fetchOffers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete offer',
        variant: 'destructive',
      });
    }
  };

  const getStageStatus = (
    currentStageIndex: number, 
    offerStatus: string, 
    hasCounterPrice: boolean,
    hasDataAccess: boolean,
    offerResponse?: any
  ): 'blank' | 'opened' | 'in-process' | 'completed' => {
    const statusIndex = STAGES.indexOf(offerStatus as any);
    const currentStageName = STAGES[currentStageIndex];
    
    if (statusIndex === -1) return 'blank';
    
    if (currentStageIndex < statusIndex) {
      return 'completed';
    } else if (currentStageIndex === statusIndex) {
      // Special handling for Full loan tape stage - amber if NDA accepted but access not yet granted
      if (currentStageName === 'Full loan tape' && !hasDataAccess) {
        return 'in-process';
      }
      // Special handling for Firm offer stage - amber when firm price submitted
      if (currentStageName === 'Firm offer') {
        return 'in-process';
      }
      // Special handling for "Compliance Review" stage
      if (currentStageName === 'Compliance Review') {
        const complianceStatus = offerResponse?.compliance_status;
        if (complianceStatus) {
          // Check if any compliance item has evidence uploaded or is in progress
          const hasAnyProgress = (
            (complianceStatus.kyc?.evidence && complianceStatus.kyc.evidence.length > 0) ||
            (complianceStatus.kyc?.status === 'in-progress') ||
            (complianceStatus.aml?.evidence && complianceStatus.aml.evidence.length > 0) ||
            (complianceStatus.aml?.status === 'in-progress') ||
            (complianceStatus.creditCommittee?.evidence && complianceStatus.creditCommittee.evidence.length > 0) ||
            (complianceStatus.creditCommittee?.status === 'in-progress') ||
            (complianceStatus.legalReview?.evidence && complianceStatus.legalReview.evidence.length > 0) ||
            (complianceStatus.legalReview?.status === 'in-progress')
          );
          
          if (hasAnyProgress) {
            return 'in-process';
          }
        }
      }
      return 'opened';
    }
    
    return 'blank';
  };

  if (userTypeLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {userTypeLoading ? 'Loading user information...' : 'Loading offers...'}
          </p>
        </div>
      </div>
    );
  }

  if (!userType) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Unable to determine user type</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {userType === 'issuer' ? 'No offers created yet' : 'No offers available for you'}
          </p>
          {userType === 'issuer' && (
            <Button onClick={() => navigate('/matched-market/issue-offer')}>
              Create Your First Offer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Color Key Dialog */}
      {showKey && (
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-sm">Transaction Stage Key</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowKey(false)}>×</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted border rounded"></div>
              <span>Not reached</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded"></div>
              <span>In process</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
        </Card>
      )}

      {/* Stage Grid Table */}
      <div className="bg-card rounded-lg border shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-muted/30 z-10 w-[180px] font-semibold">
                Offer Name
              </TableHead>
              {STAGES.map((stage) => (
                <TableHead key={stage} className="text-center w-[100px] text-[11px] px-2 whitespace-normal leading-tight">
                  {stage}
                </TableHead>
              ))}
              <TableHead className="text-center w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {offers.map((offer) => {
              const responseCount = responseCounts[offer.id] || { total: 0, interested: 0, status: 'Offer issued', hasCounterPrice: false, hasDataAccess: false };
              const currentStatus = responseCount.status;
              const hasCounterPrice = responseCount.hasCounterPrice || false;
              const hasDataAccess = responseCount.hasDataAccess || false;
              const offerResponse = responseCount.offerResponse;
              
              return (
                <TableRow 
                  key={offer.id}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="sticky left-0 bg-card z-10 font-medium border-r text-sm">
                    {offer.offer_name}
                  </TableCell>
                  {STAGES.map((stage, index) => {
                    const stageStatus = getStageStatus(index, currentStatus, hasCounterPrice, hasDataAccess, offerResponse);
                    return (
                      <TableCell 
                        key={stage} 
                        className="p-1.5"
                      >
                        <div className={`w-full h-10 rounded ${getStageColor(stageStatus)} transition-colors`}></div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/matched-market/offers/${offer.id}`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
