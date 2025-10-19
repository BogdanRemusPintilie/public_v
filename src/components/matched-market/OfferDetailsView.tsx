import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Database, FolderOpen, TrendingUp } from 'lucide-react';
import { InvestorResponseForm } from './InvestorResponseForm';
import { InvestorResponsesManager } from './InvestorResponsesManager';
import { useUserType } from '@/hooks/useUserType';
import { Button } from '@/components/ui/button';
import { StructureSummary } from './StructureSummary';

interface OfferDetailsViewProps {
  offer: any;
  onUpdate: () => void;
}

export function OfferDetailsView({ offer, onUpdate }: OfferDetailsViewProps) {
  const { userType } = useUserType();

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

      {/* Structure Summary - Only for investors who have shown interest */}
      {userType === 'investor' && offer.structure && (
        <StructureSummary 
          structure={offer.structure} 
          dataset={offer.structure.dataset_name}
        />
      )}

      {/* Data Tape Access - Only for investors */}
      {userType === 'investor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Tape Access
            </CardTitle>
            <CardDescription>Access detailed loan-level data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The full data tape contains loan-level information for all assets in the portfolio.
              </p>
              <Button className="w-full" variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Request Full Data Tape Access
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentary Repository - Only for investors */}
      {userType === 'investor' && (
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
              <p className="text-sm text-muted-foreground">
                Access to transaction documents, legal agreements, and supporting materials.
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

      {/* Investor Response Form - Only for investors */}
      {userType === 'investor' && (
        <InvestorResponseForm 
          offerId={offer.id} 
          onResponseSubmitted={onUpdate}
          datasetName={offer.structure?.dataset_name}
        />
      )}

      {/* Pricing Information - Only for investors who have shown interest */}
      {userType === 'investor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pricing Submission
            </CardTitle>
            <CardDescription>Submit your indicative or firm pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Indicative Price</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Non-binding price indication for initial evaluation
                  </p>
                  <Button variant="outline" className="w-full">
                    Submit Indicative Price
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Firm Price</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Binding price offer subject to due diligence
                  </p>
                  <Button className="w-full">
                    Submit Firm Price
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
