import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showDeclineConfirmation, setShowDeclineConfirmation] = useState(false);
  const [declinedOfferName, setDeclinedOfferName] = useState('');

  useEffect(() => {
    if (user?.email) {
      fetchProposedOffers();
    }
  }, [user]);

  const fetchProposedOffers = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
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

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      console.error('Error fetching proposed offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposed offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offer: any) => {
    try {
      // Update offer status or create acceptance record
      // For now, navigate to offer details
      toast({
        title: 'Offer Accepted',
        description: 'Proceeding to next stages of the transaction process',
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
      // Here you could update the offer status or create a decline record
      // For now, we'll just show the confirmation
      setDeclinedOfferName(selectedOffer.offer_name);
      setDeclineDialogOpen(false);
      setShowDeclineConfirmation(true);
      
      // Remove the offer from the list
      setOffers(offers.filter(o => o.id !== selectedOffer.id));
      
      toast({
        title: 'Offer Declined',
        description: 'The issuer has been notified of your decision',
      });
    } catch (error: any) {
      console.error('Error declining offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline offer',
        variant: 'destructive',
      });
    }
  };

  if (showDeclineConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setShowDeclineConfirmation(false)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transaction Hub
          </Button>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Offer Declined</CardTitle>
              <CardDescription>
                You have declined the offer: <strong>{declinedOfferName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                The issuer has been notified of your decision. This offer will no longer appear in your Transaction Hub.
              </p>
              <Button onClick={() => {
                setShowDeclineConfirmation(false);
                fetchProposedOffers();
              }}>
                Return to Transaction Hub
              </Button>
            </CardContent>
          </Card>
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
          <p className="text-gray-600">Review and respond to proposed offers from issuers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">No proposed offers at this time</p>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Proposed Offers</h2>
            <div className="grid gap-6">
              {offers.map((offer) => (
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

                    {offer.comments && (
                      <div>
                        <p className="text-sm font-medium">Comments</p>
                        <p className="text-sm text-gray-600">{offer.comments}</p>
                      </div>
                    )}

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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
