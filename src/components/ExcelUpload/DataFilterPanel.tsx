
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Save, CheckCircle } from 'lucide-react';
import { LoanRecord } from '@/utils/supabase';

interface FilterCriteria {
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
  onFilteredDataChange: (filteredData: LoanRecord[]) => void;
  onSaveFilteredDataset: (filteredData: LoanRecord[], datasetName: string) => void;
  isProcessing: boolean;
}

export const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  datasetName,
  totalRecords,
  onFilteredDataChange,
  onSaveFilteredDataset,
  isProcessing
}) => {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
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
  const [isLoadingAllData, setIsLoadingAllData] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [completeDataset, setCompleteDataset] = useState<LoanRecord[]>([]);

  const loadCompleteDataset = async () => {
    if (allDataLoaded) return completeDataset;
    
    try {
      setIsLoadingAllData(true);
      console.log('🚀 LOADING ALL RECORDS WITH PROPER PAGINATION...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      let allRecords: any[] = [];
      let pageSize = 1000; // Use Supabase's max limit
      let offset = 0;
      let hasMore = true;
      
      // First get total count
      const { count: totalCount } = await supabase
        .from('loan_data')
        .select('*', { count: 'exact', head: true })
        .eq('dataset_name', datasetName);
      
      console.log(`📊 TOTAL RECORDS TO LOAD: ${totalCount}`);
      
      while (hasMore) {
        console.log(`🔄 Loading batch ${Math.floor(offset/pageSize) + 1}: offset ${offset}, pageSize ${pageSize}`);
        
        const { data, error } = await supabase
          .from('loan_data')
          .select('*')
          .eq('dataset_name', datasetName)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          console.error('❌ Error loading batch:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allRecords = [...allRecords, ...data];
          console.log(`📈 Progress: ${allRecords.length} of ${totalCount} records loaded`);
          
          offset += pageSize;
          hasMore = data.length === pageSize && allRecords.length < (totalCount || 0);
        } else {
          hasMore = false;
        }
        
        // Safety check
        if (offset > (totalCount || 0) + pageSize) {
          console.log('🛑 Stopping pagination - reached end');
          break;
        }
      }
      
      // Transform data to match LoanRecord interface
      const transformedRecords = allRecords.map(record => ({
        ...record,
        remaining_term: typeof record.remaining_term === 'string' ? parseFloat(record.remaining_term) : record.remaining_term
      })) as LoanRecord[];
      
      console.log(`✅ Complete dataset loaded: ${transformedRecords.length} records`);
      setCompleteDataset(transformedRecords);
      setAllDataLoaded(true);
      return transformedRecords;
    } catch (error) {
      console.error('❌ Error loading complete dataset:', error);
      throw error;
    } finally {
      setIsLoadingAllData(false);
    }
  };

  const applyFilters = async () => {
    try {
      setIsLoadingAllData(true);
      
      // Force reload the complete dataset every time to avoid stale cache
      console.log('🔄 FORCING RELOAD of complete dataset...');
      setAllDataLoaded(false);
      setCompleteDataset([]);
      
      console.log('🚨 ABOUT TO CALL loadCompleteDataset...');
      
      // Load complete dataset if not already loaded
      const allData = await loadCompleteDataset();
      
      console.log('🚨 loadCompleteDataset RETURNED:', { 
        length: allData.length, 
        isArray: Array.isArray(allData),
        firstRecord: allData[0] 
      });
      
      console.log(`🔍 APPLYING FILTERS - Dataset size: ${allData.length} records`);
      console.log('🔍 FILTER CRITERIA:', filterCriteria);
      
      const filtered = allData.filter(record => {
        // Loan amount filter
        if (filterCriteria.minLoanAmount && record.opening_balance < parseFloat(filterCriteria.minLoanAmount)) {
          return false;
        }
        if (filterCriteria.maxLoanAmount && record.opening_balance > parseFloat(filterCriteria.maxLoanAmount)) {
          return false;
        }

        // Interest rate filter
        if (filterCriteria.minInterestRate && record.interest_rate < parseFloat(filterCriteria.minInterestRate)) {
          return false;
        }
        if (filterCriteria.maxInterestRate && record.interest_rate > parseFloat(filterCriteria.maxInterestRate)) {
          return false;
        }

        // Remaining term filter
        if (filterCriteria.minRemainingTerm && parseFloat(record.remaining_term?.toString() || '0') < parseFloat(filterCriteria.minRemainingTerm)) {
          return false;
        }
        if (filterCriteria.maxRemainingTerm && parseFloat(record.remaining_term?.toString() || '0') > parseFloat(filterCriteria.maxRemainingTerm)) {
          return false;
        }

        // PD filter
        if (filterCriteria.minPD && record.pd && record.pd < parseFloat(filterCriteria.minPD)) {
          return false;
        }
        if (filterCriteria.maxPD && record.pd && record.pd > parseFloat(filterCriteria.maxPD)) {
          return false;
        }

        // LGD filter
        if (filterCriteria.minLGD && record.lgd < parseFloat(filterCriteria.minLGD)) {
          return false;
        }
        if (filterCriteria.maxLGD && record.lgd > parseFloat(filterCriteria.maxLGD)) {
          return false;
        }

        return true;
      });

      console.log(`✅ FILTER COMPLETE: ${filtered.length} records out of ${allData.length} total records`);
      
      setFilteredData(filtered);
      setShowFiltered(true);
      onFilteredDataChange(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoadingAllData(false);
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
    onFilteredDataChange([]);
  };

  const handleSaveFilteredDataset = async () => {
    if (saveDatasetName.trim() && filteredData.length > 0) {
      try {
        console.log('🔄 SAVING FILTERED DATASET:', {
          name: saveDatasetName.trim(),
          recordCount: filteredData.length,
          sampleRecord: filteredData[0]
        });
        
        // Prepare clean data without database-specific fields
        const cleanFilteredData = filteredData.map(record => {
          const { id, created_at, ...cleanRecord } = record;
          return cleanRecord;
        });
        
        console.log('🧹 CLEANED DATA SAMPLE:', cleanFilteredData[0]);
        
        await onSaveFilteredDataset(cleanFilteredData, saveDatasetName.trim());
        
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

  const getUniqueValues = (field: keyof LoanRecord) => {
    if (!allDataLoaded || completeDataset.length === 0) {
      return [];
    }
    return [...new Set(completeDataset.map(record => record[field]))].filter(Boolean);
  };

  const remainingTerms = getUniqueValues('remaining_term') as number[];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Data Filters
          {showFiltered && (
            <span className="text-sm font-normal text-gray-600">
              ({filteredData.length.toLocaleString()} of {totalRecords.toLocaleString()} records)
            </span>
          )}
          {!allDataLoaded && (
            <span className="text-sm font-normal text-orange-600">
              (Will load all {totalRecords.toLocaleString()} records for filtering)
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
            <Label>PD Range (%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Min"
                value={filterCriteria.minPD}
                onChange={(e) => setFilterCriteria({...filterCriteria, minPD: e.target.value})}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Max"
                value={filterCriteria.maxPD}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxPD: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>LGD Range (%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Min"
                value={filterCriteria.minLGD}
                onChange={(e) => setFilterCriteria({...filterCriteria, minLGD: e.target.value})}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Max"
                value={filterCriteria.maxLGD}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxLGD: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={applyFilters} disabled={isProcessing || isLoadingAllData}>
            {isLoadingAllData ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading all data...
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
              <Button variant="outline" onClick={clearFilters} disabled={isProcessing || isLoadingAllData}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              
              {filteredData.length > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isProcessing || isLoadingAllData}
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
                <Label>Save Filtered Dataset ({filteredData.length.toLocaleString()} records)</Label>
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
