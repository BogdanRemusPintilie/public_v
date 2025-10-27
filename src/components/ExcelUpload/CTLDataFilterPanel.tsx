import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Save, CheckCircle } from 'lucide-react';
import { CorporateTermLoanRecord, CTLFilterCriteria, getCorporateTermLoansByDataset, getCTLPortfolioSummary } from '@/utils/supabaseCTL';
import { supabase } from '@/integrations/supabase/client';

interface CTLFilterCriteriaForm {
  minLoanAmount: string;
  maxLoanAmount: string;
  minFacilityAmount: string;
  maxFacilityAmount: string;
  minInterestRate: string;
  maxInterestRate: string;
  minRemainingTerm: string;
  maxRemainingTerm: string;
  minPD: string;
  maxPD: string;
  minLGD: string;
  maxLGD: string;
  creditRating: string;
  industrySector: string;
  country: string;
  securedUnsecured: string;
  performingStatus: string;
  minLeverageRatio: string;
  maxLeverageRatio: string;
  minInterestCoverageRatio: string;
  maxInterestCoverageRatio: string;
  minDSCR: string;
  maxDSCR: string;
  minCollateralCoverage: string;
  maxCollateralCoverage: string;
  maxExposureCap: string;
  enableExposureCapping: boolean;
  exposureCapAmount: string;
}

interface CTLDataFilterPanelProps {
  datasetName: string;
  totalRecords: number;
  onFilteredDataChange: (filteredData: CorporateTermLoanRecord[], filters?: CTLFilterCriteria, filteredCount?: number) => void;
  onSaveFilteredDataset: (filteredData: CorporateTermLoanRecord[], datasetName: string) => void;
  onPortfolioSummaryChange: (summary: any) => void;
  isProcessing: boolean;
}

