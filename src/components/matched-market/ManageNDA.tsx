import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface NDA {
  id: string;
  issuer_id: string;
  investor_id: string;
  offer_id: string;
  nda_title: string;
  nda_content: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

const ManageNDA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ndas, setNdas] = useState<NDA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [acceptedNdaId, setAcceptedNdaId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNDAs();
    }
  }, [user]);

  const fetchNDAs = async () => {
    try {
      const { data, error } = await supabase
        .from('ndas')
        .select('*')
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNdas((data || []) as NDA[]);
    } catch (error) {
      console.error('Error fetching NDAs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load NDAs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNDAResponse = async (ndaId: string, newStatus: 'accepted' | 'declined') => {
    setProcessingId(ndaId);
    try {
      // Handle demo NDA separately (it's not in the database)
      if (ndaId === 'demo-nda') {
        // Update local state only
        setNdas(prev => prev.map(nda => 
          nda.id === ndaId 
            ? { ...nda, status: newStatus, updated_at: new Date().toISOString() }
            : nda
        ));
        
        if (newStatus === 'accepted') {
          setAcceptedNdaId(ndaId);
          toast({
            title: 'NDA Accepted',
            description: 'You can now access detailed transaction information',
          });
        } else {
          toast({
            title: 'NDA Declined',
            description: 'You have declined this NDA',
          });
        }
      } else {
        // Update database for real NDAs
        const { error } = await supabase
          .from('ndas')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', ndaId);

        if (error) throw error;

        if (newStatus === 'accepted') {
          setAcceptedNdaId(ndaId);
          toast({
            title: 'NDA Accepted',
            description: 'You can now access detailed transaction information',
          });
        } else {
          toast({
            title: 'NDA Declined',
            description: 'You have declined this NDA',
          });
        }

        await fetchNDAs();
      }
    } catch (error) {
      console.error('Error updating NDA:', error);
      toast({
        title: 'Error',
        description: `Failed to ${newStatus} NDA`,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccessDetails = (offerId: string) => {
    navigate(`/matched-market/offers/${offerId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ndas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No NDAs received yet</p>
        </CardContent>
      </Card>
    );
  }

  // Show acceptance confirmation for just-accepted NDA
  const justAcceptedNda = ndas.find(nda => nda.id === acceptedNdaId);
  if (justAcceptedNda) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">NDA Accepted Successfully</h3>
              <p className="text-green-700">
                You can now access detailed transaction information for this offer
              </p>
            </div>
            <Button
              onClick={() => handleAccessDetails(justAcceptedNda.offer_id)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Access transaction details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ndas.map((nda) => (
        <Card key={nda.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{nda.nda_title}</CardTitle>
                <CardDescription>
                  Received {new Date(nda.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              {getStatusBadge(nda.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{nda.nda_content}</p>
            </div>

            {nda.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleNDAResponse(nda.id, 'accepted')}
                  disabled={processingId === nda.id}
                  className="flex-1"
                >
                  {processingId === nda.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept NDA
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleNDAResponse(nda.id, 'declined')}
                  disabled={processingId === nda.id}
                  className="flex-1"
                >
                  {processingId === nda.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            )}

            {nda.status === 'accepted' && (
              <Button
                onClick={() => handleAccessDetails(nda.offer_id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Access transaction details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ManageNDA;
