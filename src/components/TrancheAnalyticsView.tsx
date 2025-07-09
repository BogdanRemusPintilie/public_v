
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const highRiskCount = datasetData.filter(loan => (loan.pd || 0) > 0.05).length;
    const riskRatio = 8; // Fixed to 8%

    // Scenario multipliers
    const multipliers = {
      current: { notional: 1, cost: 1, yield: 1 },
      postHedge: { notional: 1, cost: 1.15, yield: 0.95 }, // Higher costs, lower yield due to hedging
      futureUpsize: { notional: 1.5, cost: 0.9, yield: 1.1 }, // Larger size, economies of scale
    };

    const mult = multipliers[scenario];
    
    const adjustedNotional = totalNotional * mult.notional;
    const adjustedYield = averageRate * mult.yield;
    const riskWeightedAssets = adjustedNotional * (riskRatio / 100) * 1.2; // Risk weighting factor
    const internalCapitalRequired = riskWeightedAssets * 0.08; // 8% capital requirement
    const revenue = adjustedNotional * (adjustedYield / 100);
    const adjustedTradeCosts = structure.total_cost * mult.cost;
    const netEarnings = revenue - adjustedTradeCosts;
    const roe = internalCapitalRequired > 0 ? (netEarnings / internalCapitalRequired) * 100 : 0;

    return {
      riskRatio,
      riskWeightedAssets,
      internalCapitalRequired,
      netYield: adjustedYield,
      notionalLent: adjustedNotional,
      revenue,
      tradeCosts: adjustedTradeCosts,
      netEarnings,
      roe,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const AnalyticsSection = ({ title, scenario, icon: Icon }: { 
    title: string; 
    scenario: 'current' | 'postHedge' | 'futureUpsize';
    icon: any;
  }) => {
    const metrics = calculateAnalytics(scenario);

    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Icon className="h-5 w-5 text-indigo-600" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-medium mb-1">Risk Ratio</div>
              <div className="text-xl font-bold text-blue-600">{formatPercentage(metrics.riskRatio)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700 font-medium mb-1">Risk Weighted Assets</div>
              <div className="text-xl font-bold text-purple-600">{formatCurrency(metrics.riskWeightedAssets)}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-700 font-medium mb-1">Internal Capital Required</div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(metrics.internalCapitalRequired)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700 font-medium mb-1">Net Yield</div>
              <div className="text-xl font-bold text-green-600">{formatPercentage(metrics.netYield)}</div>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <div className="text-sm text-cyan-700 font-medium mb-1">Notional Lent</div>
              <div className="text-xl font-bold text-cyan-600">{formatCurrency(metrics.notionalLent)}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-indigo-700 font-medium mb-1">Revenue</div>
              <div className="text-xl font-bold text-indigo-600">{formatCurrency(metrics.revenue)}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-700 font-medium mb-1">Trade Costs</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(metrics.tradeCosts)}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-emerald-700 font-medium mb-1">Net Earnings</div>
              <div className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.netEarnings)}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-700 font-medium mb-1">ROE</div>
              <div className="text-xl font-bold text-yellow-600">{formatPercentage(metrics.roe)}</div>
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
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="current" className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Current</span>
                  </TabsTrigger>
                  <TabsTrigger value="postHedge" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Post Hedge</span>
                  </TabsTrigger>
                  <TabsTrigger value="futureUpsize" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Future Upsize</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="mt-6">
                  <AnalyticsSection 
                    title="Current Analysis" 
                    scenario="current" 
                    icon={Target}
                  />
                </TabsContent>

                <TabsContent value="postHedge" className="mt-6">
                  <AnalyticsSection 
                    title="Post Hedge Analysis" 
                    scenario="postHedge" 
                    icon={Shield}
                  />
                </TabsContent>

                <TabsContent value="futureUpsize" className="mt-6">
                  <AnalyticsSection 
                    title="Future Upsize Analysis" 
                    scenario="futureUpsize" 
                    icon={TrendingUp}
                  />
                </TabsContent>
              </Tabs>

              {/* Summary Comparison */}
              <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Scenario Comparison</CardTitle>
                  <CardDescription>Key metrics across all scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Metric</th>
                          <th className="text-center py-2 px-3">Current</th>
                          <th className="text-center py-2 px-3">Post Hedge</th>
                          <th className="text-center py-2 px-3">Future Upsize</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">ROE</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('current').roe)}</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('postHedge').roe)}</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('futureUpsize').roe)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">Net Earnings</td>
                          <td className="text-center py-2 px-3">{formatCurrency(calculateAnalytics('current').netEarnings)}</td>
                          <td className="text-center py-2 px-3">{formatCurrency(calculateAnalytics('postHedge').netEarnings)}</td>
                          <td className="text-center py-2 px-3">{formatCurrency(calculateAnalytics('futureUpsize').netEarnings)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium">Risk Ratio</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('current').riskRatio)}</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('postHedge').riskRatio)}</td>
                          <td className="text-center py-2 px-3">{formatPercentage(calculateAnalytics('futureUpsize').riskRatio)}</td>
                        </tr>
                      </tbody>
                    </table>
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
