
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save, Database, Calculator } from 'lucide-react';
import { TrancheStructure, getDatasetSummaries } from '@/utils/supabase';

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_loans: number;
  created_at: string;
}

interface Tranche {
  id: string;
  name: string;
  thickness: number;
  costBps: number;
  hedgedPercentage: number;
}

interface StructureDatasetPageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDatasetName?: string;
  editingStructure?: TrancheStructure | null;
}

const StructureDatasetPage = ({ isOpen, onClose, selectedDatasetName, editingStructure }: StructureDatasetPageProps) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>(selectedDatasetName || '');
  const [tranches, setTranches] = useState<Tranche[]>([
    { id: '1', name: 'Senior', thickness: 70, costBps: 150, hedgedPercentage: 90 },
    { id: '2', name: 'Mezzanine', thickness: 20, costBps: 250, hedgedPercentage: 75 },
    { id: '3', name: 'First Loss', thickness: 10, costBps: 450, hedgedPercentage: 50 }
  ]);
  const [additionalTransactionCosts, setAdditionalTransactionCosts] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [structureName, setStructureName] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const datasetSummaries = await getDatasetSummaries();
      setDatasets(datasetSummaries as DatasetSummary[]);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch datasets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatasets();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedDatasetName) {
      setSelectedDataset(selectedDatasetName);
    }
  }, [selectedDatasetName]);

  useEffect(() => {
    if (editingStructure) {
      setSelectedDataset(editingStructure.dataset_name);
      setStructureName(editingStructure.structure_name);
      setIsEditing(true);
      setEditingStructureId(editingStructure.id);
      
      const loadedTranches = editingStructure.tranches.map((tranche: any, index: number) => ({
        id: tranche.id || (index + 1).toString(),
        name: tranche.name || `Tranche ${index + 1}`,
        thickness: tranche.thickness || 0,
        costBps: tranche.costBps || 0,
        hedgedPercentage: tranche.hedgedPercentage || 0
      }));
      setTranches(loadedTranches);
      
      if (editingStructure.additional_transaction_costs) {
        setAdditionalTransactionCosts(editingStructure.additional_transaction_costs);
      }
    } else {
      setIsEditing(false);
      setEditingStructureId(null);
      setStructureName('');
      setAdditionalTransactionCosts(0);
      setTranches([
        { id: '1', name: 'Senior', thickness: 70, costBps: 150, hedgedPercentage: 90 },
        { id: '2', name: 'Mezzanine', thickness: 20, costBps: 250, hedgedPercentage: 75 },
        { id: '3', name: 'First Loss', thickness: 10, costBps: 450, hedgedPercentage: 50 }
      ]);
    }
  }, [editingStructure]);

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
    return datasets.find(d => d.dataset_name === selectedDataset);
  };

  const calculateTrancheValue = (thickness: number) => {
    const dataset = getSelectedDataset();
    if (!dataset) return 0;
    return (dataset.total_value * thickness) / 100;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const isValidStructure = () => {
    const totalThickness = getTotalThickness();
    return totalThickness === 100 && tranches.length >= 3 && tranches.length <= 10;
  };

  const saveStructure = async () => {
    if (!user || !selectedDataset || !structureName.trim()) {
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
      const denominator = dataset?.total_value ?? 0;
      const weightedAvgCostBps = denominator > 0 ? (totalCost / denominator) * 10000 : 0;
      const costPercentage = denominator > 0 ? (totalCost / denominator) * 100 : 0;

      const structureData = {
        structure_name: structureName.trim(),
        dataset_name: selectedDataset,
        tranches: tranches as any,
        total_cost: Number.isFinite(totalCost) ? totalCost : 0,
        weighted_avg_cost_bps: Number.isFinite(weightedAvgCostBps) ? weightedAvgCostBps : 0,
        cost_percentage: Number.isFinite(costPercentage) ? costPercentage : 0,
        additional_transaction_costs: Number.isFinite(additionalTransactionCosts) ? additionalTransactionCosts : 0,
        user_id: user.id
      };

      let error;
      
      if (isEditing && editingStructureId) {
        const { error: updateError } = await supabase
          .from('tranche_structures')
          .update(structureData)
          .eq('id', editingStructureId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tranche_structures')
          .insert(structureData);
        error = insertError;
      }

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
        title: isEditing ? "Structure Updated" : "Structure Saved",
        description: `Tranche structure "${structureName}" has been ${isEditing ? 'updated' : 'saved'} successfully`,
      });

      setShowSaveDialog(false);
      setStructureName('');
      onClose();
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

  const handleSaveClick = () => {
    if (!selectedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select a dataset first",
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

    if (isEditing) {
      saveStructure();
    } else {
      setShowSaveDialog(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center space-x-2">
                <Database className="h-6 w-6 text-indigo-600" />
                <span>{isEditing ? `Edit Structure: ${structureName}` : 'Structure Dataset'}</span>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dataset Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Dataset</CardTitle>
                <CardDescription>Choose the dataset you want to create a tranche structure for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedDataset} onValueChange={setSelectedDataset} disabled={isEditing}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a dataset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.dataset_name} value={dataset.dataset_name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{dataset.dataset_name}</span>
                            <Badge variant="outline" className="ml-2">
                              {formatCurrency(dataset.total_value)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDataset && getSelectedDataset() && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(getSelectedDataset()!.total_value)}
                        </div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {getSelectedDataset()!.record_count}
                        </div>
                        <div className="text-sm text-gray-600">Total Loans</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {getSelectedDataset()!.avg_interest_rate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {getSelectedDataset()!.high_risk_loans}
                        </div>
                        <div className="text-sm text-gray-600">High Risk</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tranche Structure */}
            {selectedDataset && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tranche Structure</CardTitle>
                      <CardDescription>Design your tranche structure (3-10 tranches, thickness must sum to 100%)</CardDescription>
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                          <div className="text-sm font-medium text-green-600 mt-1">
                            {formatCurrency(calculateTrancheValue(tranche.thickness))}
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <Label>Tranche Cost</Label>
                          <div className="text-sm font-medium text-orange-600 mt-1">
                            {formatCurrency(calculateTrancheCost(tranche.thickness, tranche.costBps, tranche.hedgedPercentage))}
                          </div>
                        </div>
                        
                        <div className="col-span-1 flex items-end">
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
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveClick}
                      disabled={!isValidStructure()}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update Structure' : 'Save Structure'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Transaction Costs */}
            {selectedDataset && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Calculator className="h-5 w-5" />
                    <span>Total Transaction Costs</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Summary of all costs for this transaction including tranches and additional costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Additional Transaction Costs Input */}
                    <div className="p-4 bg-white rounded-lg border">
                      <Label htmlFor="additional-costs" className="text-base font-medium">
                        Additional Transaction Costs (Lawyers, Advisors, etc.)
                      </Label>
                      <div className="space-y-2 mt-2">
                        <Input
                          id="additional-costs"
                          type="number"
                          min="0"
                          step="1000"
                          value={additionalTransactionCosts}
                          onChange={(e) => setAdditionalTransactionCosts(parseFloat(e.target.value) || 0)}
                          placeholder="Enter additional costs..."
                        />
                        <Slider
                          value={[additionalTransactionCosts]}
                          onValueChange={(values) => setAdditionalTransactionCosts(values[0])}
                          max={1000000}
                          min={0}
                          step={1000}
                          className="w-full"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter costs for lawyers, advisors, and other transaction-related expenses
                      </p>
                    </div>

                    {/* Cost Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-xl font-bold text-blue-600">
                          {formatCurrency(tranches.reduce((total, tranche) => {
                            return total + calculateTrancheCost(tranche.thickness, tranche.costBps, tranche.hedgedPercentage);
                          }, 0))}
                        </div>
                        <div className="text-sm text-gray-600">Tranche Costs</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-xl font-bold text-orange-600">
                          {formatCurrency(additionalTransactionCosts)}
                        </div>
                        <div className="text-sm text-gray-600">Additional Costs</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculateTotalTransactionCost())}
                        </div>
                        <div className="text-sm text-gray-600">Total Cost</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-xl font-bold text-purple-600">
                          {getSelectedDataset() ? ((calculateTotalTransactionCost() / getSelectedDataset()!.total_value) * 100).toFixed(2) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Cost as % of Total</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Structure Name Dialog - Only show when creating new structure */}
      <Dialog open={showSaveDialog && !isEditing} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Tranche Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="structure-name">Structure Name</Label>
              <Input
                id="structure-name"
                value={structureName}
                onChange={(e) => setStructureName(e.target.value)}
                placeholder="Enter structure name..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveStructure} 
                disabled={!structureName.trim() || saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? 'Saving...' : 'Save Structure'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StructureDatasetPage;
