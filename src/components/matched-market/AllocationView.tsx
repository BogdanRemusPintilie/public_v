import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AllocationViewProps {
  offer: any;
  datasetSummary: any;
  offerResponses: any[];
  userType: string;
}

interface TrancheAllocation {
  id: string;
  name: string;
  thickness: number;
  size: number;
  rating: string;
  costBps: number;
  attachmentPoint: number;
  detachmentPoint: number;
  assignedInvestor: string | null;
  seniority: number;
}

export function AllocationView({ offer, datasetSummary, offerResponses, userType }: AllocationViewProps) {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<TrancheAllocation[]>([]);
  const [investors, setInvestors] = useState<{ id: string; name: string; email: string }[]>([]);

  console.log('🎯 AllocationView - Props:', {
    hasOffer: !!offer,
    hasStructure: !!offer?.structure,
    hasTranches: !!offer?.structure?.tranches,
    tranchesCount: offer?.structure?.tranches?.length,
    hasDatasetSummary: !!datasetSummary,
    datasetSummaryValue: datasetSummary?.total_value,
    offerResponsesCount: offerResponses?.length,
  });

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
    
    console.log('💰 Calculating allocations:', {
      totalValue,
      tranchesCount: tranches?.length,
      tranches: tranches,
    });
    
    if (!tranches || tranches.length === 0) {
      console.warn('⚠️ No tranches available to calculate');
      return;
    }
    
    // Sort tranches by thickness (higher thickness = more senior)
    const sortedTranches = [...tranches].sort((a: any, b: any) => b.thickness - a.thickness);
    
    let cumulativeAttachment = 0;
    
    const allocationData: TrancheAllocation[] = sortedTranches.map((tranche: any, index: number) => {
      const size = (totalValue * tranche.thickness) / 100;
      const detachmentPoint = cumulativeAttachment + tranche.thickness;
      
      // Extract rating from tranche name if available (e.g., "Senior AAA" -> "AAA")
      const ratingMatch = tranche.name.match(/\b(AAA|AA|A|BBB|BB|B|CCC|CC|C)\b/i);
      const rating = ratingMatch ? ratingMatch[0].toUpperCase() : 'Unrated';
      
      const allocation: TrancheAllocation = {
        id: tranche.id,
        name: tranche.name,
        thickness: tranche.thickness,
        size: size,
        rating: rating,
        costBps: tranche.costBps || 0,
        attachmentPoint: cumulativeAttachment,
        detachmentPoint: detachmentPoint,
        assignedInvestor: null,
        seniority: index,
      };
      
      cumulativeAttachment = detachmentPoint;
      return allocation;
    });
    
    console.log('✅ Allocations calculated:', allocationData);
    setAllocations(allocationData);
  };

  const loadInvestors = async () => {
    // Get unique investor profiles from responses
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

  const handleInvestorAssignment = (trancheId: string, investorId: string) => {
    setAllocations(prev => 
      prev.map(a => 
        a.id === trancheId 
          ? { ...a, assignedInvestor: investorId === 'unassigned' ? null : investorId }
          : a
      )
    );
    
    toast({
      title: 'Investor Assigned',
      description: 'Tranche allocation has been updated.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: 'compact',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTrancheColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
  };

  // Prepare chart data - reverse order so senior is on bottom
  const chartData = [...allocations].reverse().map((alloc, idx) => {
    const investor = investors.find(i => i.id === alloc.assignedInvestor);
    return {
      name: alloc.name,
      value: alloc.thickness,
      fill: getTrancheColor(allocations.length - 1 - idx),
      investor: investor?.name || 'Unassigned',
    };
  });

  const totalAllocated = allocations.filter(a => a.assignedInvestor).length;
  const totalTranches = allocations.length;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tranche Allocation
            </CardTitle>
            <CardDescription>
              Capital structure distribution and investor assignments
            </CardDescription>
          </div>
          <Badge variant={totalAllocated === totalTranches ? 'default' : 'secondary'}>
            {totalAllocated} of {totalTranches} Allocated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(datasetSummary?.total_value || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Exposure</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalTranches}</div>
            <div className="text-sm text-muted-foreground">Tranches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{investors.length}</div>
            <div className="text-sm text-muted-foreground">Interested Investors</div>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Capital Structure
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${value}% (${formatCurrency((datasetSummary?.total_value || 0) * value / 100)})`,
                  props.payload.investor
                ]}
              />
              <Legend />
              <Bar dataKey="value" name="Thickness (%)" stackId="a">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Table */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Tranche Details & Investor Allocation</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tranche</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Attachment</TableHead>
                  <TableHead className="text-right">Detachment</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Assigned Investor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((alloc, idx) => (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: getTrancheColor(idx) }}
                        />
                        {alloc.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(alloc.size)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(alloc.thickness)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{alloc.rating}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(alloc.attachmentPoint)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(alloc.detachmentPoint)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {alloc.costBps} bps
                    </TableCell>
                    <TableCell>
                      {userType === 'investor' ? (
                        alloc.assignedInvestor ? (
                          <span className="text-sm">
                            {investors.find(i => i.id === alloc.assignedInvestor)?.name || 'Assigned'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )
                      ) : (
                        <Select
                          value={alloc.assignedInvestor || 'unassigned'}
                          onValueChange={(value) => handleInvestorAssignment(alloc.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select investor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {investors.map(inv => (
                              <SelectItem key={inv.id} value={inv.id}>
                                {inv.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Allocation Summary by Investor */}
        {investors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Allocation Summary by Investor</h4>
            <div className="grid gap-2">
              {investors.map(investor => {
                const investorTranches = allocations.filter(a => a.assignedInvestor === investor.id);
                const totalExposure = investorTranches.reduce((sum, t) => sum + t.size, 0);
                const totalPercentage = investorTranches.reduce((sum, t) => sum + t.thickness, 0);
                
                if (investorTranches.length === 0) return null;
                
                return (
                  <div key={investor.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{investor.name}</p>
                      <p className="text-xs text-muted-foreground">{investor.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(totalExposure)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercent(totalPercentage)} • {investorTranches.length} tranche{investorTranches.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
