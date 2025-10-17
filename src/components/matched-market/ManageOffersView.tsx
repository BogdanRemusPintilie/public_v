import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STAGES = [
  'Offer issued',
  'Interest indicated',
  'NDA executed',
  'Transaction details',
  'Indicative offer received',
  'Full loan tape provided',
  'Firm offer received',
  'Allocation received',
  'Transaction completed'
] as const;

const getStageColor = (stageStatus: 'blank' | 'opened' | 'in-process' | 'completed') => {
  switch (stageStatus) {
    case 'blank':
      return 'bg-muted';
    case 'opened':
      return 'bg-green-500';
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
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, { total: number; interested: number; status: string }>>({});
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const determineTransactionStatus = (
    offerResponse: any,
    nda: any,
    offerId: string
  ): string => {
    // Special handling for demo offer
    if (offerId === 'demo-offer') {
      return 'Full loan tape provided';
    }

    // If investor has submitted an indicative price, reflect that immediately
    if (offerResponse?.indicative_price) {
      return 'Indicative offer received';
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
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          structure:tranche_structures(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);

      // Fetch response counts and detailed status for each offer
      if (data && data.length > 0) {
        const counts: Record<string, { total: number; interested: number; status: string }> = {};
        
        for (const offer of data) {
          // Get all responses for this offer
          const { data: responses, error: responseError } = await supabase
            .from('offer_responses')
            .select('*')
            .eq('offer_id', offer.id);

          // Get all NDAs for this offer
          const { data: ndas, error: ndaError } = await supabase
            .from('ndas')
            .select('*')
            .eq('offer_id', offer.id);

          if (!responseError && responses) {
            // Get the most advanced status from all responses
            let mostAdvancedStatus = 'Offer received';
            
            responses.forEach(response => {
              const matchingNda = ndas?.find(n => n.investor_id === response.investor_id);
              const status = determineTransactionStatus(response, matchingNda, offer.id);
              
              // Compare status progression (later statuses override earlier ones)
              const statusPriority = [
                'Offer issued',
                'Interest indicated',
                'NDA executed',
                'Transaction details',
                'Indicative offer received',
                'Full loan tape provided',
                'Firm offer received',
                'Allocation received',
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
    
    if (currentStageIndex <= statusIndex) {
      return 'completed';
    } else if (currentStageIndex === statusIndex + 1) {
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted border rounded"></div>
              <span>Not reached</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span>Stage opened</span>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const responseCount = responseCounts[offer.id] || { total: 0, interested: 0, status: 'Offer received' };
              const currentStatus = responseCount.status;
              
              return (
                <TableRow 
                  key={offer.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/matched-market/offers/${offer.id}`)}
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
