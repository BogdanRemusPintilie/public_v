import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Users, FileText, DollarSign, Shield, TrendingUp, TrendingDown, Minus, ArrowLeft, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InvestorInterest {
  id: string;
  investorName: string;
  email: string;
  interestLevel: 'interested' | 'indication' | 'declined';
  contactDate: string;
  proposedPricing?: {
    tranche: string;
    price: number;
    spread: number;
  }[];
  ndaExecuted?: boolean;
  dataAccessGranted?: boolean;
}

interface DatabaseOffer {
  id: string;
  offer_name: string;
  status: string;
  structure_type: string;
  target_investors: string[];
  shared_with_emails: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  structure_id: string;
  issuer_nationality?: string;
  issuer_overview?: string;
  issuer_business_focus?: string;
  structure_true_sale?: boolean;
  structure_sts?: boolean;
  structure_synthetic?: boolean;
  structure_consumer_finance?: boolean;
  structure_figures?: string;
  additional_comments?: string;
  comments?: string;
}

interface OfferData {
  id: string;
  offerName: string;
  status: string;
  structureType: string;
  totalSize: number;
  tranches: Array<{
    name: string;
    size: number;
    rating: string;
    spread: number;
  }>;
}

interface ManageOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOffer?: OfferData;
}

export const ManageOfferModal: React.FC<ManageOfferModalProps> = ({
  isOpen,
  onClose,
  selectedOffer
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [offers, setOffers] = useState<DatabaseOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [investorInterests, setInvestorInterests] = useState<InvestorInterest[]>([]);
  const [activeTab, setActiveTab] = useState('offers');
  const [showSharePage, setShowSharePage] = useState(false);
  const [selectedInvestorForShare, setSelectedInvestorForShare] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch offers from database
  useEffect(() => {
    if (isOpen && user) {
      fetchOffers();
      // Mock data for demonstration of investor interests
      setInvestorInterests([
        {
          id: '1',
          investorName: 'Deutsche Bank AG',
          email: 'investments@db.com',
          interestLevel: 'indication',
          contactDate: '2024-01-15',
          proposedPricing: [
            { tranche: 'Senior A1', price: 99.5, spread: 45 },
            { tranche: 'Senior A2', price: 98.8, spread: 85 }
          ],
          ndaExecuted: true,
          dataAccessGranted: true
        },
        {
          id: '2',
          investorName: 'BNP Paribas',
          email: 'securitization@bnpparibas.com',
          interestLevel: 'interested',
          contactDate: '2024-01-18',
          proposedPricing: [
            { tranche: 'Senior A1', price: 99.2, spread: 55 }
          ],
          ndaExecuted: false,
          dataAccessGranted: false
        },
        {
          id: '3',
          investorName: 'Credit Suisse',
          email: 'fixed.income@credit-suisse.com',
          interestLevel: 'indication',
          contactDate: '2024-01-20',
          proposedPricing: [
            { tranche: 'Senior A1', price: 99.8, spread: 35 },
            { tranche: 'Senior A2', price: 99.1, spread: 75 }
          ],
          ndaExecuted: true,
          dataAccessGranted: true
        }
      ]);
    }
  }, [isOpen, user]);

  const fetchOffers = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data || []);
      
      if (data && data.length > 0) {
        // Auto-select the first offer if none is selected
        if (!selectedOfferId) {
          setSelectedOfferId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch offers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInterestBadgeColor = (level: string) => {
    switch (level) {
      case 'indication': return 'bg-green-100 text-green-800 border-green-200';
      case 'interested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculatePricingStats = (tranche: string) => {
    const prices = investorInterests
      .filter(investor => investor.proposedPricing)
      .flatMap(investor => investor.proposedPricing!)
      .filter(pricing => pricing.tranche === tranche)
      .map(pricing => pricing.price);

    if (prices.length === 0) return null;

    return {
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      high: Math.max(...prices),
      low: Math.min(...prices),
      count: prices.length
    };
  };

  const handleGrantDataAccess = (investorId: string) => {
    setInvestorInterests(prev => 
      prev.map(investor => 
        investor.id === investorId 
          ? { ...investor, dataAccessGranted: true }
          : investor
      )
    );
    toast({
      title: "Data Access Granted",
      description: "Investor now has access to full dataset"
    });
  };

  const handleShareTransactionOverview = (investorId: string) => {
    const investor = investorInterests.find(i => i.id === investorId);
    setSelectedInvestorForShare(investorId);
    setShareEmail(investor?.email || '');
    setShareMessage(`Dear Investor,

Please find attached the transaction overview for ${selectedOffer?.offerName || 'Transaction'}. This document contains detailed information about the structure, tranches, and risk characteristics.

Best regards,
The RiskBlocs Team`);
    setShowSharePage(true);
  };

  const handleSendTransactionOverview = async () => {
    if (!shareEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Transaction Overview Shared",
        description: `Overview has been sent to ${shareEmail}`,
      });
      setIsLoading(false);
      setShowSharePage(false);
      setSelectedInvestorForShare(null);
      setShareEmail('');
      setShareMessage('');
    }, 1000);
  };

  const handleBackFromShare = () => {
    setShowSharePage(false);
    setSelectedInvestorForShare(null);
    setShareEmail('');
    setShareMessage('');
  };

  const interestedInvestors = investorInterests.filter(i => i.interestLevel === 'interested');
  const indicationInvestors = investorInterests.filter(i => i.interestLevel === 'indication');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showSharePage ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackFromShare}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                Share Transaction Overview
              </div>
            ) : (
              "Manage Offer"
            )}
          </DialogTitle>
        </DialogHeader>

        {showSharePage ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Share Details
                </CardTitle>
                <CardDescription>
                  Enter the investor's email address and customize the message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="investor@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message..."
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Transaction Overview will include:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Structure summary and tranche details</li>
                    <li>• Risk characteristics and ratings</li>
                    <li>• Payment waterfall information</li>
                    <li>• Key terms and conditions</li>
                    <li>• Portfolio composition overview</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSendTransactionOverview} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Send Transaction Overview'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBackFromShare}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="offers">Your Offers</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interested">Interested ({interestedInvestors.length})</TabsTrigger>
            <TabsTrigger value="indications">Indications ({indicationInvestors.length})</TabsTrigger>
            <TabsTrigger value="pricing">Pricing View</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Offers</CardTitle>
                <CardDescription>Select an offer to manage investor interest and communications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading offers...</span>
                  </div>
                ) : offers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No offers created yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create your first offer to manage investor communications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <div 
                        key={offer.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedOfferId === offer.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedOfferId(offer.id);
                          setActiveTab('overview');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.offer_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {offer.structure_type || 'Transaction structure'} • 
                              Created {new Date(offer.created_at).toLocaleDateString()}
                            </p>
                            {offer.target_investors?.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {offer.target_investors.length} target investor{offer.target_investors.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                              {offer.status || 'Active'}
                            </Badge>
                            {selectedOfferId === offer.id && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total Interest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{investorInterests.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {indicationInvestors.length} indications, {interestedInvestors.length} interested
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    NDAs Executed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {investorInterests.filter(i => i.ndaExecuted).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {investorInterests.length} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pricing Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {investorInterests.filter(i => i.proposedPricing?.length).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    investors submitted pricing
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
                <CardDescription>
                  {selectedOfferId ? 
                    `Overview of ${offers.find(o => o.id === selectedOfferId)?.offer_name || 'selected offer'}` : 
                    'Select an offer to view details'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedOfferId ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Offer Name</p>
                          <p className="text-sm text-muted-foreground">
                            {offers.find(o => o.id === selectedOfferId)?.offer_name || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Structure Type</p>
                          <p className="text-sm text-muted-foreground">
                            {offers.find(o => o.id === selectedOfferId)?.structure_type || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <Badge variant={offers.find(o => o.id === selectedOfferId)?.status === 'active' ? 'default' : 'secondary'}>
                            {offers.find(o => o.id === selectedOfferId)?.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Created Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(offers.find(o => o.id === selectedOfferId)?.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Target Investors</p>
                          <p className="text-sm text-muted-foreground">
                            {(offers.find(o => o.id === selectedOfferId)?.target_investors?.length || 0)} selected
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Shared With</p>
                          <p className="text-sm text-muted-foreground">
                            {(offers.find(o => o.id === selectedOfferId)?.shared_with_emails?.length || 0)} recipients
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Issuer Information */}
                    {(offers.find(o => o.id === selectedOfferId)?.issuer_overview || 
                      offers.find(o => o.id === selectedOfferId)?.issuer_nationality || 
                      offers.find(o => o.id === selectedOfferId)?.issuer_business_focus) && (
                      <>
                        <div>
                          <p className="text-sm font-medium mb-3">Issuer Information</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {offers.find(o => o.id === selectedOfferId)?.issuer_nationality && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Nationality</p>
                                <p className="text-sm">{offers.find(o => o.id === selectedOfferId)?.issuer_nationality}</p>
                              </div>
                            )}
                            {offers.find(o => o.id === selectedOfferId)?.issuer_business_focus && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Business Focus</p>
                                <p className="text-sm">{offers.find(o => o.id === selectedOfferId)?.issuer_business_focus}</p>
                              </div>
                            )}
                          </div>
                          {offers.find(o => o.id === selectedOfferId)?.issuer_overview && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-muted-foreground">Overview</p>
                              <p className="text-sm">{offers.find(o => o.id === selectedOfferId)?.issuer_overview}</p>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    {/* Structure Details */}
                    <div>
                      <p className="text-sm font-medium mb-3">Structure Characteristics</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground">True Sale</p>
                          <div className="mt-1">
                            {offers.find(o => o.id === selectedOfferId)?.structure_true_sale ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground">STS Compliant</p>
                          <div className="mt-1">
                            {offers.find(o => o.id === selectedOfferId)?.structure_sts ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground">Synthetic</p>
                          <div className="mt-1">
                            {offers.find(o => o.id === selectedOfferId)?.structure_synthetic ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground">Consumer Finance</p>
                          <div className="mt-1">
                            {offers.find(o => o.id === selectedOfferId)?.structure_consumer_finance ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Information */}
                    {(offers.find(o => o.id === selectedOfferId)?.structure_figures || 
                      offers.find(o => o.id === selectedOfferId)?.additional_comments) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          {offers.find(o => o.id === selectedOfferId)?.structure_figures && (
                            <div>
                              <p className="text-sm font-medium">Structure Figures</p>
                              <p className="text-sm text-muted-foreground">
                                {offers.find(o => o.id === selectedOfferId)?.structure_figures}
                              </p>
                            </div>
                          )}
                          {offers.find(o => o.id === selectedOfferId)?.additional_comments && (
                            <div>
                              <p className="text-sm font-medium">Additional Comments</p>
                              <p className="text-sm text-muted-foreground">
                                {offers.find(o => o.id === selectedOfferId)?.additional_comments}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select an offer from the "Your Offers" tab to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interested" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interested Investors</CardTitle>
                <CardDescription>Investors who have shown interest but haven't provided formal indications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interestedInvestors.map((investor) => (
                    <div key={investor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{investor.investorName}</h4>
                          <p className="text-sm text-muted-foreground">{investor.email}</p>
                        </div>
                        <Badge className={getInterestBadgeColor(investor.interestLevel)}>
                          {investor.interestLevel}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShareTransactionOverview(investor.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Share Transaction Overview
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {interestedInvestors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No interested investors yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Indication of Interest</CardTitle>
                <CardDescription>Investors who have provided formal indications and require data access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indicationInvestors.map((investor) => (
                    <div key={investor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{investor.investorName}</h4>
                          <p className="text-sm text-muted-foreground">{investor.email}</p>
                        </div>
                        <Badge className={getInterestBadgeColor(investor.interestLevel)}>
                          Formal Indication
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          <span>NDA Status:</span>
                          <Badge 
                            variant={investor.ndaExecuted ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {investor.ndaExecuted ? 'Executed' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>Data Access:</span>
                          <Badge 
                            variant={investor.dataAccessGranted ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {investor.dataAccessGranted ? 'Granted' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!investor.ndaExecuted || investor.dataAccessGranted}
                          onClick={() => handleGrantDataAccess(investor.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Grant Full Data Access
                        </Button>
                        <Button variant="outline" size="sm">
                          View Data Structure
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {indicationInvestors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No formal indications received yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Proposed Pricing Overview</CardTitle>
                <CardDescription>Pricing indications received from investors by tranche</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {['Senior A1', 'Senior A2', 'Mezzanine B'].map((tranche) => {
                    const stats = calculatePricingStats(tranche);
                    
                    if (!stats) {
                      return (
                        <div key={tranche} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{tranche}</h4>
                          <p className="text-sm text-muted-foreground">No pricing received yet</p>
                        </div>
                      );
                    }

                    return (
                      <div key={tranche} className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium">{tranche}</h4>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Average</p>
                            <p className="text-lg font-semibold">{stats.average.toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">High</p>
                            <p className="text-lg font-semibold text-green-600 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {stats.high.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Low</p>
                            <p className="text-lg font-semibold text-red-600 flex items-center justify-center">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              {stats.low.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Responses</p>
                            <p className="text-lg font-semibold">{stats.count}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Individual Proposals:</p>
                          {investorInterests
                            .filter(investor => investor.proposedPricing?.some(p => p.tranche === tranche))
                            .map(investor => {
                              const pricing = investor.proposedPricing!.find(p => p.tranche === tranche);
                              return (
                                <div key={investor.id} className="flex justify-between items-center text-sm">
                                  <span>{investor.investorName}</span>
                                  <div className="flex items-center gap-4">
                                    <span>Price: {pricing!.price}</span>
                                    <span>Spread: +{pricing!.spread}bps</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};