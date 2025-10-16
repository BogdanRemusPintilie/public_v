import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';

interface OfferDetailsViewProps {
  offer: any;
  onUpdate: () => void;
}

export function OfferDetailsView({ offer, onUpdate }: OfferDetailsViewProps) {
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

          {offer.target_investors && offer.target_investors.length > 0 && (
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

          {offer.shared_with_emails && offer.shared_with_emails.length > 0 && (
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

      {offer.structure && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tranching Analysis Document
            </CardTitle>
            <CardDescription>
              Detailed structure analysis for {offer.structure.structure_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portfolio Overview */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Portfolio Overview</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    €{(offer.structure.tranches.reduce((sum: number, t: any) => sum + (t.size || 0), 0) / 1000000).toFixed(2)}M
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Number of Tranches</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {offer.structure.tranches.length}
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Weighted Avg Cost</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {((offer.structure.tranches.reduce((sum: number, t: any) => {
                      const trancheWeight = t.size / offer.structure.tranches.reduce((s: number, tr: any) => s + tr.size, 0);
                      return sum + (t.coupon * trancheWeight);
                    }, 0))).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tranche Structure Visualization */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Tranche Structure</h3>
              <div className="relative bg-muted/30 rounded-lg overflow-hidden h-64 border">
                {offer.structure.tranches.map((tranche: any, index: number) => {
                  const totalSize = offer.structure.tranches.reduce((sum: number, t: any) => sum + t.size, 0);
                  const height = ((tranche.size / totalSize) * 100);
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div
                      key={index}
                      className={`${color} flex items-center justify-center text-white font-medium border-b border-white/20`}
                      style={{ height: `${height}%` }}
                    >
                      <div className="text-center px-2">
                        <div className="font-semibold text-sm">{tranche.name}</div>
                        <div className="text-xs opacity-90">
                          €{(tranche.size / 1000000).toFixed(2)}M ({height.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Detailed Tranche Analysis */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Detailed Tranche Analysis</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tranche Name</TableHead>
                      <TableHead className="text-right">Size (€M)</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                      <TableHead className="text-right">Coupon (%)</TableHead>
                      <TableHead className="text-right">Subordination (%)</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.structure.tranches.map((tranche: any, index: number) => {
                      const totalSize = offer.structure.tranches.reduce((sum: number, t: any) => sum + t.size, 0);
                      const percentage = ((tranche.size / totalSize) * 100);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{tranche.name}</TableCell>
                          <TableCell className="text-right">€{(tranche.size / 1000000).toFixed(2)}M</TableCell>
                          <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{tranche.coupon.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{tranche.subordination}%</TableCell>
                          <TableCell>
                            <Badge variant={tranche.rating === 'AAA' ? 'default' : tranche.rating === 'Unrated' ? 'secondary' : 'outline'}>
                              {tranche.rating}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Risk Summary */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Risk Summary</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Credit Enhancement</h4>
                  <p className="text-sm">
                    Total subordination provides {offer.structure.tranches[0]?.subordination || 0}% protection for senior tranches
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Structure Type</h4>
                  <div className="flex gap-2 flex-wrap">
                    {offer.structure_synthetic && <Badge variant="secondary">Synthetic</Badge>}
                    {offer.structure_true_sale && <Badge variant="secondary">True Sale</Badge>}
                    {offer.structure_sts && <Badge variant="secondary">STS</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
