import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  issuer_company?: string;
}

const ManageNDA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ndas, setNdas] = useState<NDA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [acceptedNdaId, setAcceptedNdaId] = useState<string | null>(null);
  const [expandedNdaIds, setExpandedNdaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchNDAs();
    }
  }, [user]);

  const fetchNDAs = async () => {
    try {
      console.log('🔍 Fetching NDAs for investor:', user.id);
      
      // Fetch NDAs - issuer_company is now populated by database trigger
      const { data: ndasData, error: ndasError } = await supabase
        .from('ndas')
        .select('*')
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });

      if (ndasError) throw ndasError;

      console.log('📥 NDAs Response:', ndasData);
      
      setNdas((ndasData || []) as NDA[]);
      console.log('✅ NDAs loaded:', ndasData?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching NDAs:', error);
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
      // Handle demo NDAs separately (they're not in the database)
      if (ndaId.startsWith('demo-nda')) {
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

  const toggleNdaExpanded = (ndaId: string) => {
    setExpandedNdaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ndaId)) {
        newSet.delete(ndaId);
      } else {
        newSet.add(ndaId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500 text-white">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
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
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Non-Disclosure Agreements</h2>
        <p className="text-muted-foreground mt-1">
          Review and manage your NDAs for matched market offers
        </p>
      </div>

      <div className="grid gap-4">
        {ndas.map((nda) => {
          const isExpanded = expandedNdaIds.has(nda.id);
          
          return (
            <Card key={nda.id} className={nda.status === 'accepted' ? 'border-green-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{nda.nda_title}</CardTitle>
                    <CardDescription className="text-sm">
                      From: <span className="font-medium text-foreground">{nda.issuer_company}</span>
                      <br />
                      Received: {new Date(nda.created_at).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      {nda.status === 'accepted' && nda.updated_at && (
                        <span className="ml-2">
                          • Accepted: {new Date(nda.updated_at).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(nda.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Collapsible open={isExpanded} onOpenChange={() => toggleNdaExpanded(nda.id)}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      size="sm"
                    >
                      <span className="text-sm font-medium">
                        {isExpanded ? 'Hide' : 'View'} NDA Content
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-3">
                    <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{nda.nda_content}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {nda.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleNDAResponse(nda.id, 'accepted')}
                      disabled={processingId === nda.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
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
                    Access Offer Details
                  </Button>
                )}

                {nda.status === 'declined' && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      You declined this NDA on {new Date(nda.updated_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ManageNDA;
