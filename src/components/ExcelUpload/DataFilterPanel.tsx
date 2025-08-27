
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Save, CheckCircle } from 'lucide-react';
import { LoanRecord, FilterCriteria, getLoanDataByDataset, getPortfolioSummary } from '@/utils/supabase';
import { supabase } from '@/integrations/supabase/client';

interface FilterCriteriaForm {
  minLoanAmount: string;
  maxLoanAmount: string;
  minInterestRate: string;
  maxInterestRate: string;
  minRemainingTerm: string;
  maxRemainingTerm: string;
  minPD: string;
  maxPD: string;
  minLGD: string;
  maxLGD: string;
}

interface DataFilterPanelProps {
  datasetName: string;
  totalRecords: number;
  onFilteredDataChange: (filteredData: LoanRecord[], filters?: FilterCriteria, filteredCount?: number) => void;
  onSaveFilteredDataset: (filteredData: LoanRecord[], datasetName: string) => void;
  onPortfolioSummaryChange: (summary: any) => void;
  isProcessing: boolean;
}

export const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  datasetName,
  totalRecords,
  onFilteredDataChange,
  onSaveFilteredDataset,
  onPortfolioSummaryChange,
  isProcessing
}) => {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteriaForm>({
    minLoanAmount: '',
    maxLoanAmount: '',
    minInterestRate: '',
    maxInterestRate: '',
    minRemainingTerm: '',
    maxRemainingTerm: '',
    minPD: '',
    maxPD: '',
    minLGD: '',
    maxLGD: ''
  });
  const [filteredData, setFilteredData] = useState<LoanRecord[]>([]);
  const [showFiltered, setShowFiltered] = useState(false);
  const [saveDatasetName, setSaveDatasetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);

  const convertFormToFilterCriteria = (formCriteria: FilterCriteriaForm): FilterCriteria => {
    const filters: FilterCriteria = {};
    
    // Only add filters if the value is not empty and is a valid number
    if (formCriteria.minLoanAmount && !isNaN(parseFloat(formCriteria.minLoanAmount))) {
      filters.minLoanAmount = parseFloat(formCriteria.minLoanAmount);
    }
    if (formCriteria.maxLoanAmount && !isNaN(parseFloat(formCriteria.maxLoanAmount))) {
      filters.maxLoanAmount = parseFloat(formCriteria.maxLoanAmount);
    }
    if (formCriteria.minInterestRate && !isNaN(parseFloat(formCriteria.minInterestRate))) {
      filters.minInterestRate = parseFloat(formCriteria.minInterestRate);
    }
    if (formCriteria.maxInterestRate && !isNaN(parseFloat(formCriteria.maxInterestRate))) {
      filters.maxInterestRate = parseFloat(formCriteria.maxInterestRate);
    }
    if (formCriteria.minRemainingTerm && !isNaN(parseFloat(formCriteria.minRemainingTerm))) {
      filters.minRemainingTerm = parseFloat(formCriteria.minRemainingTerm);
    }
    if (formCriteria.maxRemainingTerm && !isNaN(parseFloat(formCriteria.maxRemainingTerm))) {
      filters.maxRemainingTerm = parseFloat(formCriteria.maxRemainingTerm);
    }
    if (formCriteria.minPD && !isNaN(parseFloat(formCriteria.minPD))) {
      filters.minPD = parseFloat(formCriteria.minPD) / 100; // Convert percentage to decimal
    }
    if (formCriteria.maxPD && !isNaN(parseFloat(formCriteria.maxPD))) {
      filters.maxPD = parseFloat(formCriteria.maxPD) / 100; // Convert percentage to decimal
    }
    if (formCriteria.minLGD && !isNaN(parseFloat(formCriteria.minLGD))) {
      filters.minLGD = parseFloat(formCriteria.minLGD) / 100; // Convert percentage to decimal
    }
    if (formCriteria.maxLGD && !isNaN(parseFloat(formCriteria.maxLGD))) {
      filters.maxLGD = parseFloat(formCriteria.maxLGD) / 100; // Convert percentage to decimal
    }
    
    return filters;
  };

  const applyFilters = async () => {
    try {
      setIsLoadingFilters(true);
      
      console.log('🔍 APPLYING DATABASE FILTERS...');
      console.log('🔍 FILTER CRITERIA:', filterCriteria);
      
      // Convert form criteria to database filter format
      const filters = convertFormToFilterCriteria(filterCriteria);
      console.log('🔍 CONVERTED FILTERS:', filters);
      
      // First, get just the count to show how many records match
      const countResult = await getLoanDataByDataset(datasetName, 0, 1, filters);
      setFilteredCount(countResult.totalCount);
      
      // Load a reasonable amount of filtered data for display (first 1000 records)
      const result = await getLoanDataByDataset(datasetName, 0, 1000, filters);
      
      console.log(`✅ DATABASE FILTER COMPLETE: ${result.totalCount} total matching records, loaded ${result.data.length} for display`);
      
      // Update portfolio summary with filtered data
      const filteredSummary = await getPortfolioSummary(datasetName, filters);
      onPortfolioSummaryChange(filteredSummary);
      
      setFilteredData(result.data);
      setShowFiltered(true);
      onFilteredDataChange(result.data, filters, countResult.totalCount);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const clearFilters = () => {
    setFilterCriteria({
      minLoanAmount: '',
      maxLoanAmount: '',
      minInterestRate: '',
      maxInterestRate: '',
      minRemainingTerm: '',
      maxRemainingTerm: '',
      minPD: '',
      maxPD: '',
      minLGD: '',
      maxLGD: ''
    });
    setFilteredData([]);
    setShowFiltered(false);
    setFilteredCount(0);
    onFilteredDataChange([], null, 0); // Pass 0 as filtered count when clearing
    
    // Reset portfolio summary to original dataset summary
    getPortfolioSummary(datasetName).then(originalSummary => {
      onPortfolioSummaryChange(originalSummary);
    }).catch(console.error);
  };

  const handleSaveFilteredDataset = async () => {
    if (saveDatasetName.trim() && filteredCount > 0) {
      try {
        console.log('🔄 SAVING FILTERED DATASET (SERVER-SIDE):', {
          name: saveDatasetName.trim(),
          totalFilteredRecords: filteredCount
        });
        
        // Use edge function for efficient server-side copying
        const currentFilters = convertFormToFilterCriteria(filterCriteria);
        
        const { data, error } = await supabase.functions.invoke('copy-filtered-dataset', {
          body: {
            sourceDatasetName: datasetName,
            newDatasetName: saveDatasetName.trim(),
            filters: currentFilters
          }
        });

        if (error) {
          console.error('❌ Server-side copy failed:', error);
          throw new Error(`Failed to copy dataset: ${error.message}`);
        }

        console.log('✅ SERVER-SIDE COPY SUCCESSFUL:', data);
        
        // Show success message with actual copied count
        const actualCopied = data?.recordsCopied || filteredCount;
        
        // Update UI to reflect successful save
        setSaveSuccess(true);
        setSaveDatasetName('');
        
        // Call the parent handler with empty array since server-side work is done
        // but pass the actual copied count in the dataset name for logging
        await onSaveFilteredDataset([], saveDatasetName.trim());
        
        setSaveSuccess(true);
        
        // Reset form after successful save
        setTimeout(() => {
          setShowSaveDialog(false);
          setSaveDatasetName('');
          setSaveSuccess(false);
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error saving filtered dataset:', error);
        setSaveSuccess(false);
      }
    }
  };


  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Data Filters
          {showFiltered && (
            <span className="text-sm font-normal text-gray-600">
              ({filteredCount.toLocaleString()} matching records, showing {filteredData.length.toLocaleString()})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Loan Amount Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filterCriteria.minLoanAmount}
                onChange={(e) => setFilterCriteria({...filterCriteria, minLoanAmount: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filterCriteria.maxLoanAmount}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxLoanAmount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interest Rate Range (%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Min"
                value={filterCriteria.minInterestRate}
                onChange={(e) => setFilterCriteria({...filterCriteria, minInterestRate: e.target.value})}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Max"
                value={filterCriteria.maxInterestRate}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxInterestRate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remaining Terms Range (months)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filterCriteria.minRemainingTerm}
                onChange={(e) => setFilterCriteria({...filterCriteria, minRemainingTerm: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filterCriteria.maxRemainingTerm}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxRemainingTerm: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>PD Range (%) <span className="text-sm text-gray-500">- Enter as percentage (e.g., 0 to 10)</span></Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 0"
                value={filterCriteria.minPD}
                onChange={(e) => setFilterCriteria({...filterCriteria, minPD: e.target.value})}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 10"
                value={filterCriteria.maxPD}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxPD: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>LGD Range (%) <span className="text-sm text-gray-500">- Enter as percentage (e.g., 0 to 50)</span></Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 0"
                value={filterCriteria.minLGD}
                onChange={(e) => setFilterCriteria({...filterCriteria, minLGD: e.target.value})}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 50"
                value={filterCriteria.maxLGD}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxLGD: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={applyFilters} disabled={isProcessing || isLoadingFilters}>
            {isLoadingFilters ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Filtering...
              </>
            ) : (
              <>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </>
            )}
          </Button>
          
          {showFiltered && (
            <>
              <Button variant="outline" onClick={clearFilters} disabled={isProcessing || isLoadingFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              
              {filteredData.length > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isProcessing || isLoadingFilters}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Filtered Dataset
                </Button>
              )}
            </>
          )}
        </div>

        {showSaveDialog && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Save Filtered Dataset ({filteredCount.toLocaleString()} total records)</Label>
                {saveSuccess && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Saved successfully!</span>
                  </div>
                )}
              </div>
              <Input
                placeholder="Enter dataset name..."
                value={saveDatasetName}
                onChange={(e) => setSaveDatasetName(e.target.value)}
                disabled={isProcessing || saveSuccess}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveFilteredDataset}
                  disabled={!saveDatasetName.trim() || isProcessing || saveSuccess}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Dataset
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveSuccess(false);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
