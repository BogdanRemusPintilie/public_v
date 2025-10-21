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
import { TrancheStructure, getDatasetSummaries, deleteLoanDataByDataset } from '@/utils/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      const [datasetSummaries, structuresResponse] = await Promise.all([
        getDatasetSummaries(),
        supabase
          .from('tranche_structures')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      preloadedDatasets = (Array.isArray(datasetSummaries) ? datasetSummaries : []) as unknown as DatasetSummary[];

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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [deleteDatasetDialog, setDeleteDatasetDialog] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<string>('');
  const [deleteStructureDialog, setDeleteStructureDialog] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState<{ id: string; name: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatasets = async (force = false) => {
    if (!user) {
      console.log('⚠️ FETCH DATASETS - No user found');
      return;
    }
    
    console.log('📊 FETCH DATASETS - User:', user.email, 'Force:', force);
    
    // If we have preloaded data and this isn't a forced refresh, use it instantly!
    if (preloadedDatasets && !force) {
      console.log('⚡ USING PRELOADED DATASETS - Instant load!', preloadedDatasets.length);
      setDatasets([...preloadedDatasets]);
      return;
    }
    
    console.log('🔄 FETCHING DATASETS from database...');
    setLoading(true);
    try {
      const datasetSummaries = await getDatasetSummaries();
      console.log('📊 DATASETS VIA UTILS:', datasetSummaries?.length);

      // Update both local state and global cache
      const ds = datasetSummaries || [];
      console.log('✅ DATASETS LOADED:', ds.length, 'datasets');
      setDatasets(ds as DatasetSummary[]);
      preloadedDatasets = ds as DatasetSummary[];
    } catch (error) {
      console.error('💥 EXCEPTION fetching datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "An unexpected error occurred while fetching datasets",
        variant: "destructive",
      });
      setDatasets([]);
      preloadedDatasets = [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTrancheStructures = async (force = false) => {
    if (!user) {
      console.log('⚠️ FETCH STRUCTURES - No user found');
      return;
    }
    
    // If we have preloaded data and this isn't a forced refresh, use it instantly!
    if (preloadedStructures && !force) {
      console.log('⚡ USING PRELOADED STRUCTURES - Instant load!', preloadedStructures.length);
      setTrancheStructures([...preloadedStructures]);
      return;
    }
    
    console.log('🔄 FETCHING TRANCHE STRUCTURES from database...');
    try {
      const { data, error } = await supabase
        .from('tranche_structures')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 STRUCTURES RESPONSE:', { dataCount: data?.length, error });
      
      if (error) {
        console.error('❌ Error fetching tranche structures:', error);
        toast({
          title: "Error Loading Structures",
          description: error.message || "Failed to fetch tranche structures. Please try again.",
          variant: "destructive",
        });
        setTrancheStructures([]);
        preloadedStructures = [];
        return;
      }

      // Cast the Json tranches back to array type
      const structures = (data || []).map(item => ({
        ...item,
        tranches: item.tranches as any[]
      }));
      
      console.log('✅ STRUCTURES LOADED:', structures.length, 'structures');
      
      // Update both local state and global cache
      setTrancheStructures(structures);
      preloadedStructures = structures;
    } catch (error) {
      console.error('💥 EXCEPTION fetching structures:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching tranche structures",
        variant: "destructive",
      });
      setTrancheStructures([]);
      preloadedStructures = [];
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      console.log('🚀 TRANCHE DASHBOARD OPENED - Fetching data for user:', user.id);
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

  const handleDeleteDataset = async (datasetName: string) => {
    try {
      console.log('🗑️ DELETING DATASET:', datasetName);
      await deleteLoanDataByDataset(datasetName);
      
      toast({
        title: "Dataset Deleted",
        description: `Successfully deleted "${datasetName}" and all associated structures`,
      });

      // Refresh datasets and structures
      preloadedDatasets = null;
      preloadedStructures = null;
      fetchDatasets(true);
      fetchTrancheStructures(true);
      setDeleteDatasetDialog(false);
      setDatasetToDelete('');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: "Error",
        description: "Failed to delete dataset",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStructure = async () => {
    if (!structureToDelete) return;
    
    try {
      const { error } = await supabase
        .from('tranche_structures')
        .delete()
        .eq('id', structureToDelete.id);

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
        description: `"${structureToDelete.name}" has been deleted`,
      });

      // Refresh the structures list
      preloadedStructures = null;
      fetchTrancheStructures(true);
      setDeleteStructureDialog(false);
      setStructureToDelete(null);
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
      console.log('🔍 Checking for report at path:', filePath);
      
      // First try to generate a signed URL directly - if it works, the file exists
      const { data: urlData, error: urlError } = await supabase.storage
        .from('investor-reports')
        .createSignedUrl(filePath, 3600);
      
      console.log('📝 Signed URL result:', { urlData, urlError });
      
      if (!urlError && urlData?.signedUrl) {
        // File exists, show it
        console.log('✅ File exists, showing PDF viewer');
        setPdfUrl(urlData.signedUrl);
        setPdfTitle(`Tranching Report - ${datasetName}`);
        setPdfViewerOpen(true);
        return;
      }
      
      // If direct URL generation failed, try listing files as backup
      console.log('🔍 Direct URL failed, trying file listing...');
      const encodedDatasetName = encodeURIComponent(datasetName);
      const { data: fileData, error: listError } = await supabase.storage
        .from('investor-reports')
        .list(`tranching-reports/${user.id}/${encodedDatasetName}`);
      
      console.log('📁 File listing result:', { fileData, listError });
      
      const reportExists = fileData?.some(file => file.name === 'report.pdf');
      console.log('📊 Report exists check:', reportExists);
      
      if (reportExists) {
        // Try again to generate URL
        const { data: retryUrlData, error: retryError } = await supabase.storage
          .from('investor-reports')
          .createSignedUrl(filePath, 3600);
        
        console.log('🔄 Retry URL result:', { retryUrlData, retryError });
        
        if (!retryError && retryUrlData?.signedUrl) {
          setPdfUrl(retryUrlData.signedUrl);
          setPdfTitle(`Tranching Report - ${datasetName}`);
          setPdfViewerOpen(true);
          return;
        }
      }
      
      // No report exists, prompt upload
      console.log('❌ No report found, prompting upload');
      setReportUploadDataset(datasetName);
      setReportUploadOpen(true);
      
    } catch (error) {
      console.error('💥 Error checking report:', error);
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
        // Show PDF in inline viewer instead of new tab
        setPdfUrl(urlData.signedUrl);
        setPdfTitle(`Tranching Report - ${reportUploadDataset}`);
        setPdfViewerOpen(true);
        toast({
          title: "Success",
          description: "Report uploaded successfully",
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
                              
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDatasetToDelete(dataset.dataset_name);
                                  setDeleteDatasetDialog(true);
                                }}
                                className="flex items-center space-x-2 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Dataset</span>
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
                            onClick={() => {
                              setStructureToDelete({ id: structure.id, name: structure.structure_name });
                              setDeleteStructureDialog(true);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
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

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              <span>Tranching Report Ready</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your tranching report for <strong>{pdfTitle.replace('Tranching Report - ', '')}</strong> is ready.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Recommended:</strong> Download the PDF to view it with your preferred PDF reader for the best experience.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={async () => {
                  try {
                    console.log('🔽 Download button clicked, URL:', pdfUrl);
                    
                    // Try fetch approach first
                    const response = await fetch(pdfUrl);
                    console.log('📡 Fetch response:', response.status, response.ok);
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      console.log('📦 Blob created:', blob.size, 'bytes');
                      
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${pdfTitle}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: "Download Started",
                        description: "Your tranching report is downloading",
                      });
                    } else {
                      throw new Error(`HTTP ${response.status}`);
                    }
                  } catch (error) {
                    console.error('💥 Download failed:', error);
                    toast({
                      title: "Download Failed",
                      description: "Could not download the PDF. Try the 'Open in New Tab' option.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <FileText className="h-4 w-4" />
                <span>Download Tranching Report</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🔗 Opening in new tab:', pdfUrl);
                  const newWindow = window.open(pdfUrl, '_blank');
                  if (!newWindow) {
                    toast({
                      title: "Popup Blocked",
                      description: "Please allow popups for this site or use the download option",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Opening PDF",
                      description: "If the PDF doesn't display, please use the download option",
                      variant: "default",
                    });
                  }
                }}
                className="flex items-center justify-center space-x-2"
              >
                <span>Try Open in Browser</span>
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 text-center space-y-1">
              <div>The PDF will download to your default download folder</div>
              <div className="text-yellow-600">Note: Browser viewing may not work in all browsers due to security policies</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dataset Confirmation Dialog */}
      <AlertDialog open={deleteDatasetDialog} onOpenChange={setDeleteDatasetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dataset <strong>"{datasetToDelete}"</strong> and all its associated data, including loan records and tranche structures. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDatasetDialog(false);
              setDatasetToDelete('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteDataset(datasetToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Dataset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Structure Confirmation Dialog */}
      <AlertDialog open={deleteStructureDialog} onOpenChange={setDeleteStructureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Structure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the structure <strong>"{structureToDelete?.name}"</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteStructureDialog(false);
              setStructureToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStructure}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Structure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrancheAnalysisDashboard;
