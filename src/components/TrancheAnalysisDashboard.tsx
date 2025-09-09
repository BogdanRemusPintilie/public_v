import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database, BarChart3, Settings, TrendingUp, Layers, FileText, Trash2, FileCheck, Upload } from 'lucide-react';
import StructureDatasetPage from './StructureDatasetPage';
import TrancheAnalyticsView from './TrancheAnalyticsView';
import { TrancheStructure } from '@/utils/supabase';

// Global cache for preloaded tranche data
let preloadedDatasets: DatasetSummary[] | null = null;
let preloadedStructures: TrancheStructure[] | null = null;
let preloadPromise: Promise<void> | null = null;

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_count: number;
  created_at: string;
}

interface TrancheAnalysisDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preload function that can be called from Dashboard
export const preloadTrancheData = async (user: any) => {
  if (!user || (preloadedDatasets && preloadedStructures) || preloadPromise) return;
  
  preloadPromise = (async () => {
    try {
      console.log('🚀 PRELOADING TRANCHE DATA in background');
      
      // Fetch datasets and structures in parallel
      const [datasetsResponse, structuresResponse] = await Promise.all([
        supabase.rpc('get_dataset_summaries_optimized'),
        supabase
          .from('tranche_structures')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (datasetsResponse.error) {
        console.error('Error preloading datasets:', datasetsResponse.error);
        preloadedDatasets = [];
      } else {
        preloadedDatasets = datasetsResponse.data || [];
        console.log(`✅ PRELOADED ${preloadedDatasets.length} datasets`);
      }

      if (structuresResponse.error) {
        console.error('Error preloading structures:', structuresResponse.error);
        preloadedStructures = [];
      } else {
        // Cast the Json tranches back to array type
        const structures = (structuresResponse.data || []).map(item => ({
          ...item,
          tranches: item.tranches as any[]
        }));
        preloadedStructures = structures;
        console.log(`✅ PRELOADED ${preloadedStructures.length} tranche structures`);
      }
    } catch (error) {
      console.error('❌ ERROR preloading tranche data:', error);
      preloadedDatasets = [];
      preloadedStructures = [];
    }
  })();
  
  await preloadPromise;
};

const TrancheAnalysisDashboard = ({ isOpen, onClose }: TrancheAnalysisDashboardProps) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [trancheStructures, setTrancheStructures] = useState<TrancheStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStructureDataset, setShowStructureDataset] = useState(false);
  const [selectedDatasetForStructure, setSelectedDatasetForStructure] = useState<string>('');
  const [editingStructure, setEditingStructure] = useState<TrancheStructure | null>(null);
  const [showManageStructure, setShowManageStructure] = useState(false);
  const [selectedDatasetForManagement, setSelectedDatasetForManagement] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedStructureForAnalytics, setSelectedStructureForAnalytics] = useState<TrancheStructure | null>(null);
  const [reportUploadOpen, setReportUploadOpen] = useState(false);
  const [reportUploadDataset, setReportUploadDataset] = useState<string>('');
  const [uploadingReport, setUploadingReport] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasets = async (force = false) => {
    if (!user) return;
    
    // If we have preloaded data and this isn't a forced refresh, use it instantly!
    if (preloadedDatasets && !force) {
      console.log('⚡ USING PRELOADED DATASETS - Instant load!');
      setDatasets([...preloadedDatasets]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_dataset_summaries_optimized');
      
      if (error) {
        console.error('Error fetching datasets:', error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
        return;
      }

      // Update both local state and global cache
      setDatasets(data || []);
      preloadedDatasets = data || [];
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

  const fetchTrancheStructures = async (force = false) => {
    if (!user) return;
    
    // If we have preloaded data and this isn't a forced refresh, use it instantly!
    if (preloadedStructures && !force) {
      console.log('⚡ USING PRELOADED STRUCTURES - Instant load!');
      setTrancheStructures([...preloadedStructures]);
      return;
    }
    
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
      
      // Update both local state and global cache
      setTrancheStructures(structures);
      preloadedStructures = structures;
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
    setSelectedDatasetForManagement(datasetName);
    setShowManageStructure(true);
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

  const handleViewAnalytics = (structure: TrancheStructure) => {
    setSelectedStructureForAnalytics(structure);
    setShowAnalytics(true);
  };

  const handleCloseStructureDataset = () => {
    setShowStructureDataset(false);
    setSelectedDatasetForStructure('');
    setEditingStructure(null);
    // Invalidate cache and force refresh when returning from structure creation
    preloadedStructures = null;
    fetchTrancheStructures(true);
  };

  const handleCloseManageStructure = () => {
    setShowManageStructure(false);
    setSelectedDatasetForManagement('');
    // Refresh structures when returning from management
    fetchTrancheStructures();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
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

  // Get structures for the selected dataset
  const getStructuresForDataset = (datasetName: string) => {
    return trancheStructures.filter(structure => structure.dataset_name === datasetName);
  };

  // Helper function to get report file path
  const getReportPath = (datasetName: string) => {
    if (!user?.id) return '';
    const encodedDatasetName = encodeURIComponent(datasetName);
    return `tranching-reports/${user.id}/${encodedDatasetName}/report.pdf`;
  };

  // Open tranching report - check if exists, if not prompt upload
  const openTranchingReport = async (datasetName: string) => {
    if (!user?.id) return;
    
    try {
      const filePath = getReportPath(datasetName);
      
      // Check if report exists
      const { data: fileData } = await supabase.storage
        .from('investor-reports')
        .list(`tranching-reports/${user.id}/${encodeURIComponent(datasetName)}`);
      
      const reportExists = fileData?.some(file => file.name === 'report.pdf');
      
      if (reportExists) {
        // Generate signed URL and open in new tab
        const { data: urlData, error } = await supabase.storage
          .from('investor-reports')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (error) {
          console.error('Error generating signed URL:', error);
          toast({
            title: "Error",
            description: "Failed to open report",
            variant: "destructive",
          });
          return;
        }
        
        window.open(urlData.signedUrl, '_blank');
      } else {
        // No report exists, prompt upload
        setReportUploadDataset(datasetName);
        setReportUploadOpen(true);
      }
    } catch (error) {
      console.error('Error checking report:', error);
      toast({
        title: "Error",
        description: "Failed to check for existing report",
        variant: "destructive",
      });
    }
  };

  // Handle report upload
  const handleUploadReport = async (file: File) => {
    if (!user?.id || !reportUploadDataset) return;
    
    setUploadingReport(true);
    
    try {
      const filePath = getReportPath(reportUploadDataset);
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('investor-reports')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) {
        console.error('Error uploading report:', uploadError);
        toast({
          title: "Upload Error",
          description: "Failed to upload report",
          variant: "destructive",
        });
        return;
      }
      
      // Generate signed URL and open immediately
      const { data: urlData, error: urlError } = await supabase.storage
        .from('investor-reports')
        .createSignedUrl(filePath, 3600);
      
      if (urlError) {
        console.error('Error generating signed URL:', urlError);
        toast({
          title: "Error",
          description: "Report uploaded but failed to open",
          variant: "destructive",
        });
      } else {
        window.open(urlData.signedUrl, '_blank');
        toast({
          title: "Success",
          description: "Report uploaded and opened successfully",
        });
      }
      
      setReportUploadOpen(false);
      setReportUploadDataset('');
    } catch (error) {
      console.error('Error uploading report:', error);
      toast({
        title: "Error",
        description: "Failed to upload report",
        variant: "destructive",
      });
    } finally {
      setUploadingReport(false);
    }
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
                                onClick={() => openTranchingReport(dataset.dataset_name)}
                                className="flex items-center space-x-2 border-green-200 hover:bg-green-50"
                              >
                                <FileCheck className="h-4 w-4" />
                                <span>Run and Review Tranching Report</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleManageStructure(dataset.dataset_name)}
                                className="flex items-center space-x-2 border-indigo-200 hover:bg-indigo-50"
                              >
                                <Settings className="h-4 w-4" />
                                <span>Manage Structure ({getStructuresForDataset(dataset.dataset_name).length})</span>
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

      {/* Manage Structure Dialog */}
      <Dialog open={showManageStructure} onOpenChange={handleCloseManageStructure}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-indigo-600" />
              <span>Manage Structures for {selectedDatasetForManagement}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {getStructuresForDataset(selectedDatasetForManagement).length > 0 ? (
              <div className="grid gap-4">
                {getStructuresForDataset(selectedDatasetForManagement).map((structure) => (
                  <Card key={structure.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span>{structure.structure_name}</span>
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            Created on {formatDate(structure.created_at)}
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
                          onClick={() => handleViewAnalytics(structure)}
                          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>View Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Structures</h3>
                <p className="text-gray-500">No tranche structures have been saved for this dataset yet.</p>
                <Button
                  onClick={() => {
                    handleCloseManageStructure();
                    handleStructureDataset(selectedDatasetForManagement);
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  Create New Structure
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TrancheAnalyticsView
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        structure={selectedStructureForAnalytics}
      />

      {/* Report Upload Dialog */}
      <Dialog open={reportUploadOpen} onOpenChange={setReportUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-green-600" />
              <span>Upload Tranching Report</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              No tranching report found for "{reportUploadDataset}". Please upload a PDF report to continue.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="report-upload">Select PDF Report</Label>
              <Input
                id="report-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      toast({
                        title: "Invalid File",
                        description: "Please select a PDF file",
                        variant: "destructive",
                      });
                      return;
                    }
                    handleUploadReport(file);
                  }
                }}
                disabled={uploadingReport}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReportUploadOpen(false)}
                disabled={uploadingReport}
              >
                Cancel
              </Button>
            </div>
            
            {uploadingReport && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrancheAnalysisDashboard;
