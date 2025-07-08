
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database, BarChart3, Settings, TrendingUp, Layers, FileText, Trash2 } from 'lucide-react';
import StructureDatasetPage from './StructureDatasetPage';

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_count: number;
  created_at: string;
}

interface TrancheStructure {
  id: string;
  structure_name: string;
  dataset_name: string;
  tranches: any[];
  total_cost: number;
  weighted_avg_cost_bps: number;
  cost_percentage: number;
  created_at: string;
}

interface TrancheAnalysisDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrancheAnalysisDashboard = ({ isOpen, onClose }: TrancheAnalysisDashboardProps) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [trancheStructures, setTrancheStructures] = useState<TrancheStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStructureDataset, setShowStructureDataset] = useState(false);
  const [selectedDatasetForStructure, setSelectedDatasetForStructure] = useState<string>('');
  const [editingStructure, setEditingStructure] = useState<TrancheStructure | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_dataset_summaries');
      
      if (error) {
        console.error('Error fetching datasets:', error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
        return;
      }

      setDatasets(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch datasets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrancheStructures = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tranche_structures')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tranche structures:', error);
        toast({
          title: "Error",
          description: "Failed to fetch tranche structures",
          variant: "destructive",
        });
        return;
      }

      // Cast the Json tranches back to array type
      const structures = (data || []).map(item => ({
        ...item,
        tranches: item.tranches as any[]
      }));
      setTrancheStructures(structures);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tranche structures",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatasets();
      fetchTrancheStructures();
    }
  }, [isOpen, user]);

  const handleStructureDataset = (datasetName: string) => {
    setSelectedDatasetForStructure(datasetName);
    setEditingStructure(null);
    setShowStructureDataset(true);
  };

  const handleEditStructure = (structure: TrancheStructure) => {
    setSelectedDatasetForStructure(structure.dataset_name);
    setEditingStructure(structure);
    setShowStructureDataset(true);
  };

  const handleManageStructure = (datasetName: string) => {
    toast({
      title: "Manage Structure",
      description: `Opening structure management for ${datasetName}`,
    });
    // TODO: Implement structure management logic
  };

  const handleDeleteStructure = async (structureId: string, structureName: string) => {
    try {
      const { error } = await supabase
        .from('tranche_structures')
        .delete()
        .eq('id', structureId);

      if (error) {
        console.error('Error deleting tranche structure:', error);
        toast({
          title: "Error",
          description: "Failed to delete structure",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Structure Deleted",
        description: `"${structureName}" has been deleted`,
      });

      // Refresh the structures list
      fetchTrancheStructures();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete structure",
        variant: "destructive",
      });
    }
  };

  const handleCloseStructureDataset = () => {
    setShowStructureDataset(false);
    setSelectedDatasetForStructure('');
    setEditingStructure(null);
    // Refresh structures when returning from structure creation
    fetchTrancheStructures();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Layers className="h-6 w-6 text-indigo-600" />
              <span>Tranche and Analysis Dashboard</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Available Datasets Section */}
                {datasets.length > 0 && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Datasets</h3>
                      <p className="text-gray-600">Select a dataset to structure or manage its tranches</p>
                    </div>

                    <div className="grid gap-4">
                      {datasets.map((dataset) => (
                        <Card key={dataset.dataset_name} className="border-0 shadow-md hover:shadow-lg transition-all duration-200">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                                  {dataset.dataset_name}
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                  Created on {formatDate(dataset.created_at)}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="ml-4">
                                {dataset.record_count} loans
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">
                                  {formatCurrency(dataset.total_value)}
                                </div>
                                <div className="text-sm text-blue-700">Total Value</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">
                                  {dataset.avg_interest_rate.toFixed(2)}%
                                </div>
                                <div className="text-sm text-green-700">Avg Rate</div>
                              </div>
                              <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <div className="text-lg font-bold text-orange-600">
                                  {dataset.high_risk_count}
                                </div>
                                <div className="text-sm text-orange-700">High Risk</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">
                                  {((dataset.high_risk_count / dataset.record_count) * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-purple-700">Risk Ratio</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t">
                              <Button
                                onClick={() => handleStructureDataset(dataset.dataset_name)}
                                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span>Structure Dataset</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleManageStructure(dataset.dataset_name)}
                                className="flex items-center space-x-2 border-indigo-200 hover:bg-indigo-50"
                              >
                                <Settings className="h-4 w-4" />
                                <span>Manage Structure</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                              >
                                <TrendingUp className="h-4 w-4" />
                                <span>View Analytics</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Tranche Structures Section */}
                {trancheStructures.length > 0 && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Tranche Structures</h3>
                      <p className="text-gray-600">Your previously saved tranche structures</p>
                    </div>

                    <div className="grid gap-4">
                      {trancheStructures.map((structure) => (
                        <Card key={structure.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                                  <FileText className="h-5 w-5 text-green-600" />
                                  <span>{structure.structure_name}</span>
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                  Based on {structure.dataset_name} • Created on {formatDate(structure.created_at)}
                                </CardDescription>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="ml-4">
                                  {structure.tranches.length} tranches
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStructure(structure.id, structure.structure_name)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">
                                  {formatCurrency(structure.total_cost)}
                                </div>
                                <div className="text-sm text-green-700">Total Cost</div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">
                                  {structure.weighted_avg_cost_bps.toFixed(0)} BPS
                                </div>
                                <div className="text-sm text-blue-700">Weighted Avg Cost</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">
                                  {structure.cost_percentage.toFixed(2)}%
                                </div>
                                <div className="text-sm text-purple-700">Cost as % of Total</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t">
                              <Button
                                onClick={() => handleEditStructure(structure)}
                                variant="outline"
                                className="flex items-center space-x-2 border-green-200 hover:bg-green-50"
                              >
                                <Settings className="h-4 w-4" />
                                <span>Edit Structure</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                              >
                                <TrendingUp className="h-4 w-4" />
                                <span>View Details</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {datasets.length === 0 && trancheStructures.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500">Upload some data first to begin tranche analysis.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <StructureDatasetPage
        isOpen={showStructureDataset}
        onClose={handleCloseStructureDataset}
        selectedDatasetName={selectedDatasetForStructure}
        editingStructure={editingStructure}
      />
    </>
  );
};

export default TrancheAnalysisDashboard;
