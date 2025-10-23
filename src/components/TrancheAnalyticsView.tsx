
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, Shield, DollarSign, Target, Info, Plus, Trash2, Save, Database, Calculator } from 'lucide-react';
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

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_count: number;
  created_at: string;
}

interface Tranche {
  id: string;
  name: string;
  thickness: number;
  costBps: number;
  hedgedPercentage: number;
}

interface TrancheAnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TrancheStructure | null;
}

const TrancheAnalyticsView = ({ isOpen, onClose, structure }: TrancheAnalyticsViewProps) => {
  console.log('TrancheAnalyticsView rendered', { isOpen, structure });
  const [loading, setLoading] = useState(false);
  const [datasetData, setDatasetData] = useState<any[]>([]);
  const [showRWABreakdown, setShowRWABreakdown] = useState(false);
  const [manualTotalValue, setManualTotalValue] = useState<number | null>(null);
  const [isEditingTotalValue, setIsEditingTotalValue] = useState(false);
  
  // Edit Structure states
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [tranches, setTranches] = useState<Tranche[]>([]);
  const [additionalTransactionCosts, setAdditionalTransactionCosts] = useState<number>(0);
  const [structureName, setStructureName] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasetData = async () => {
    console.log('fetchDatasetData called', { structure, user });
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

      console.log('Dataset data fetched:', { 
        dataLength: data?.length, 
        totalValue: data?.reduce((sum, loan) => sum + loan.opening_balance, 0),
        dataset_name: structure.dataset_name
      });
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

  const fetchDatasets = async () => {
    if (!user) {
      console.log('⚠️ fetchDatasets: No user');
      return;
    }
    
    console.log('🔍 fetchDatasets: Starting fetch');
    try {
      const { data, error } = await supabase.rpc('get_dataset_summaries_optimized');
      
      if (error) {
        console.error('❌ Error fetching datasets:', error);
        return;
      }

      console.log('✅ fetchDatasets: Got data', { 
        count: data?.length, 
        datasets: data?.map(d => ({ name: d.dataset_name, total_value: d.total_value }))
      });
      setDatasets(data || []);
    } catch (error) {
      console.error('❌ Exception in fetchDatasets:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered', { isOpen, hasStructure: !!structure, structureName: structure?.structure_name });
    
    if (isOpen && structure) {
      console.log('📊 Starting data fetch for analytics');
      fetchDatasetData();
      fetchDatasets();
      
      // Initialize edit structure data
      if (structure) {
        setStructureName(structure.structure_name);
        setIsEditing(true);
        
        const loadedTranches = structure.tranches.map((tranche: any, index: number) => ({
          id: tranche.id || (index + 1).toString(),
          name: tranche.name || `Tranche ${index + 1}`,
          thickness: tranche.thickness || 0,
          costBps: tranche.costBps || 0,
          hedgedPercentage: tranche.hedgedPercentage || 0
        }));
        console.log('📋 Loaded tranches:', loadedTranches);
        setTranches(loadedTranches);
        
        if (structure.additional_transaction_costs) {
          setAdditionalTransactionCosts(structure.additional_transaction_costs);
        }
      }
      
      // Reset manual total value when opening
      setManualTotalValue(null);
      setIsEditingTotalValue(false);
    }
  }, [isOpen, structure]);

  const calculatePostHedgeRWA = () => {
    console.log('calculatePostHedgeRWA called', { datasetData, structure, tranches });
    if (!datasetData.length || !structure) return { finalRWA: 0, breakdown: [] };

    // Use manual total value if provided, otherwise use dataset summary total (same as tranche calculations)
    const selectedDataset = datasets.find(d => d.dataset_name === structure.dataset_name);
    const datasetSummaryTotal = selectedDataset?.total_value || 0;
    const datasetRecordsTotal = datasetData.reduce((sum, loan) => sum + loan.opening_balance, 0);
    const totalNotional = manualTotalValue !== null 
      ? manualTotalValue 
      : (datasetSummaryTotal > 0 ? datasetSummaryTotal : datasetRecordsTotal);
    
    // Use current tranches state for dynamic calculations, not structure.tranches
    const currentTranches = tranches.length > 0 ? tranches : structure.tranches;
    console.log('Tranches structure:', currentTranches);
    
    const breakdown = currentTranches.map((tranche: any, index: number) => {
      // Extract thickness and amount from the current tranche state
      const trancheThickness = tranche.thickness || 0;
      const trancheAmount = (trancheThickness / 100) * totalNotional;
      
      // Initial risk weights before Art. 263.5
      let initialRW: number;
      if (index === 0) { // Senior tranche
        initialRW = 20;
      } else if (index === 1) { // Second tranche
        initialRW = 90;
      } else { // Third/Non-rated tranche
        initialRW = 1250;
      }
      
      // Apply Art. 263.5 formulas
      let rwArt2635: number;
      if (index === 0) { // Senior
        rwArt2635 = Math.max(20 * (1 - Math.min(trancheThickness / 100, 0.5)), 20);
      } else if (index === 1) { // Second
        rwArt2635 = Math.max(90 * (1 - Math.min(trancheThickness / 100, 0.5)), 15);
      } else { // Third
        rwArt2635 = Math.max(1250 * (1 - Math.min(trancheThickness / 100, 0.5)), 15);
      }
      
      // RWEA before sharing
      const rweaBeforeSharing = trancheAmount * (rwArt2635 / 100);
      
      // Use hedged percentage from current tranche state as shared percentage
      const sharedPercentage = tranche.hedgedPercentage || 0;
      
      // Final RWEA after sharing
      const finalRWEA = (1 - sharedPercentage / 100) * rweaBeforeSharing;
      
      return {
        trancheName: tranche.name || `Tranche ${index + 1}`,
        amount: trancheAmount,
        thickness: trancheThickness,
        initialRW: initialRW,
        rwArt2635: rwArt2635,
        rweaBeforeSharing: rweaBeforeSharing,
        sharedPercentage: sharedPercentage,
        finalRWEA: finalRWEA
      };
    });
    
    const finalRWA = breakdown.reduce((sum, t) => sum + t.finalRWEA, 0);
    
    return { finalRWA, breakdown };
  };

  const calculateAnalytics = (scenario: 'current' | 'postHedge' | 'futureUpsize'): AnalyticsMetrics => {
    console.log('📊 calculateAnalytics called', { 
      scenario, 
      datasetDataLength: datasetData.length, 
      hasStructure: !!structure,
      structureName: structure?.structure_name,
      tranches: tranches.length
    });
    
    if (!datasetData.length || !structure) {
      console.warn('⚠️ calculateAnalytics returning zeros - missing data', { 
        datasetDataLength: datasetData.length, 
        hasStructure: !!structure 
      });
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

    // Base calculations from dataset - use manual value if provided, otherwise prefer dataset summary
    const selectedDataset = datasets.find(d => d.dataset_name === structure.dataset_name);
    const datasetSummaryTotal = selectedDataset?.total_value || 0;
    const datasetRecordsTotal = datasetData.reduce((sum, loan) => sum + loan.opening_balance, 0);
    const totalNotional = manualTotalValue !== null 
      ? manualTotalValue 
      : (datasetSummaryTotal > 0 ? datasetSummaryTotal : datasetRecordsTotal);
    const averageRate = datasetData.reduce((sum, loan) => sum + loan.interest_rate, 0) / datasetData.length;
    const riskRatio = 8; // Fixed to 8%

    let notionalLent = totalNotional;
    const netYield = averageRate;
    
    let riskWeightedAssets: number;
    let internalCapitalRequired: number;
    
    if (scenario === 'postHedge') {
      const { finalRWA } = calculatePostHedgeRWA();
      riskWeightedAssets = finalRWA;
      internalCapitalRequired = riskWeightedAssets * 0.08;
    } else if (scenario === 'futureUpsize') {
      // Calculate metrics for both current and post hedge scenarios
      const currentRWA = totalNotional; // 100% * Portfolio Protected
      const currentInternalCapitalRequired = currentRWA * 0.08;
      
      const { finalRWA } = calculatePostHedgeRWA();
      const postHedgeInternalCapitalRequired = finalRWA * 0.08;
      
      // Apply the Future Upsize formula for Notional lent:
      // =(1-Internal capital required post hedge/Internal capital required current)*Portfolio protected + Notional lent current
      const ratio = postHedgeInternalCapitalRequired / currentInternalCapitalRequired;
      notionalLent = (1 - ratio) * totalNotional + totalNotional;
      
      // Use current scenario calculations for other metrics
      riskWeightedAssets = currentRWA;
      internalCapitalRequired = currentInternalCapitalRequired;
    } else {
      riskWeightedAssets = totalNotional; // 100% * Portfolio Protected for current scenario
      internalCapitalRequired = riskWeightedAssets * 0.08;
    }
    
    const revenue = notionalLent * (netYield / 100);
    const tradeCosts = scenario === 'current' ? 0 : calculateTotalTransactionCost();
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
    const postHedgeMetrics = calculateAnalytics('postHedge');
    const futureMetrics = calculateAnalytics('futureUpsize');
    // Use manual total value if provided, otherwise get from dataset summary (same as Complete loan tape)
    const selectedDataset = datasets.find(d => d.dataset_name === structure.dataset_name);
    const datasetSummaryTotal = selectedDataset?.total_value || 0;
    const datasetRecordsTotal = datasetData.reduce((sum, loan) => sum + loan.opening_balance, 0);
    
    console.log('Portfolio protected calculation:', { 
      datasetDataLength: datasetData.length, 
      datasetRecordsTotal, 
      datasetSummaryTotal,
      manualTotalValue, 
      structure_dataset_name: structure.dataset_name,
      selectedDataset: selectedDataset ? `Found: ${selectedDataset.dataset_name}` : 'Not found'
    });
    
    // Use the same logic as Complete loan tape - prefer dataset summary total
    const totalNotional = manualTotalValue !== null 
      ? manualTotalValue 
      : (datasetSummaryTotal > 0 ? datasetSummaryTotal : datasetRecordsTotal);

    // Calculate initial capital released: current - post hedge
    const initialCapitalReleased = currentMetrics.internalCapitalRequired - postHedgeMetrics.internalCapitalRequired;

    return {
      portfolioProtected: totalNotional,
      totalCostOfTransaction: calculateTotalTransactionCost(),
      initialCapitalReleased: {
        original: initialCapitalReleased,
        improvement: initialCapitalReleased
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
        improvement: currentMetrics.roe > 0 ? ((futureMetrics.roe / currentMetrics.roe) - 1) * 100 : 0
      }
    };
  };

  const SummarySection = () => {
    const summaryData = getSummaryData();
    if (!summaryData) return null;

    const handleTotalValueEdit = () => {
      setIsEditingTotalValue(true);
    };

    const handleTotalValueSave = (value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setManualTotalValue(numValue);
      }
      setIsEditingTotalValue(false);
    };

    const handleTotalValueCancel = () => {
      setIsEditingTotalValue(false);
    };

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
                {isEditingTotalValue ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Input
                      type="number"
                      defaultValue={summaryData.portfolioProtected.toString()}
                      className="w-32 text-center"
                      onBlur={(e) => handleTotalValueSave(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTotalValueSave(e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                          handleTotalValueCancel();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className="text-xl font-semibold cursor-pointer hover:bg-muted/20 p-1 rounded"
                    onClick={handleTotalValueEdit}
                    title="Click to edit"
                  >
                    {formatCurrency(summaryData.portfolioProtected)}
                  </div>
                )}
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

  // Edit Structure functions
  const addTranche = () => {
    if (tranches.length >= 10) {
      toast({
        title: "Maximum Tranches",
        description: "You can have a maximum of 10 tranches",
        variant: "destructive",
      });
      return;
    }

    const newTranche: Tranche = {
      id: Date.now().toString(),
      name: `Tranche ${tranches.length + 1}`,
      thickness: 0,
      costBps: 0,
      hedgedPercentage: 0
    };
    setTranches([...tranches, newTranche]);
  };

  const removeTranche = (id: string) => {
    if (tranches.length <= 3) {
      toast({
        title: "Minimum Tranches",
        description: "You must have at least 3 tranches",
        variant: "destructive",
      });
      return;
    }
    setTranches(tranches.filter(t => t.id !== id));
  };

  const updateTranche = (id: string, field: keyof Tranche, value: string | number) => {
    setTranches(tranches.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const updateTrancheFromSlider = (id: string, field: keyof Tranche, values: number[]) => {
    setTranches(tranches.map(t => 
      t.id === id ? { ...t, [field]: values[0] } : t
    ));
  };

  const getTotalThickness = () => {
    return tranches.reduce((sum, tranche) => sum + tranche.thickness, 0);
  };

  const getSelectedDataset = () => {
    const found = datasets.find(d => d.dataset_name === structure?.dataset_name);
    console.log('🔍 getSelectedDataset:', { 
      looking_for: structure?.dataset_name, 
      available_datasets: datasets.map(d => d.dataset_name),
      found: found ? `Yes (value: ${found.total_value})` : 'No',
      datasets_count: datasets.length
    });
    return found;
  };

  const calculateTrancheValue = (thickness: number) => {
    const dataset = getSelectedDataset();
    if (!dataset) {
      console.warn('⚠️ calculateTrancheValue: No dataset found', { 
        thickness, 
        structure_dataset: structure?.dataset_name,
        datasets_available: datasets.length 
      });
      return 0;
    }
    // Use manual total value if provided, otherwise use dataset value
    const totalValue = manualTotalValue !== null ? manualTotalValue : dataset.total_value;
    console.log('💰 calculateTrancheValue:', { 
      thickness, 
      dataset_name: dataset.dataset_name,
      dataset_total_value: dataset.total_value,
      manualTotalValue, 
      totalValue,
      calculated: (totalValue * thickness) / 100 
    });
    return (totalValue * thickness) / 100;
  };

  const calculateTrancheCost = (thickness: number, costBps: number, hedgedPercentage: number) => {
    const trancheValue = calculateTrancheValue(thickness);
    const couponCost = (trancheValue * costBps) / 10000;
    return couponCost * (hedgedPercentage / 100);
  };

  const calculateTotalTransactionCost = () => {
    const trancheCosts = tranches.reduce((total, tranche) => {
      return total + calculateTrancheCost(tranche.thickness, tranche.costBps, tranche.hedgedPercentage);
    }, 0);
    return trancheCosts + additionalTransactionCosts;
  };

  const isValidStructure = () => {
    const totalThickness = getTotalThickness();
    return totalThickness === 100 && tranches.length >= 3 && tranches.length <= 10;
  };

  const saveStructure = async () => {
    if (!user || !structure || !structureName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a structure name",
        variant: "destructive",
      });
      return;
    }

    if (!isValidStructure()) {
      toast({
        title: "Invalid Structure",
        description: "Tranche thickness must sum to 100% and you need 3-10 tranches",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dataset = getSelectedDataset();
      const totalCost = calculateTotalTransactionCost();
      // Use manual total value if provided for cost calculations
      const totalValue = manualTotalValue !== null ? manualTotalValue : (dataset?.total_value || 0);
      const weightedAvgCostBps = totalValue > 0 ? (totalCost / totalValue) * 10000 : 0;
      const costPercentage = totalValue > 0 ? (totalCost / totalValue) * 100 : 0;

      const structureData = {
        structure_name: structureName.trim(),
        dataset_name: structure.dataset_name,
        tranches: tranches as any,
        total_cost: totalCost,
        weighted_avg_cost_bps: weightedAvgCostBps,
        cost_percentage: costPercentage,
        additional_transaction_costs: additionalTransactionCosts,
        user_id: user.id
      };

      const { error } = await supabase
        .from('tranche_structures')
        .update(structureData)
        .eq('id', structure.id);

      if (error) {
        console.error('Error saving tranche structure:', error);
        toast({
          title: "Error",
          description: "Failed to save tranche structure",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Structure Updated",
        description: `Tranche structure "${structureName}" has been updated successfully`,
      });

      // Update the structure object with new values for immediate reflection in analytics
      Object.assign(structure, structureData);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to save tranche structure",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const EditStructureSection = () => {
    if (!structure) return null;

    const dataset = getSelectedDataset();
    
    // Show loading state if datasets haven't loaded yet
    if (datasets.length === 0) {
      console.log('⏳ EditStructureSection: Waiting for datasets to load');
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Loading dataset information...</p>
          </CardContent>
        </Card>
      );
    }

    console.log('🎨 EditStructureSection rendering', { 
      dataset: dataset?.dataset_name, 
      total_value: dataset?.total_value,
      tranches_count: tranches.length 
    });

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Tranche Structure</CardTitle>
              <CardDescription>Modify your tranche structure (3-10 tranches, thickness must sum to 100%)</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={getTotalThickness() === 100 ? "default" : "destructive"}
              >
                Total: {getTotalThickness()}%
              </Badge>
              <Button
                onClick={addTranche}
                disabled={tranches.length >= 10}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tranche
              </Button>
              <Button
                onClick={saveStructure}
                disabled={saving || !isValidStructure()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Structure Name */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="structure-name">Structure Name</Label>
                <Input
                  id="structure-name"
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  placeholder="Enter structure name"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="additional-costs">Additional Transaction Costs (€)</Label>
                <Input
                  id="additional-costs"
                  type="number"
                  min="0"
                  value={additionalTransactionCosts}
                  onChange={(e) => setAdditionalTransactionCosts(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Tranches */}
            {tranches.map((tranche, index) => (
              <div key={tranche.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="col-span-2">
                  <Label htmlFor={`name-${tranche.id}`}>Tranche Name</Label>
                  <Input
                    id={`name-${tranche.id}`}
                    value={tranche.name}
                    onChange={(e) => updateTranche(tranche.id, 'name', e.target.value)}
                    placeholder="Tranche name"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`thickness-${tranche.id}`}>Thickness (%)</Label>
                  <div className="space-y-2">
                    <Input
                      id={`thickness-${tranche.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={tranche.thickness}
                      onChange={(e) => updateTranche(tranche.id, 'thickness', parseFloat(e.target.value) || 0)}
                    />
                    <Slider
                      value={[tranche.thickness]}
                      onValueChange={(values) => updateTrancheFromSlider(tranche.id, 'thickness', values)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`cost-${tranche.id}`}>Coupon (BPS)</Label>
                  <div className="space-y-2">
                    <Input
                      id={`cost-${tranche.id}`}
                      type="number"
                      min="0"
                      value={tranche.costBps}
                      onChange={(e) => updateTranche(tranche.id, 'costBps', parseFloat(e.target.value) || 0)}
                    />
                    <Slider
                      value={[tranche.costBps]}
                      onValueChange={(values) => updateTrancheFromSlider(tranche.id, 'costBps', values)}
                      max={1000}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`hedged-${tranche.id}`}>Hedged (%)</Label>
                  <div className="space-y-2">
                    <Input
                      id={`hedged-${tranche.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={tranche.hedgedPercentage}
                      onChange={(e) => updateTranche(tranche.id, 'hedgedPercentage', parseFloat(e.target.value) || 0)}
                    />
                    <Slider
                      value={[tranche.hedgedPercentage]}
                      onValueChange={(values) => updateTrancheFromSlider(tranche.id, 'hedgedPercentage', values)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Label>Tranche Value</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculateTrancheValue(tranche.thickness))}
                  </div>
                  <Label className="text-sm">Tranche Cost</Label>
                  <div className="text-base font-medium text-orange-600">
                    {formatCurrency(calculateTrancheCost(tranche.thickness, tranche.costBps, tranche.hedgedPercentage))}
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTranche(tranche.id)}
                    disabled={tranches.length <= 3}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(calculateTotalTransactionCost())}
                  </div>
                  <div className="text-sm text-gray-600">Total Transaction Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {(() => {
                      const totalValue = manualTotalValue !== null ? manualTotalValue : (dataset?.total_value || 0);
                      return totalValue > 0 ? ((calculateTotalTransactionCost() / totalValue) * 10000).toFixed(0) : 0;
                    })()} BPS
                  </div>
                  <div className="text-sm text-gray-600">Weighted Avg Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {(() => {
                      const totalValue = manualTotalValue !== null ? manualTotalValue : (dataset?.total_value || 0);
                      return totalValue > 0 ? ((calculateTotalTransactionCost() / totalValue) * 100).toFixed(2) : 0;
                    })()}%
                  </div>
                  <div className="text-sm text-gray-600">Cost as % of Total</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!structure) {
    console.log('TrancheAnalyticsView: structure is null, returning null');
    return null;
  }

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

              {/* Edit Structure Section */}
              <EditStructureSection />

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
                                <div className="flex items-center space-x-2">
                                  <div className="text-base">{formatCurrency(metrics.riskWeightedAssets)}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowRWABreakdown(true)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </div>
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

        {/* RWA Breakdown Dialog */}
        <Dialog open={showRWABreakdown} onOpenChange={setShowRWABreakdown}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Risk Weighted Assets Calculation Breakdown</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This calculation follows the three-step process for post hedge RWA calculation:
              </div>
              
              {(() => {
                const { finalRWA, breakdown } = calculatePostHedgeRWA();
                return (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tranche</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Thickness</TableHead>
                          <TableHead>Initial RW</TableHead>
                          <TableHead>RW (Art. 263.5)</TableHead>
                          <TableHead>RWEA Before Sharing</TableHead>
                          <TableHead>Shared %</TableHead>
                          <TableHead>Final RWEA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {breakdown.map((tranche, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{tranche.trancheName}</TableCell>
                            <TableCell>{formatCurrency(tranche.amount)}</TableCell>
                            <TableCell>{(tranche.thickness || 0).toFixed(2)}%</TableCell>
                            <TableCell>{(tranche.initialRW || 0)}%</TableCell>
                            <TableCell>{(tranche.rwArt2635 || 0).toFixed(2)}%</TableCell>
                            <TableCell>{formatCurrency(tranche.rweaBeforeSharing || 0)}</TableCell>
                            <TableCell>{(tranche.sharedPercentage || 0)}%</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(tranche.finalRWEA || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total RWA (Post Hedge):</span>
                        <span className="text-lg font-bold">{formatCurrency(finalRWA || 0)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div><strong>Step 1:</strong> Initial risk weights - Senior: 20%, Second: 90%, Third: 1250%</div>
                      <div><strong>Step 2:</strong> Apply Art. 263.5 formulas based on tranche thickness</div>
                      <div><strong>Step 3:</strong> Calculate final RWEA after sharing: (1 - shared%) × RWEA before sharing</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default TrancheAnalyticsView;
