import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ManageOffersView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, { total: number; interested: number; status: string }>>({});

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
      return 'Full loan tape submitted';
    }

    // If investor has submitted an indicative price, reflect that immediately
    if (offerResponse?.indicative_price) {
      return 'Indicative offer submitted';
    }

    // If investor acknowledged requirements, move to transaction details
    if (offerResponse?.requirements_acknowledged) {
      return 'Transaction details';
    }

    // NDA executed
    if (nda?.status === 'accepted') {
      return 'NDA executed';
    }

    // If no response yet, it's just received
    if (!offerResponse) {
      return 'Offer received';
    }

    // If declined, keep at offer received
    if (offerResponse.status === 'declined') {
      return 'Offer received';
    }

    // Interest indicated (interested or accepted)
    if (offerResponse.status === 'interested' || offerResponse.status === 'accepted') {
      return 'Interest indicated';
    }

    return 'Offer received';
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
                'Offer received',
                'Interest indicated',
                'NDA executed',
                'Transaction overview',
                'Transaction details',
                'Indicative offer submitted',
                'Full loan tape submitted',
                'Allocation received',
                'Transaction complete'
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
              status: 'Offer received'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    const statusPriority = [
      'Offer received',
      'Interest indicated',
      'NDA executed',
      'Transaction overview',
      'Transaction details',
      'Indicative offer submitted',
      'Full loan tape submitted',
      'Allocation received',
      'Transaction complete'
    ];
    const index = statusPriority.indexOf(status);
    if (index <= 1) return "outline"; // Early stages
    if (index >= 7) return "default"; // Late stages (success)
    return "secondary"; // Middle stages
  };

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
    <div className="bg-card rounded-lg border shadow-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Offer Name</TableHead>
            <TableHead className="w-[20%]">Structure</TableHead>
            <TableHead className="w-[15%]">Responses</TableHead>
            <TableHead className="w-[20%]">Status</TableHead>
            <TableHead className="w-[10%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => {
            const responseCount = responseCounts[offer.id] || { total: 0, interested: 0, status: 'Offer received' };
            const dealStatus = responseCount.status;
            
            return (
              <TableRow 
                key={offer.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/matched-market/offers/${offer.id}`)}
              >
                <TableCell className="font-medium">
                  {offer.offer_name}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {offer.structure?.structure_name || 'N/A'}
                </TableCell>
                <TableCell className="text-sm">
                  {responseCount.total > 0 ? (
                    <>
                      {responseCount.total} total
                      {responseCount.interested > 0 && (
                        <span className="text-green-600 dark:text-green-400 ml-1">
                          ({responseCount.interested} interested)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No responses</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(dealStatus)}>
                    {dealStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/matched-market/offers/${offer.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOffer(offer.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
