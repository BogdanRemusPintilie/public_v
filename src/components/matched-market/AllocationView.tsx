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
  allocations?: TrancheAllocation[];
  onAllocationsChange?: (allocations: TrancheAllocation[]) => void;
}

interface SubAllocation {
  id: string;
  investorId: string;
  percentage: number;
  amount: number;
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
  isForSale: boolean;
  subAllocations: SubAllocation[];
  seniority: number;
}

export function AllocationView({ 
  offer, 
  datasetSummary, 
  offerResponses, 
  userType,
  allocations: externalAllocations,
  onAllocationsChange
}: AllocationViewProps) {
  const { toast } = useToast();
  const [internalAllocations, setInternalAllocations] = useState<TrancheAllocation[]>([]);
  const [investors, setInvestors] = useState<{ id: string; name: string; email: string }[]>([]);

  // Use external allocations if provided, otherwise use internal state
  const allocations = externalAllocations || internalAllocations;
  const setAllocations = (newAllocations: TrancheAllocation[] | ((prev: TrancheAllocation[]) => TrancheAllocation[])) => {
    const updatedAllocations = typeof newAllocations === 'function' 
      ? newAllocations(allocations) 
      : newAllocations;
    
    if (onAllocationsChange) {
      onAllocationsChange(updatedAllocations);
    } else {
      setInternalAllocations(updatedAllocations);
    }
  };

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
      
      // Auto-detect mezz tranches (BBB, BB, B ratings) as for sale
      const isMezz = ['BBB', 'BB', 'B', 'A'].includes(rating);
      
      const allocation: TrancheAllocation = {
        id: tranche.id,
        name: tranche.name,
        thickness: tranche.thickness,
        size: size,
        rating: rating,
        costBps: tranche.costBps || 0,
        attachmentPoint: cumulativeAttachment,
        detachmentPoint: detachmentPoint,
        isForSale: isMezz,
        subAllocations: [],
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

  const handleToggleForSale = (trancheId: string) => {
    setAllocations(prev => 
      prev.map(a => 
        a.id === trancheId 
          ? { ...a, isForSale: !a.isForSale, subAllocations: [] }
          : a
      )
    );
  };

  const handleAddSubAllocation = (trancheId: string) => {
    const tranche = allocations.find(a => a.id === trancheId);
    if (!tranche) return;

    const currentTotal = tranche.subAllocations.reduce((sum, sub) => sum + sub.percentage, 0);
    if (currentTotal >= 100) {
      toast({
        title: 'Cannot Add More',
        description: 'Tranche is already 100% allocated.',
        variant: 'destructive',
      });
      return;
    }

    const newSubAllocation: SubAllocation = {
      id: crypto.randomUUID(),
      investorId: '',
      percentage: Math.min(100 - currentTotal, 25),
      amount: 0,
    };

    setAllocations(prev => 
      prev.map(a => {
        if (a.id === trancheId) {
          const updatedSubs = [...a.subAllocations, newSubAllocation];
          return {
            ...a,
            subAllocations: updatedSubs.map(sub => ({
              ...sub,
              amount: (a.size * sub.percentage) / 100,
            })),
          };
        }
        return a;
      })
    );
  };

  const handleUpdateSubAllocation = (
    trancheId: string, 
    subId: string, 
    field: 'investorId' | 'percentage',
    value: string | number
  ) => {
    setAllocations(prev => 
      prev.map(a => {
        if (a.id === trancheId) {
          const updatedSubs = a.subAllocations.map(sub => {
            if (sub.id === subId) {
              const updated = { ...sub, [field]: value };
              if (field === 'percentage') {
                updated.amount = (a.size * Number(value)) / 100;
              }
              return updated;
            }
            return sub;
          });
          return { ...a, subAllocations: updatedSubs };
        }
        return a;
      })
    );
  };

  const handleRemoveSubAllocation = (trancheId: string, subId: string) => {
    setAllocations(prev => 
      prev.map(a => 
        a.id === trancheId 
          ? { ...a, subAllocations: a.subAllocations.filter(sub => sub.id !== subId) }
          : a
      )
    );
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
    // For display, show first assigned investor or 'Unassigned'
    const firstAssignment = alloc.subAllocations?.[0];
    const investor = firstAssignment ? investors.find(i => i.id === firstAssignment.investorId) : null;
    return {
      name: alloc.name,
      value: alloc.thickness,
      fill: getTrancheColor(allocations.length - 1 - idx),
      investor: alloc.isForSale 
        ? (investor?.name || `${alloc.subAllocations?.length || 0} investors`)
        : 'Not for sale',
    };
  });

  const tranchesForSale = allocations.filter(a => a.isForSale);
  const fullyAllocatedCount = tranchesForSale.filter(a => {
    const totalPercentage = a.subAllocations.reduce((sum, sub) => sum + sub.percentage, 0);
    return totalPercentage === 100 && a.subAllocations.every(sub => sub.investorId);
  }).length;

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
          <Badge variant={fullyAllocatedCount === tranchesForSale.length && tranchesForSale.length > 0 ? 'default' : 'secondary'}>
            {fullyAllocatedCount} of {tranchesForSale.length} Tranches Fully Allocated
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
            <div className="text-2xl font-bold text-primary">{tranchesForSale.length}</div>
            <div className="text-sm text-muted-foreground">Tranches For Sale</div>
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
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Tranche Details & Investor Allocation</h4>
          
          {allocations.map((alloc, idx) => {
            const totalAllocated = alloc.subAllocations.reduce((sum, sub) => sum + sub.percentage, 0);
            const remaining = 100 - totalAllocated;
            
            return (
              <div key={alloc.id} className="border rounded-lg overflow-hidden">
                {/* Tranche Header */}
                <div className="bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: getTrancheColor(idx) }}
                      />
                      <div>
                        <h5 className="font-semibold">{alloc.name}</h5>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span>{formatCurrency(alloc.size)}</span>
                          <span>•</span>
                          <span>{formatPercent(alloc.thickness)} of total</span>
                          <span>•</span>
                          <Badge variant="outline" className="font-mono">{alloc.rating}</Badge>
                          <span>•</span>
                          <span className="font-mono">{alloc.costBps} bps</span>
                        </div>
                      </div>
                    </div>
                    
                    {userType !== 'investor' && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">For Sale</label>
                        <input
                          type="checkbox"
                          checked={alloc.isForSale}
                          onChange={() => handleToggleForSale(alloc.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-allocations */}
                {alloc.isForSale && (
                  <div className="p-4 space-y-3">
                    {alloc.subAllocations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No allocations yet. Add investors below.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {alloc.subAllocations.map((sub, subIdx) => (
                          <div key={sub.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm font-medium w-8">{subIdx + 1}.</span>
                            
                            {userType === 'investor' ? (
                              <>
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {investors.find(i => i.id === sub.investorId)?.name || 'Unknown'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-sm font-semibold">{sub.percentage}%</div>
                                  <div className="text-xs text-muted-foreground">{formatCurrency(sub.amount)}</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <Select
                                  value={sub.investorId || 'unassigned'}
                                  onValueChange={(value) => handleUpdateSubAllocation(alloc.id, sub.id, 'investorId', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select investor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Select investor...</SelectItem>
                                    {investors.map(inv => (
                                      <SelectItem key={inv.id} value={inv.id}>
                                        {inv.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={remaining + sub.percentage}
                                    step="0.1"
                                    value={sub.percentage}
                                    onChange={(e) => handleUpdateSubAllocation(
                                      alloc.id, 
                                      sub.id, 
                                      'percentage', 
                                      Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                                    )}
                                    className="w-20 px-2 py-1 text-sm border rounded text-right font-mono"
                                  />
                                  <span className="text-sm">%</span>
                                </div>
                                
                                <div className="text-right w-32">
                                  <div className="text-sm font-mono">{formatCurrency(sub.amount)}</div>
                                </div>
                                
                                <button
                                  onClick={() => handleRemoveSubAllocation(alloc.id, sub.id)}
                                  className="text-destructive hover:text-destructive/80 text-sm"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {userType !== 'investor' && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <button
                          onClick={() => handleAddSubAllocation(alloc.id)}
                          disabled={remaining === 0}
                          className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed"
                        >
                          + Add Investor Allocation
                        </button>
                        <div className="text-sm">
                          <span className="font-medium">Allocated: </span>
                          <span className={totalAllocated === 100 ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>
                            {totalAllocated.toFixed(1)}%
                          </span>
                          {remaining > 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({remaining.toFixed(1)}% remaining)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Allocation Summary by Investor */}
        {investors.length > 0 && tranchesForSale.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Allocation Summary by Investor</h4>
            <div className="grid gap-2">
              {investors.map(investor => {
                let totalExposure = 0;
                const allocDetails: Array<{trancheName: string, amount: number, percentage: number}> = [];
                
                allocations.forEach(alloc => {
                  if (!alloc.isForSale) return;
                  
                  alloc.subAllocations.forEach(sub => {
                    if (sub.investorId === investor.id) {
                      totalExposure += sub.amount;
                      allocDetails.push({
                        trancheName: alloc.name,
                        amount: sub.amount,
                        percentage: sub.percentage,
                      });
                    }
                  });
                });
                
                if (allocDetails.length === 0) return null;
                
                return (
                  <div key={investor.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{investor.name}</p>
                        <p className="text-xs text-muted-foreground">{investor.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(totalExposure)}</p>
                        <p className="text-sm text-muted-foreground">
                          {allocDetails.length} allocation{allocDetails.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 pl-4 border-l-2 border-primary/20">
                      {allocDetails.map((detail, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                          <span>{detail.trancheName}</span>
                          <span className="font-mono">{detail.percentage}% • {formatCurrency(detail.amount)}</span>
                        </div>
                      ))}
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
