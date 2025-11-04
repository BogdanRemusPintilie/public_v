import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

interface DistributionSummaryProps {
  offer: any;
  datasetSummary: any;
  offerResponses: any[];
  userType: string;
}

export function DistributionSummary({ offer, datasetSummary, offerResponses, userType }: DistributionSummaryProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [investors, setInvestors] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    if (offer.structure?.tranches) {
      calculateAllocations();
    }
    if (offerResponses.length > 0) {
      loadInvestors();
    }
  }, [offer, datasetSummary, offerResponses]);

  const calculateAllocations = () => {
    const totalValue = datasetSummary?.total_value || 0;
    const tranches = offer.structure.tranches;
    
    if (!tranches || tranches.length === 0) return;
    
    const sortedTranches = [...tranches].sort((a: any, b: any) => b.thickness - a.thickness);
    let cumulativeAttachment = 0;
    
    const allocationData: any[] = sortedTranches.map((tranche: any, index: number) => {
      const size = (totalValue * tranche.thickness) / 100;
      const detachmentPoint = cumulativeAttachment + tranche.thickness;
      const ratingMatch = tranche.name.match(/\b(AAA|AA|A|BBB|BB|B|CCC|CC|C)\b/i);
      const rating = ratingMatch ? ratingMatch[0].toUpperCase() : 'Unrated';
      
      const allocation: any = {
        id: tranche.id,
        name: tranche.name,
        thickness: tranche.thickness,
        size: size,
        rating: rating,
        costBps: tranche.costBps || 0,
        attachmentPoint: cumulativeAttachment,
        detachmentPoint: detachmentPoint,
        assignedInvestor: null, // Will be populated from saved data if available
        seniority: index,
      };
      
      cumulativeAttachment = detachmentPoint;
      return allocation;
    });
    
    setAllocations(allocationData);
  };

  const loadInvestors = async () => {
    const investorIds = [...new Set(offerResponses.map(r => r.investor_id))];
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, company')
        .in('user_id', investorIds);
      
      if (error) throw error;
      
      const investorList = profiles?.map(p => ({
        id: p.user_id,
        name: p.full_name || p.company || p.email,
        email: p.email,
      })) || [];
      
      setInvestors(investorList);
    } catch (error) {
      console.error('Error loading investors:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate weighted average cost
  const calculateWeightedAvgCost = () => {
    const totalValue = datasetSummary?.total_value || 0;
    if (totalValue === 0) return 0;
    
    const weightedSum = allocations.reduce((sum, alloc) => {
      return sum + (alloc.size * alloc.costBps);
    }, 0);
    
    return weightedSum / totalValue;
  };

  // Calculate concentration metrics
  const calculateConcentration = () => {
    const assignedAllocations = allocations.filter(a => a.assignedInvestor);
    
    // Group by investor
    const investorExposures = new Map<string, number>();
    assignedAllocations.forEach(alloc => {
      const current = investorExposures.get(alloc.assignedInvestor) || 0;
      investorExposures.set(alloc.assignedInvestor, current + alloc.size);
    });

    const exposures = Array.from(investorExposures.values());
    const totalExposure = exposures.reduce((sum, exp) => sum + exp, 0);
    
    // Herfindahl-Hirschman Index (HHI)
    const hhi = exposures.reduce((sum, exp) => {
      const marketShare = (exp / totalExposure) * 100;
      return sum + (marketShare * marketShare);
    }, 0);

    // Top investor concentration
    const maxExposure = Math.max(...exposures, 0);
    const maxConcentration = totalExposure > 0 ? (maxExposure / totalExposure) * 100 : 0;

    return {
      hhi: hhi.toFixed(0),
      maxConcentration: maxConcentration.toFixed(1),
      numInvestors: investorExposures.size,
    };
  };

  // Generate allocation summary by investor
  const getInvestorAllocations = () => {
    const summary: any[] = [];
    
    investors.forEach(investor => {
      const investorTranches = allocations.filter(a => a.assignedInvestor === investor.id);
      if (investorTranches.length === 0) return;
      
      const totalExposure = investorTranches.reduce((sum, t) => sum + t.size, 0);
      const weightedCost = investorTranches.reduce((sum, t) => sum + (t.size * t.costBps), 0) / totalExposure;
      const totalPercentage = investorTranches.reduce((sum, t) => sum + t.thickness, 0);
      
      summary.push({
        investor,
        tranches: investorTranches,
        totalExposure,
        totalPercentage,
        weightedCost,
        trancheCount: investorTranches.length,
      });
    });
    
    return summary.sort((a, b) => b.totalExposure - a.totalExposure);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      let yPosition = height - 50;
      
      // Title
      page.drawText('ALLOCATION TERM SHEET', {
        x: 50,
        y: yPosition,
        size: 20,
        font: timesRomanBold,
        color: rgb(0.2, 0.3, 0.6),
      });
      yPosition -= 30;
      
      // Offer Details
      page.drawText(`Offer: ${offer.offer_name}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
      });
      yPosition -= 20;
      
      page.drawText(`Date: ${new Date().toLocaleDateString('en-GB')}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
      });
      yPosition -= 40;
      
      // Key Metrics Section
      page.drawText('KEY METRICS', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBold,
      });
      yPosition -= 25;
      
      const metrics = [
        `Total Exposure: ${formatCurrency(datasetSummary?.total_value || 0)}`,
        `Number of Tranches: ${allocations.length}`,
        `Weighted Average Cost: ${calculateWeightedAvgCost().toFixed(2)} bps`,
        `Number of Investors: ${calculateConcentration().numInvestors}`,
      ];
      
      metrics.forEach(metric => {
        page.drawText(metric, {
          x: 70,
          y: yPosition,
          size: 10,
          font: timesRomanFont,
        });
        yPosition -= 18;
      });
      
      yPosition -= 10;
      
      // Concentration Metrics
      const concentration = calculateConcentration();
      page.drawText('CONCENTRATION METRICS', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBold,
      });
      yPosition -= 25;
      
      const concentrationMetrics = [
        `HHI Index: ${concentration.hhi}`,
        `Maximum Single Investor: ${concentration.maxConcentration}%`,
      ];
      
      concentrationMetrics.forEach(metric => {
        page.drawText(metric, {
          x: 70,
          y: yPosition,
          size: 10,
          font: timesRomanFont,
        });
        yPosition -= 18;
      });
      
      yPosition -= 20;
      
      // Investor Allocations
      page.drawText('INVESTOR ALLOCATIONS', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBold,
      });
      yPosition -= 25;
      
      const investorAllocations = getInvestorAllocations();
      
      investorAllocations.forEach(alloc => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }
        
        page.drawText(`${alloc.investor.name}`, {
          x: 70,
          y: yPosition,
          size: 11,
          font: timesRomanBold,
        });
        yPosition -= 18;
        
        page.drawText(`  Exposure: ${formatCurrency(alloc.totalExposure)} (${formatPercent(alloc.totalPercentage)})`, {
          x: 70,
          y: yPosition,
          size: 9,
          font: timesRomanFont,
        });
        yPosition -= 15;
        
        page.drawText(`  Avg Cost: ${alloc.weightedCost.toFixed(2)} bps  |  Tranches: ${alloc.trancheCount}`, {
          x: 70,
          y: yPosition,
          size: 9,
          font: timesRomanFont,
        });
        yPosition -= 15;
        
        alloc.tranches.forEach((tranche: any) => {
          if (yPosition < 100) {
            page = pdfDoc.addPage([595.28, 841.89]);
            yPosition = height - 50;
          }
          
          page.drawText(`    - ${tranche.name}: ${formatCurrency(tranche.size)} @ ${tranche.costBps} bps`, {
            x: 90,
            y: yPosition,
            size: 8,
            font: timesRomanFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPosition -= 14;
        });
        
        yPosition -= 10;
      });
      
      // Notes/Constraints
      if (notes.trim()) {
        if (yPosition < 150) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }
        
        page.drawText('NOTES & CONSTRAINTS', {
          x: 50,
          y: yPosition,
          size: 14,
          font: timesRomanBold,
        });
        yPosition -= 25;
        
        const noteLines = notes.split('\n').slice(0, 10);
        noteLines.forEach(line => {
          if (yPosition < 50) return;
          page.drawText(line.slice(0, 80), {
            x: 70,
            y: yPosition,
            size: 9,
            font: timesRomanFont,
          });
          yPosition -= 15;
        });
      }
      
      // Footer
      const pages = pdfDoc.getPages();
      pages.forEach((pg, idx) => {
        pg.drawText(`Page ${idx + 1} of ${pages.length}`, {
          x: width - 100,
          y: 30,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        pg.drawText('Confidential - For Internal Use Only', {
          x: 50,
          y: 30,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `allocation-term-sheet-${offer.offer_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      toast({
        title: 'PDF Generated',
        description: 'Allocation term sheet has been downloaded.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const concentration = calculateConcentration();
  const investorAllocations = getInvestorAllocations();
  const weightedAvgCost = calculateWeightedAvgCost();
  const allAllocated = allocations.every(a => a.assignedInvestor);

  return (
    <Card className="border-2 border-green-500/20 bg-green-50/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Distribution Summary & Finalisation
            </CardTitle>
            <CardDescription>
              Final allocation overview with investor pricing and concentration metrics
            </CardDescription>
          </div>
          {allAllocated ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(datasetSummary?.total_value || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Exposure</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {weightedAvgCost.toFixed(2)} bps
            </div>
            <div className="text-xs text-muted-foreground">Weighted Avg Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {concentration.hhi}
            </div>
            <div className="text-xs text-muted-foreground">HHI Index</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {concentration.maxConcentration}%
            </div>
            <div className="text-xs text-muted-foreground">Max Concentration</div>
          </div>
        </div>

        {/* Investor Allocations & Pricing */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Investor Allocations & Pricing</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead className="text-right">Exposure</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">Avg Cost (bps)</TableHead>
                  <TableHead className="text-center">Tranches</TableHead>
                  <TableHead>Tranche Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investorAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No investor allocations yet. Assign investors to tranches above.
                    </TableCell>
                  </TableRow>
                ) : (
                  investorAllocations.map((alloc, idx) => (
                    <TableRow key={alloc.investor.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{alloc.investor.name}</div>
                          <div className="text-xs text-muted-foreground">{alloc.investor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(alloc.totalExposure)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPercent(alloc.totalPercentage)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600 font-semibold">
                        {alloc.weightedCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{alloc.trancheCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {alloc.tranches.map((t: any) => (
                            <div key={t.id} className="text-xs text-muted-foreground">
                              {t.name}: {formatCurrency(t.size)} @ {t.costBps} bps
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Concentration Analysis */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Concentration Metrics</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">HHI Index</span>
                    <span className="text-lg font-bold">{concentration.hhi}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {parseInt(concentration.hhi) < 1500 ? '✓ Low concentration' : 
                     parseInt(concentration.hhi) < 2500 ? '⚠ Moderate concentration' : 
                     '⚠ High concentration'}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Single Investor</span>
                    <span className="text-lg font-bold">{concentration.maxConcentration}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {parseFloat(concentration.maxConcentration) < 30 ? '✓ Well diversified' : 
                     parseFloat(concentration.maxConcentration) < 50 ? '⚠ Moderate exposure' : 
                     '⚠ High concentration'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notes & Constraints */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Notes & Constraints</h4>
          <Textarea
            placeholder="Add any notes, constraints, or special conditions for this allocation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Generate PDF Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={generatePDF}
            disabled={investorAllocations.length === 0 || isGenerating}
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating PDF...' : 'Generate Allocation Term Sheet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