export const CTLDataFilterPanel: React.FC<CTLDataFilterPanelProps> = ({
  datasetName,
  totalRecords,
  onFilteredDataChange,
  onSaveFilteredDataset,
  onPortfolioSummaryChange,
  isProcessing
}) => {
  const [filterCriteria, setFilterCriteria] = useState<CTLFilterCriteriaForm>({
    minLoanAmount: '',
    maxLoanAmount: '',
    minFacilityAmount: '',
    maxFacilityAmount: '',
    minInterestRate: '',
    maxInterestRate: '',
    minRemainingTerm: '',
    maxRemainingTerm: '',
    minPD: '',
    maxPD: '',
    minLGD: '',
    maxLGD: '',
    creditRating: 'all',
    industrySector: 'all',
    country: 'all',
    securedUnsecured: 'all',
    performingStatus: 'all',
    minLeverageRatio: '',
    maxLeverageRatio: '',
    minInterestCoverageRatio: '',
    maxInterestCoverageRatio: '',
    minDSCR: '',
    maxDSCR: '',
    minCollateralCoverage: '',
    maxCollateralCoverage: '',
    maxExposureCap: '',
    enableExposureCapping: false,
    exposureCapAmount: ''
  });
  const [filteredData, setFilteredData] = useState<CorporateTermLoanRecord[]>([]);
  const [showFiltered, setShowFiltered] = useState(false);
  const [saveDatasetName, setSaveDatasetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);

  const convertFormToFilterCriteria = (formCriteria: CTLFilterCriteriaForm): CTLFilterCriteria => {
    const filters: CTLFilterCriteria = {};
    
    // Numeric range filters
    if (formCriteria.minLoanAmount && !isNaN(parseFloat(formCriteria.minLoanAmount))) {
      filters.minLoanAmount = parseFloat(formCriteria.minLoanAmount);
    }
    if (formCriteria.maxLoanAmount && !isNaN(parseFloat(formCriteria.maxLoanAmount))) {
      filters.maxLoanAmount = parseFloat(formCriteria.maxLoanAmount);
    }
    if (formCriteria.minFacilityAmount && !isNaN(parseFloat(formCriteria.minFacilityAmount))) {
      filters.minFacilityAmount = parseFloat(formCriteria.minFacilityAmount);
    }
    if (formCriteria.maxFacilityAmount && !isNaN(parseFloat(formCriteria.maxFacilityAmount))) {
      filters.maxFacilityAmount = parseFloat(formCriteria.maxFacilityAmount);
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
      filters.maxPD = parseFloat(formCriteria.maxPD) / 100;
    }
    if (formCriteria.minLGD && !isNaN(parseFloat(formCriteria.minLGD))) {
      filters.minLGD = parseFloat(formCriteria.minLGD) / 100;
    }
    if (formCriteria.maxLGD && !isNaN(parseFloat(formCriteria.maxLGD))) {
      filters.maxLGD = parseFloat(formCriteria.maxLGD) / 100;
    }
    if (formCriteria.minLeverageRatio && !isNaN(parseFloat(formCriteria.minLeverageRatio))) {
      filters.minLeverageRatio = parseFloat(formCriteria.minLeverageRatio);
    }
    if (formCriteria.maxLeverageRatio && !isNaN(parseFloat(formCriteria.maxLeverageRatio))) {
      filters.maxLeverageRatio = parseFloat(formCriteria.maxLeverageRatio);
    }
    if (formCriteria.minInterestCoverageRatio && !isNaN(parseFloat(formCriteria.minInterestCoverageRatio))) {
      filters.minInterestCoverageRatio = parseFloat(formCriteria.minInterestCoverageRatio);
    }
    if (formCriteria.maxInterestCoverageRatio && !isNaN(parseFloat(formCriteria.maxInterestCoverageRatio))) {
      filters.maxInterestCoverageRatio = parseFloat(formCriteria.maxInterestCoverageRatio);
    }
    if (formCriteria.minDSCR && !isNaN(parseFloat(formCriteria.minDSCR))) {
      filters.minDSCR = parseFloat(formCriteria.minDSCR);
    }
    if (formCriteria.maxDSCR && !isNaN(parseFloat(formCriteria.maxDSCR))) {
      filters.maxDSCR = parseFloat(formCriteria.maxDSCR);
    }
    if (formCriteria.minCollateralCoverage && !isNaN(parseFloat(formCriteria.minCollateralCoverage))) {
      filters.minCollateralCoverage = parseFloat(formCriteria.minCollateralCoverage);
    }
    if (formCriteria.maxCollateralCoverage && !isNaN(parseFloat(formCriteria.maxCollateralCoverage))) {
      filters.maxCollateralCoverage = parseFloat(formCriteria.maxCollateralCoverage);
    }

    // Categorical filters
    if (formCriteria.creditRating && formCriteria.creditRating !== 'all') {
      filters.creditRating = formCriteria.creditRating;
    }
    if (formCriteria.industrySector && formCriteria.industrySector !== 'all') {
      filters.industrySector = formCriteria.industrySector;
    }
    if (formCriteria.country && formCriteria.country !== 'all') {
      filters.country = formCriteria.country;
    }
    if (formCriteria.securedUnsecured && formCriteria.securedUnsecured !== 'all') {
      filters.securedUnsecured = formCriteria.securedUnsecured;
    }
    if (formCriteria.performingStatus && formCriteria.performingStatus !== 'all') {
      filters.performingStatus = formCriteria.performingStatus;
    }
    
    // Exposure cap filters
    if (formCriteria.maxExposureCap && !isNaN(parseFloat(formCriteria.maxExposureCap))) {
      filters.maxExposureCap = parseFloat(formCriteria.maxExposureCap);
    }
    if (formCriteria.enableExposureCapping) {
      filters.enableExposureCapping = true;
      if (formCriteria.exposureCapAmount && !isNaN(parseFloat(formCriteria.exposureCapAmount))) {
        filters.exposureCapAmount = parseFloat(formCriteria.exposureCapAmount);
      }
    }
    
    return filters;
  };

  const applyFilters = async () => {
    try {
      setIsLoadingFilters(true);
      
      console.log('🔍 APPLYING CTL DATABASE FILTERS...');
      console.log('🔍 FILTER CRITERIA:', filterCriteria);
      
      const filters = convertFormToFilterCriteria(filterCriteria);
      console.log('🔍 CONVERTED FILTERS:', filters);
      
      // Get count of matching records
      const countResult = await getCorporateTermLoansByDataset(datasetName, 0, 1, filters);
      setFilteredCount(countResult.totalCount);
      
      // Load filtered data for display (first 1000 records)
      const result = await getCorporateTermLoansByDataset(datasetName, 0, 1000, filters);
      
      console.log(`✅ CTL FILTER COMPLETE: ${result.totalCount} total matching records, loaded ${result.data.length} for display`);
      
      // Apply exposure capping if enabled (client-side transformation)
      let processedData = result.data;
      if (filters.enableExposureCapping && filters.exposureCapAmount) {
        processedData = result.data.map(loan => ({
          ...loan,
          current_balance: Math.min(loan.current_balance, filters.exposureCapAmount!),
          loan_amount: Math.min(loan.loan_amount, filters.exposureCapAmount!)
        }));
        console.log(`📊 APPLIED EXPOSURE CAPPING: Cap at $${filters.exposureCapAmount.toLocaleString()}`);
      }
      
      // Update portfolio summary with filtered data
      const filteredSummary = await getCTLPortfolioSummary(datasetName, filters);
      onPortfolioSummaryChange(filteredSummary);
      
      setFilteredData(processedData);
      setShowFiltered(true);
      onFilteredDataChange(processedData, filters, countResult.totalCount);
    } catch (error) {
      console.error('Error applying CTL filters:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const clearFilters = () => {
    setFilterCriteria({
      minLoanAmount: '',
      maxLoanAmount: '',
      minFacilityAmount: '',
      maxFacilityAmount: '',
      minInterestRate: '',
      maxInterestRate: '',
      minRemainingTerm: '',
      maxRemainingTerm: '',
      minPD: '',
      maxPD: '',
      minLGD: '',
      maxLGD: '',
      creditRating: 'all',
      industrySector: 'all',
      country: 'all',
      securedUnsecured: 'all',
      performingStatus: 'all',
      minLeverageRatio: '',
      maxLeverageRatio: '',
      minInterestCoverageRatio: '',
      maxInterestCoverageRatio: '',
      minDSCR: '',
      maxDSCR: '',
      minCollateralCoverage: '',
      maxCollateralCoverage: '',
      maxExposureCap: '',
      enableExposureCapping: false,
      exposureCapAmount: ''
    });
    setFilteredData([]);
    setShowFiltered(false);
    setFilteredCount(0);
    onFilteredDataChange([], undefined, 0);
    
    // Reset portfolio summary
    getCTLPortfolioSummary(datasetName).then(originalSummary => {
      onPortfolioSummaryChange(originalSummary);
    }).catch(console.error);
  };

  const handleSaveFilteredDataset = async () => {
    if (saveDatasetName.trim() && filteredCount > 0) {
      try {
        console.log('🔄 SAVING FILTERED CTL DATASET (SERVER-SIDE):', {
          name: saveDatasetName.trim(),
          totalFilteredRecords: filteredCount
        });
        
        const currentFilters = convertFormToFilterCriteria(filterCriteria);
        
        const { data, error } = await supabase.functions.invoke('copy-filtered-dataset', {
          body: {
            sourceDatasetName: datasetName,
            newDatasetName: saveDatasetName.trim(),
            filters: currentFilters,
            loanType: 'corporate_term_loans'
          }
        });

        if (error) {
          console.error('❌ Server-side CTL copy failed:', error);
          throw new Error(`Failed to copy dataset: ${error.message}`);
        }

        console.log('✅ SERVER-SIDE CTL COPY SUCCESSFUL:', data);
        
        setSaveSuccess(true);
        setSaveDatasetName('');
        
        await onSaveFilteredDataset([], saveDatasetName.trim());
        
        setTimeout(() => {
          setShowSaveDialog(false);
          setSaveDatasetName('');
          setSaveSuccess(false);
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error saving filtered CTL dataset:', error);
        setSaveSuccess(false);
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Corporate Loan Filters
          {showFiltered && (
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredCount.toLocaleString()} matching records, showing {filteredData.length.toLocaleString()})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Loan Amount */}
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

          {/* Facility Amount */}
          <div className="space-y-2">
            <Label>Facility Amount Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filterCriteria.minFacilityAmount}
                onChange={(e) => setFilterCriteria({...filterCriteria, minFacilityAmount: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filterCriteria.maxFacilityAmount}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxFacilityAmount: e.target.value})}
              />
            </div>
          </div>

          {/* Interest Rate */}
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

          {/* Remaining Term */}
          <div className="space-y-2">
            <Label>Remaining Term Range (months)</Label>
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

          {/* PD */}
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

          {/* LGD */}
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

          {/* Leverage Ratio */}
          <div className="space-y-2">
            <Label>Leverage Ratio Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Min"
                value={filterCriteria.minLeverageRatio}
                onChange={(e) => setFilterCriteria({...filterCriteria, minLeverageRatio: e.target.value})}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Max"
                value={filterCriteria.maxLeverageRatio}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxLeverageRatio: e.target.value})}
              />
            </div>
          </div>

          {/* Interest Coverage Ratio */}
          <div className="space-y-2">
            <Label>Interest Coverage Ratio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Min"
                value={filterCriteria.minInterestCoverageRatio}
                onChange={(e) => setFilterCriteria({...filterCriteria, minInterestCoverageRatio: e.target.value})}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Max"
                value={filterCriteria.maxInterestCoverageRatio}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxInterestCoverageRatio: e.target.value})}
              />
            </div>
          </div>

          {/* DSCR */}
          <div className="space-y-2">
            <Label>Debt Service Coverage Ratio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Min"
                value={filterCriteria.minDSCR}
                onChange={(e) => setFilterCriteria({...filterCriteria, minDSCR: e.target.value})}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Max"
                value={filterCriteria.maxDSCR}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxDSCR: e.target.value})}
              />
            </div>
          </div>

          {/* Collateral Coverage */}
          <div className="space-y-2">
            <Label>Collateral Coverage Ratio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Min"
                value={filterCriteria.minCollateralCoverage}
                onChange={(e) => setFilterCriteria({...filterCriteria, minCollateralCoverage: e.target.value})}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Max"
                value={filterCriteria.maxCollateralCoverage}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxCollateralCoverage: e.target.value})}
              />
            </div>
          </div>

          {/* Credit Rating */}
          <div className="space-y-2">
            <Label>Credit Rating</Label>
            <Select
              value={filterCriteria.creditRating}
              onValueChange={(value) => setFilterCriteria({...filterCriteria, creditRating: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="AAA">AAA</SelectItem>
                <SelectItem value="AA">AA</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="BBB">BBB</SelectItem>
                <SelectItem value="BB">BB</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="CCC">CCC</SelectItem>
                <SelectItem value="CC">CC</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Secured/Unsecured */}
          <div className="space-y-2">
            <Label>Secured/Unsecured</Label>
            <Select
              value={filterCriteria.securedUnsecured}
              onValueChange={(value) => setFilterCriteria({...filterCriteria, securedUnsecured: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="secured">Secured</SelectItem>
                <SelectItem value="unsecured">Unsecured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Performing Status */}
          <div className="space-y-2">
            <Label>Performing Status</Label>
            <Select
              value={filterCriteria.performingStatus}
              onValueChange={(value) => setFilterCriteria({...filterCriteria, performingStatus: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="performing">Performing</SelectItem>
                <SelectItem value="non-performing">Non-Performing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exposure Management Section */}
        <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Portfolio Construction Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Exposure Cap */}
            <div className="space-y-2">
              <Label className="font-medium">Maximum Loan Exposure Cap</Label>
              <p className="text-sm text-muted-foreground">Exclude any loan exceeding this amount</p>
              <Input
                type="number"
                placeholder="e.g., 25000"
                value={filterCriteria.maxExposureCap}
                onChange={(e) => setFilterCriteria({...filterCriteria, maxExposureCap: e.target.value})}
              />
            </div>

            {/* Exposure Capping Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enableCapping"
                  checked={filterCriteria.enableExposureCapping}
                  onCheckedChange={(checked) => setFilterCriteria({
                    ...filterCriteria, 
                    enableExposureCapping: checked === true
                  })}
                />
                <Label htmlFor="enableCapping" className="font-medium cursor-pointer">
                  Enable Exposure Capping
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Cap each loan at specified amount (includes portion of larger loans)
              </p>
              <Input
                type="number"
                placeholder="e.g., 25000"
                value={filterCriteria.exposureCapAmount}
                onChange={(e) => setFilterCriteria({...filterCriteria, exposureCapAmount: e.target.value})}
                disabled={!filterCriteria.enableExposureCapping}
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
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
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