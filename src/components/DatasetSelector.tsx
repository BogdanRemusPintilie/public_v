
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAccessibleDatasets } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Database, Loader2, RefreshCw } from 'lucide-react';

interface DatasetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (datasetName: string) => void;
  refreshTrigger?: number;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelectDataset,
  refreshTrigger = 0
}) => {
  const [datasets, setDatasets] = useState<{ name: string; owner_id: string; is_shared: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(0);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const loadDatasets = async (force = false) => {
    // Don't try to load if user is not authenticated or auth is still loading
    if (!user || authLoading) {
      console.log('🔄 SKIPPING DATASET LOAD - User not ready:', { user: !!user, authLoading });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 LOADING DATASETS - Force:', force, 'Refresh trigger:', refreshTrigger);
      
      // Clear existing datasets first to ensure clean state
      setDatasets([]);
      
      const accessibleDatasets = await getAccessibleDatasets();
      console.log('📊 DATASETS FETCHED:', accessibleDatasets);
      
      // Set datasets immediately
      setDatasets(accessibleDatasets);
      setHasInitiallyLoaded(true);
      
      console.log(`✅ LOADED ${accessibleDatasets.length} accessible datasets`);
      
      if (force) {
        toast({
          title: "Datasets Refreshed",
          description: `Found ${accessibleDatasets.length} accessible datasets`,
        });
      }
    } catch (error) {
      console.error('❌ ERROR loading datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      });
      setDatasets([]); // Clear datasets on error
      setHasInitiallyLoaded(true); // Mark as loaded even on error to prevent infinite retries
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 MODAL CLOSED - Resetting state');
      setDatasets([]);
      setHasInitiallyLoaded(false);
      setLastRefreshTrigger(0);
    }
  }, [isOpen]);

  // Load datasets when modal opens and user is ready
  useEffect(() => {
    if (isOpen && user && !authLoading && !hasInitiallyLoaded) {
      console.log('🔄 DATASET SELECTOR - Modal opened, loading datasets');
      loadDatasets();
    }
  }, [isOpen, user, authLoading, hasInitiallyLoaded]);

  // Handle refresh trigger changes with improved logic
  useEffect(() => {
    if (refreshTrigger > 0 && refreshTrigger !== lastRefreshTrigger && isOpen && user && !authLoading) {
      console.log('🔄 DATASET SELECTOR - Refresh trigger changed:', lastRefreshTrigger, '->', refreshTrigger);
      setLastRefreshTrigger(refreshTrigger);
      // Force immediate refresh for new datasets
      loadDatasets(true);
    }
  }, [refreshTrigger, lastRefreshTrigger, isOpen, user, authLoading]);

  const handleSelectDataset = (datasetName: string) => {
    console.log('📊 SELECTING DATASET:', datasetName);
    onSelectDataset(datasetName);
  };

  const handleManualRefresh = () => {
    console.log('🔄 MANUAL REFRESH requested');
    loadDatasets(true);
  };

  if (!isOpen) return null;

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-gray-600">Authenticating...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>Select Dataset to Manage</CardTitle>
            <CardDescription>
              Choose a dataset to view and manage its loan portfolio data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-gray-600">Loading datasets...</span>
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No datasets found</p>
                <p className="text-sm text-gray-400">Upload some data first to get started</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {datasets.map((dataset, index) => (
                  <div
                    key={`${dataset.name}-${dataset.owner_id}-${index}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dataset.is_shared ? 'Shared with you' : 'Your dataset'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectDataset(dataset.name)}
                      variant="outline"
                      size="sm"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="flex justify-end gap-4 p-6 border-t">
            <Button 
              variant="ghost" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              disabled={isLoading || authLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DatasetSelector;
