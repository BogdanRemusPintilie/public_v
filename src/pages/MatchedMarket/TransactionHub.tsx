import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TransactionHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposedOffers, setProposedOffers] = useState<any[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<any[]>([]);
  const [declinedOffers, setDeclinedOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [activeTab, setActiveTab] = useState('proposed');

  useEffect(() => {
    if (user?.email) {
      fetchAllOffers();
    }
  }, [user]);

  const fetchAllOffers = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      
      // Fetch all offers shared with user
      const { data: allOffers, error: offersError } = await supabase
        .from('offers')
        .select(`
          *,
          structure:tranche_structures(
            id,
            structure_name,
            dataset_name
          )
        `)
        .contains('shared_with_emails', [user.email])
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Fetch user's responses
      const { data: responses, error: responsesError } = await supabase
        .from('offer_responses')
        .select('offer_id, status')
        .eq('investor_id', user.id);

      if (responsesError) throw responsesError;

      // Create a map of offer responses
      const responseMap = new Map(
        responses?.map(r => [r.offer_id, r.status]) || []
      );

      // Categorize offers
      const proposed: any[] = [];
      const accepted: any[] = [];
      const declined: any[] = [];

      allOffers?.forEach(offer => {
        const status = responseMap.get(offer.id);
        if (status === 'accepted') {
          accepted.push(offer);
        } else if (status === 'declined') {
          declined.push(offer);
        } else {
          proposed.push(offer);
        }
      });

      setProposedOffers(proposed);
      setAcceptedOffers(accepted);
      setDeclinedOffers(declined);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offer: any) => {
    try {
      // Create or update response record
      const { error } = await supabase
        .from('offer_responses')
        .upsert({
          offer_id: offer.id,
          investor_id: user!.id,
          status: 'accepted',
        });

      if (error) throw error;

      toast({
        title: 'Offer Accepted',
        description: 'Proceeding to offer details',
      });
      
      navigate(`/matched-market/offers/${offer.id}`);
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept offer',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineClick = (offer: any) => {
    setSelectedOffer(offer);
    setDeclineDialogOpen(true);
  };

  const confirmDecline = async () => {
    if (!selectedOffer) return;

    try {
      // Create or update response record
      const { error } = await supabase
        .from('offer_responses')
        .upsert({
          offer_id: selectedOffer.id,
          investor_id: user!.id,
          status: 'declined',
        });

      if (error) throw error;

      setDeclineDialogOpen(false);
      
      toast({
        title: 'Offer Declined',
        description: 'The issuer has been notified of your decision',
      });

      // Refresh offers
      fetchAllOffers();
      setActiveTab('declined');
    } catch (error: any) {
      console.error('Error declining offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline offer',
        variant: 'destructive',
      });
    }
  };

  const createDemoOffer = async () => {
    if (!user?.email) return;

    try {
      setCreatingDemo(true);

      // First, find or create a demo tranche structure
      let structureId = null;
      const { data: existingStructure } = await supabase
        .from('tranche_structures')
        .select('id')
        .eq('structure_name', '400m (Demo Data Lite)')
        .maybeSingle();

      if (existingStructure) {
        structureId = existingStructure.id;
      } else {
        // Create a demo structure
        const { data: newStructure, error: structureError } = await supabase
          .from('tranche_structures')
          .insert({
            structure_name: '400m (Demo Data Lite)',
            dataset_name: 'Demo Dataset',
            tranches: [],
            user_id: user.id,
          })
          .select('id')
          .single();

        if (structureError) throw structureError;
        structureId = newStructure.id;
      }

      // Create the demo offer
      const { error: offerError } = await supabase
        .from('offers')
        .insert({
          offer_name: 'Investor Demo Offer',
          structure_id: structureId,
          user_id: user.id,
          shared_with_emails: [user.email],
          issuer_nationality: 'British',
          issuer_overview: 'British CIB',
          issuer_business_focus: 'SME Corporate loans, Large Corporate loans and consumer finance',
          structure_synthetic: true,
          structure_true_sale: false,
          structure_sts: false,
          structure_consumer_finance: false,
          additional_comments: 'Overall Asset Pool Size: €14.82M, Weighted Average Life: 4 years',
          status: 'active',
        });

      if (offerError) throw offerError;

      toast({
        title: 'Demo Offer Created',
        description: 'The demo offer has been added to your Proposed Offers',
      });

      fetchAllOffers();
    } catch (error: any) {
      console.error('Error creating demo offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create demo offer',
        variant: 'destructive',
      });
    } finally {
      setCreatingDemo(false);
    }
  };

  const renderOfferCard = (offer: any, showActions: boolean = true) => (
    <Card key={offer.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{offer.offer_name}</CardTitle>
            <CardDescription className="mt-2">
              Structure: {offer.structure?.structure_name || 'N/A'} | 
              Dataset: {offer.structure?.dataset_name || 'N/A'}
            </CardDescription>
          </div>
          <Badge variant="default">{offer.status || 'active'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {offer.issuer_nationality && (
          <div>
            <p className="text-sm font-medium">Issuer Nationality</p>
            <p className="text-sm text-gray-600">{offer.issuer_nationality}</p>
          </div>
        )}

        {offer.issuer_overview && (
          <div>
            <p className="text-sm font-medium">Issuer Overview</p>
            <p className="text-sm text-gray-600">{offer.issuer_overview}</p>
          </div>
        )}

        {(offer.structure_synthetic || offer.structure_true_sale || offer.structure_sts) && (
          <div>
            <p className="text-sm font-medium mb-2">Structure Features</p>
            <div className="flex flex-wrap gap-2">
              {offer.structure_synthetic && <Badge variant="secondary">Synthetic</Badge>}
              {offer.structure_true_sale && <Badge variant="secondary">True Sale</Badge>}
              {offer.structure_sts && <Badge variant="secondary">STS</Badge>}
              {offer.structure_consumer_finance && <Badge variant="secondary">Consumer Finance</Badge>}
            </div>
          </div>
        )}

        {offer.additional_comments && (
          <div>
            <p className="text-sm font-medium">Additional Details</p>
            <p className="text-sm text-gray-600">{offer.additional_comments}</p>
          </div>
        )}

        {showActions && (
          <>
            <Separator />
            <div className="flex gap-3">
              <Button 
                onClick={() => handleAccept(offer)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Offer
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDeclineClick(offer)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline Offer
              </Button>
            </div>
          </>
        )}

        {!showActions && (
          <>
            <Separator />
            <Button 
              onClick={() => navigate(`/matched-market/offers/${offer.id}`)}
              className="w-full"
              variant="outline"
            >
              View Details
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Transaction Hub</h1>
          <p className="text-gray-600">Review and manage offers from issuers</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposed">
              Proposed Offers ({proposedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted Offers ({acceptedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="declined">
              Declined Offers ({declinedOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposed" className="space-y-6">
            {proposedOffers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 mb-4">No proposed offers at this time</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                      Return to Dashboard
                    </Button>
                    <Button onClick={createDemoOffer} disabled={creatingDemo}>
                      {creatingDemo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Demo...
                        </>
                      ) : (
                        'Load Demo Offer'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {proposedOffers.map((offer) => renderOfferCard(offer, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-6">
            {acceptedOffers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500">No accepted offers yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {acceptedOffers.map((offer) => renderOfferCard(offer, false))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="declined" className="space-y-6">
            {declinedOffers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500">No declined offers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {declinedOffers.map((offer) => renderOfferCard(offer, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline the offer "{selectedOffer?.offer_name}"? 
              The issuer will be notified of your decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDecline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Decline Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
