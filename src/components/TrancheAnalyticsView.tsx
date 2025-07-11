
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, Shield, DollarSign, Target } from 'lucide-react';
import { TrancheStructure } from '@/utils/supabase';

interface AnalyticsMetrics {
  riskRatio: number;
  riskWeightedAssets: number;
  internalCapitalRequired: number;
  netYield: number;
  notionalLent: number;
  revenue: number;
  tradeCosts: number;
  netEarnings: number;
  roe: number;
}

interface TrancheAnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TrancheStructure | null;
}

const TrancheAnalyticsView = ({ isOpen, onClose, structure }: TrancheAnalyticsViewProps) => {
  const [loading, setLoading] = useState(false);
  const [datasetData, setDatasetData] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasetData = async () => {
    if (!structure || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_data')
        .select('*')
        .eq('dataset_name', structure.dataset_name);
      
      if (error) {
        console.error('Error fetching dataset data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dataset data for analytics",
          variant: "destructive",
        });
        return;
      }

      setDatasetData(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dataset data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && structure) {
      fetchDatasetData();
    }
  }, [isOpen, structure]);

  const calculateAnalytics = (scenario: 'current' | 'postHedge' | 'futureUpsize'): AnalyticsMetrics => {
    if (!datasetData.length || !structure) {
      return {
        riskRatio: 0,
        riskWeightedAssets: 0,
        internalCapitalRequired: 0,
        netYield: 0,
        notionalLent: 0,
        revenue: 0,
        tradeCosts: 0,
        netEarnings: 0,
        roe: 0,
      };
    }

    // Base calculations from dataset
    const totalNotional = datasetData.reduce((sum, loan) => sum + loan.opening_balance, 0);
    const averageRate = datasetData.reduce((sum, loan) => sum + loan.interest_rate, 0) / datasetData.length;
    const riskRatio = 8; // Fixed to 8%

    // No multipliers - same calculations for all scenarios
    const notionalLent = totalNotional;
    const netYield = averageRate; // Same for all scenarios
    const riskWeightedAssets = totalNotional; // 100% * Portfolio Protected
    const internalCapitalRequired = riskWeightedAssets * 0.08; // 8% capital requirement
    const revenue = notionalLent * (netYield / 100);
    const tradeCosts = structure.total_cost;
    const netEarnings = revenue - tradeCosts;
    const roe = internalCapitalRequired > 0 ? (netEarnings / internalCapitalRequired) * 100 : 0;

    return {
      riskRatio,
      riskWeightedAssets,
      internalCapitalRequired,
      netYield,
      notionalLent,
      revenue,
      tradeCosts,
      netEarnings,
      roe,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyDetailed = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getSummaryData = () => {
    if (!datasetData.length || !structure) return null;

    const currentMetrics = calculateAnalytics('current');
    const futureMetrics = calculateAnalytics('futureUpsize');
    const totalNotional = datasetData.reduce((sum, loan) => sum + loan.opening_balance, 0);

    return {
      portfolioProtected: totalNotional,
      totalCostOfTransaction: structure.total_cost,
      initialCapitalReleased: {
        original: currentMetrics.internalCapitalRequired,
        improvement: futureMetrics.internalCapitalRequired
      },
      newLoanAmount: {
        original: futureMetrics.notionalLent,
        improvement: futureMetrics.notionalLent - currentMetrics.notionalLent
      },
      newRevenue: {
        original: futureMetrics.revenue,
        improvement: futureMetrics.revenue - currentMetrics.revenue
      },
      newROE: {
        original: futureMetrics.roe,
        improvement: currentMetrics.roe
      }
    };
  };

  const SummarySection = () => {
    const summaryData = getSummaryData();
    if (!summaryData) return null;

    return (
      <Card className="border border-blue-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="text-center p-4">
                <div className="text-sm text-muted-foreground mb-1">Portfolio protected</div>
                <div className="text-xl font-semibold">{formatCurrency(summaryData.portfolioProtected)}</div>
              </div>
              <div className="text-center p-4">
                <div className="text-sm text-muted-foreground mb-1">Total cost of transaction</div>
                <div className="text-xl font-semibold">{formatCurrencyDetailed(summaryData.totalCostOfTransaction)}</div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center text-sm font-medium text-muted-foreground">
                  {/* Empty cell for spacing */}
                </div>
                <div className="text-center text-sm font-medium text-muted-foreground">
                  Original
                </div>
                <div className="text-center text-sm font-medium text-blue-600">
                  Improvement
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-b">
                <div className="text-sm">Initial capital released</div>
                <div className="text-right">{formatCurrency(summaryData.initialCapitalReleased.original)}</div>
                <div className="text-right text-blue-600">{formatCurrency(summaryData.initialCapitalReleased.improvement)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-b">
                <div className="text-sm">New loan amount</div>
                <div className="text-right">{formatCurrency(summaryData.newLoanAmount.original)}</div>
                <div className="text-right text-blue-600">{formatCurrency(summaryData.newLoanAmount.improvement)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-b">
                <div className="text-sm">New revenue</div>
                <div className="text-right">{formatCurrencyDetailed(summaryData.newRevenue.original)}</div>
                <div className="text-right text-blue-600">{formatCurrencyDetailed(summaryData.newRevenue.improvement)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2">
                <div className="text-sm">New ROE</div>
                <div className="text-right">{formatPercentage(summaryData.newROE.original)}</div>
                <div className="text-right text-blue-600">{formatPercentage(summaryData.newROE.improvement)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!structure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <DialogTitle className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <span>Analytics: {structure.structure_name}</span>
            </DialogTitle>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline">Dataset: {structure.dataset_name}</Badge>
            <Badge variant="outline">{structure.tranches.length} Tranches</Badge>
            <Badge variant="outline">Total Cost: {formatCurrency(structure.total_cost)}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Summary Section */}
              <SummarySection />

              {/* Analytics Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                    {/* Current */}
                    <div className="border-r border-border">
                      <div className="p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg">Current</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {(() => {
                          const metrics = calculateAnalytics('current');
                          return (
                            <>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk ratio</div>
                                <div className="text-base">{formatPercentage(metrics.riskRatio)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk weighted assets</div>
                                <div className="text-base">{formatCurrency(metrics.riskWeightedAssets)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Internal capital required</div>
                                <div className="text-base">{formatCurrency(metrics.internalCapitalRequired)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net yield</div>
                                <div className="text-base">{formatPercentage(metrics.netYield)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Notional lent</div>
                                <div className="text-base">{formatCurrency(metrics.notionalLent)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Revenue</div>
                                <div className="text-base">{formatCurrency(metrics.revenue)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Trade costs</div>
                                <div className="text-base">{formatCurrency(metrics.tradeCosts)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net earnings</div>
                                <div className="text-base">{formatCurrency(metrics.netEarnings)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">ROE</div>
                                <div className="text-base">{formatPercentage(metrics.roe)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Post hedge, no upsize */}
                    <div className="border-r border-border">
                      <div className="p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg">Post hedge, no upsize</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {(() => {
                          const metrics = calculateAnalytics('postHedge');
                          return (
                            <>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk ratio</div>
                                <div className="text-base">{formatPercentage(metrics.riskRatio)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk weighted assets</div>
                                <div className="text-base">{formatCurrency(metrics.riskWeightedAssets)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Internal capital required</div>
                                <div className="text-base">{formatCurrency(metrics.internalCapitalRequired)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net yield</div>
                                <div className="text-base">{formatPercentage(metrics.netYield)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Notional lent</div>
                                <div className="text-base">{formatCurrency(metrics.notionalLent)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Revenue</div>
                                <div className="text-base">{formatCurrency(metrics.revenue)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Trade costs</div>
                                <div className="text-base">{formatCurrency(metrics.tradeCosts)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net earnings</div>
                                <div className="text-base">{formatCurrency(metrics.netEarnings)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">ROE</div>
                                <div className="text-base">{formatPercentage(metrics.roe)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Future upsize */}
                    <div>
                      <div className="p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg">Future upsize</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {(() => {
                          const metrics = calculateAnalytics('futureUpsize');
                          return (
                            <>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk ratio</div>
                                <div className="text-base">{formatPercentage(metrics.riskRatio)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Risk weighted assets</div>
                                <div className="text-base">{formatCurrency(metrics.riskWeightedAssets)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Internal capital required</div>
                                <div className="text-base">{formatCurrency(metrics.internalCapitalRequired)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net yield</div>
                                <div className="text-base">{formatPercentage(metrics.netYield)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Notional lent</div>
                                <div className="text-base">{formatCurrency(metrics.notionalLent)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Revenue</div>
                                <div className="text-base">{formatCurrency(metrics.revenue)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Trade costs</div>
                                <div className="text-base">{formatCurrency(metrics.tradeCosts)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Net earnings</div>
                                <div className="text-base">{formatCurrency(metrics.netEarnings)}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">ROE</div>
                                <div className="text-base">{formatPercentage(metrics.roe)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrancheAnalyticsView;
