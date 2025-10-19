import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Database, FolderOpen, TrendingUp, Lock } from 'lucide-react';
import { InvestorResponseForm } from './InvestorResponseForm';
import { InvestorResponsesManager } from './InvestorResponsesManager';
import { useUserType } from '@/hooks/useUserType';
import { Button } from '@/components/ui/button';
import { StructureSummary } from './StructureSummary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface OfferDetailsViewProps {
  offer: any;
  onUpdate: () => void;
}

export function OfferDetailsView({ offer, onUpdate }: OfferDetailsViewProps) {
  const { userType } = useUserType();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ndaStatus, setNdaStatus] = useState<string | null>(null);
  const [investorResponse, setInvestorResponse] = useState<any>(null);
  const [indicativePrice, setIndicativePrice] = useState('');
  const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);
  const [datasetSummary, setDatasetSummary] = useState<any>(null);

  useEffect(() => {
    if (userType === 'investor' && user?.id && offer.id !== 'demo-offer') {
      fetchDatasetSummary();
      checkNdaStatus();
      checkInvestorResponse();
    }
  }, [userType, user, offer.id]);

  const fetchDatasetSummary = async () => {
    if (!offer.structure?.dataset_name) return;

    try {
      const { data, error } = await supabase.rpc('get_dataset_summaries_optimized');
      
      if (error) {
        console.error('Error fetching dataset summary:', error);
        return;
      }

      const summary = data?.find((d: any) => d.dataset_name === offer.structure.dataset_name);
      if (summary) {
        setDatasetSummary(summary);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkNdaStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('ndas')
        .select('status')
        .eq('offer_id', offer.id)
        .eq('investor_id', user.id)
        .single();

      if (data) {
        setNdaStatus(data.status);
      }
    } catch (error) {
      // No NDA found
    }
  };

  const checkInvestorResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_responses')
        .select('*')
        .eq('offer_id', offer.id)
        .eq('investor_id', user.id)
        .single();

      if (data) {
        setInvestorResponse(data);
        setIndicativePrice(data.indicative_price?.toString() || '');
      }
    } catch (error) {
      // No response found
    }
  };

  const handleSubmitIndicativePrice = async () => {
    const priceValue = parseFloat(indicativePrice);
    
    if (!indicativePrice || isNaN(priceValue)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid indicative price percentage',
        variant: 'destructive',
      });
      return;
    }

    if (priceValue < 0 || priceValue > 100) {
      toast({
        title: 'Error',
        description: 'Price percentage must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingPrice(true);
    try {
      const responseData = {
        offer_id: offer.id,
        investor_id: user.id,
        status: 'accepted',
        indicative_price: priceValue,
      };

      if (investorResponse) {
        await supabase
          .from('offer_responses')
          .update({ indicative_price: priceValue })
          .eq('id', investorResponse.id);
      } else {
        await supabase
          .from('offer_responses')
          .insert([responseData]);
      }

      toast({
        title: 'Indicative Price Submitted',
        description: `Your indicative price of ${priceValue}% has been sent to the issuer.`,
      });
      
      await checkInvestorResponse();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPrice(false);
    }
  };

  const isNdaAccepted = ndaStatus === 'accepted' || offer.id === 'demo-offer';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Offer Information</CardTitle>
              <CardDescription>Details about this matched market offer</CardDescription>
            </div>
            <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
              {offer.status || 'active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Structure</h3>
            <p className="text-sm text-muted-foreground">
              {offer.structure?.structure_name || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              Dataset: {offer.structure?.dataset_name || 'N/A'}
            </p>
          </div>

          <Separator />

          {offer.issuer_nationality && (
            <div>
              <h3 className="font-semibold mb-2">Issuer Details</h3>
              <p className="text-sm"><span className="font-medium">Nationality:</span> {offer.issuer_nationality}</p>
              {offer.issuer_overview && (
                <p className="text-sm mt-1"><span className="font-medium">Overview:</span> {offer.issuer_overview}</p>
              )}
              {offer.issuer_business_focus && (
                <p className="text-sm mt-1"><span className="font-medium">Business Focus:</span> {offer.issuer_business_focus}</p>
              )}
            </div>
          )}

          {(offer.structure_synthetic || offer.structure_true_sale || offer.structure_sts) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Structure Features</h3>
                <div className="flex flex-wrap gap-2">
                  {offer.structure_synthetic && <Badge variant="secondary">Synthetic</Badge>}
                  {offer.structure_true_sale && <Badge variant="secondary">True Sale</Badge>}
                  {offer.structure_sts && <Badge variant="secondary">STS</Badge>}
                  {offer.structure_consumer_finance && <Badge variant="secondary">Consumer Finance</Badge>}
                </div>
              </div>
            </>
          )}

          {userType !== 'investor' && offer.target_investors && offer.target_investors.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Target Investors ({offer.target_investors.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {offer.target_investors.map((investor: string) => (
                    <Badge key={investor} variant="outline">{investor}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {userType !== 'investor' && offer.shared_with_emails && offer.shared_with_emails.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Shared With</h3>
                <div className="space-y-1">
                  {offer.shared_with_emails.map((email: string) => (
                    <p key={email} className="text-sm text-muted-foreground">{email}</p>
                  ))}
                </div>
              </div>
            </>
          )}

          {(offer.comments || offer.additional_comments) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Comments</h3>
                {offer.comments && <p className="text-sm mb-2">{offer.comments}</p>}
                {offer.additional_comments && <p className="text-sm">{offer.additional_comments}</p>}
              </div>
            </>
          )}

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(offer.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(offer.updated_at).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Investor Interest Section - Only shows for issuers */}
      {userType !== 'investor' && offer.structure?.dataset_name && (
        <InvestorResponsesManager 
          offerId={offer.id} 
          datasetName={offer.structure.dataset_name}
        />
      )}

      {/* Investor Response Form - Only for investors */}
      {userType === 'investor' && (
        <InvestorResponseForm 
          offerId={offer.id} 
          onResponseSubmitted={() => {
            onUpdate();
            checkInvestorResponse();
          }}
          datasetName={offer.structure?.dataset_name}
        />
      )}

      {/* Structure Summary - Only for investors after NDA accepted */}
      {userType === 'investor' && isNdaAccepted && offer.structure && (
        <StructureSummary 
          structure={offer.structure} 
          dataset={offer.structure.dataset_name}
        />
      )}

      {/* Data Tape Access - Only for investors after NDA accepted */}
      {userType === 'investor' && isNdaAccepted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Tape Access
            </CardTitle>
            <CardDescription>Full loan-level data available after NDA acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Data tape access granted
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                The full data tape contains loan-level information for all {datasetSummary?.record_count || 'N/A'} assets in the portfolio.
              </p>
              <Button className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Download Full Data Tape
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tape - Locked (before NDA) */}
      {userType === 'investor' && !isNdaAccepted && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Tape Access
            </CardTitle>
            <CardDescription>Available after NDA acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Accept the NDA to access the full loan-level data tape.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documentary Repository - Only for investors after NDA accepted */}
      {userType === 'investor' && isNdaAccepted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Documentary Repository
            </CardTitle>
            <CardDescription>Legal documents and transaction materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Document repository access granted
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Access transaction documents, legal agreements, and supporting materials.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Term Sheet
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Information Memorandum
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Legal Documentation
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Due Diligence Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentary Repository - Locked (before NDA) */}
      {userType === 'investor' && !isNdaAccepted && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Documentary Repository
            </CardTitle>
            <CardDescription>Available after NDA acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Accept the NDA to access transaction documents and materials.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Indicative Pricing - Stage 1 */}
      {userType === 'investor' && investorResponse?.status === 'accepted' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicative Price
            </CardTitle>
            <CardDescription>Non-binding price indication for initial evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {investorResponse?.indicative_price ? (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="text-sm font-medium mb-1">Indicative Price Submitted</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Number(investorResponse.indicative_price).toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted on {new Date(investorResponse.updated_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Submit a non-binding indicative price percentage to express your interest level.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="indicative-price">Indicative Price (%)</Label>
                  <div className="relative">
                    <Input
                      id="indicative-price"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 12.5"
                      value={indicativePrice}
                      onChange={(e) => setIndicativePrice(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a percentage between 0 and 100
                  </p>
                </div>
                <Button 
                  onClick={handleSubmitIndicativePrice}
                  disabled={isSubmittingPrice}
                  className="w-full"
                >
                  Submit Indicative Price
                </Button>
              </>
            )}
          </CardContent>
      </Card>
      )}
    </div>
  );
}
