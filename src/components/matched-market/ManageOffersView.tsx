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
      return 'bg-purple-500';
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
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, { total: number; interested: number; status: string }>>({});
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (user && !userTypeLoading) {
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

    // If investor has submitted a firm offer
    if (offerResponse?.firm_price_status === 'accepted' || offerResponse?.firm_price_status === 'submitted') {
      return 'Firm offer';
    }

    // If issuer has sent acknowledgement receipt, full loan tape completed
    if (offerResponse?.issuer_response) {
      return 'Full loan tape';
    }

    // If investor has submitted an indicative price, reflect that immediately
    if (offerResponse?.indicative_price) {
      return 'Indicative offer';
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
    try {
      setIsLoading(true);
      
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
          .contains('shared_with_emails', [user?.email || ''])
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        offersData = data || [];
      } else {
        // For issuers: fetch their own offers
        const { data, error } = await supabase
          .from('offers')
          .select(`
            *,
            structure:tranche_structures(*)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        offersData = data || [];
      }
      
      setOffers(offersData);

      // Fetch response counts and detailed status for each offer
      if (offersData && offersData.length > 0) {
        const counts: Record<string, { total: number; interested: number; status: string }> = {};
        
        for (const offer of offersData) {
          if (userType === 'investor') {
            // For investors, get their own response to this offer
            const { data: myResponse, error: responseError } = await supabase
              .from('offer_responses')
              .select('*')
              .eq('offer_id', offer.id)
              .eq('investor_id', user?.id)
              .maybeSingle();

            const { data: myNda, error: ndaError } = await supabase
              .from('ndas')
              .select('*')
              .eq('offer_id', offer.id)
              .eq('investor_id', user?.id)
              .maybeSingle();

            const status = determineTransactionStatus(myResponse, myNda, offer.id);
            counts[offer.id] = {
              total: myResponse ? 1 : 0,
              interested: myResponse?.status === 'interested' ? 1 : 0,
              status: status
            };
          } else {
            // For issuers, get all responses to this offer (existing logic)
            const { data: responses, error: responseError } = await supabase
              .from('offer_responses')
              .select('*')
              .eq('offer_id', offer.id);

            const { data: ndas, error: ndaError } = await supabase
              .from('ndas')
              .select('*')
              .eq('offer_id', offer.id);

            if (!responseError && responses) {
              let mostAdvancedStatus = 'Offer issued';
              
              responses.forEach(response => {
                const matchingNda = ndas?.find(n => n.investor_id === response.investor_id);
                const status = determineTransactionStatus(response, matchingNda, offer.id);
                
                const statusPriority = [
                  'Offer issued',
                  'Interest indicated',
                  'NDA executed',
                  'Transaction details',
                  'Indicative offer',
                  'Full loan tape',
                  'Firm offer',
                  'Allocation',
                  'Transaction completed'
                ];
                
                const currentPriority = statusPriority.indexOf(mostAdvancedStatus);
                const newPriority = statusPriority.indexOf(status);
                
                if (newPriority > currentPriority) {
                  mostAdvancedStatus = status;
                }
              });

              counts[offer.id] = {
                total: responses.length,
                interested: responses.filter(r => r.status === 'interested').length,
                status: mostAdvancedStatus
              };
            } else {
              counts[offer.id] = {
                total: 0,
                interested: 0,
                status: 'Offer issued'
              };
            }
          }
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

  const getStageStatus = (currentStageIndex: number, offerStatus: string): 'blank' | 'opened' | 'in-process' | 'completed' => {
    const statusIndex = STAGES.indexOf(offerStatus as any);
    
    if (statusIndex === -1) return 'blank';
    
    if (currentStageIndex < statusIndex) {
      return 'completed';
    } else if (currentStageIndex === statusIndex) {
      return 'opened';
    }
    
    return 'blank';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No offers created yet</p>
          <Button onClick={() => navigate('/matched-market/issue-offer')}>
            Create Your First Offer
          </Button>
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
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
              <span>Current/Completed</span>
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
              const responseCount = responseCounts[offer.id] || { total: 0, interested: 0, status: 'Offer issued' };
              const currentStatus = responseCount.status;
              
              return (
                <TableRow 
                  key={offer.id}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="sticky left-0 bg-card z-10 font-medium border-r text-sm">
                    {offer.offer_name}
                  </TableCell>
                  {STAGES.map((stage, index) => {
                    const stageStatus = getStageStatus(index, currentStatus);
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
