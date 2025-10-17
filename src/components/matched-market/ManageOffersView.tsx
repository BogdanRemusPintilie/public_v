import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Trash2, CheckCircle, Clock } from 'lucide-react';

export function ManageOffersView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, { total: number; interested: number }>>({});

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

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

      // Fetch response counts for each offer
      if (data && data.length > 0) {
        const counts: Record<string, { total: number; interested: number }> = {};
        
        for (const offer of data) {
          const { data: responses, error: responseError } = await supabase
            .from('offer_responses')
            .select('status')
            .eq('offer_id', offer.id);

          if (!responseError && responses) {
            counts[offer.id] = {
              total: responses.length,
              interested: responses.filter(r => r.status === 'interested').length
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
    <div className="grid gap-4">
      {offers.map((offer) => {
        const responseCount = responseCounts[offer.id] || { total: 0, interested: 0 };
        const dealStatus = responseCount.total > 0 ? 'Responses Received' : 'Awaiting Responses';
        
        return (
          <Card key={offer.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{offer.offer_name}</CardTitle>
                  <CardDescription>
                    Structure: {offer.structure?.structure_name || 'N/A'}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                    {offer.status || 'active'}
                  </Badge>
                  <Badge 
                    variant={responseCount.total > 0 ? 'default' : 'outline'}
                    className="flex items-center gap-1"
                  >
                    {responseCount.total > 0 ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {dealStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {offer.issuer_nationality && (
                  <p className="text-sm">
                    <span className="font-medium">Issuer:</span> {offer.issuer_nationality}
                  </p>
                )}
                {offer.target_investors && offer.target_investors.length > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Target Investors:</span> {offer.target_investors.length} selected
                  </p>
                )}
                {responseCount.total > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Responses:</span> {responseCount.total} total
                    {responseCount.interested > 0 && (
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        ({responseCount.interested} interested)
                      </span>
                    )}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(offer.created_at).toLocaleDateString()}
                </p>
              </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/matched-market/offers/${offer.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteOffer(offer.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
