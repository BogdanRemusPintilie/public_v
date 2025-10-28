
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Trash2 } from 'lucide-react';
import { FileUploadSection } from './FileUploadSection';
import { PortfolioSummary } from './PortfolioSummary';
import { CTLPortfolioSummary } from './CTLPortfolioSummary';
import { PortfolioCharts } from './PortfolioCharts';
import { CTLPortfolioCharts } from './CTLPortfolioCharts';
import { DataPreviewTable } from './DataPreviewTable';
import { DataFilterPanel } from './DataFilterPanel';
import { CTLDataFilterPanel } from './CTLDataFilterPanel';
import { LoanRecord } from '@/utils/supabase';
import { LoanType } from '@/utils/parsers/parserRegistry';
import { LoanTypeSelector } from '../LoanTypeSelector';
import { CTLPortfolioSummary as CTLSummaryType } from '@/utils/supabaseCTL';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExcelUploadModalProps {
  isOpen: boolean;
  showExistingData: boolean;
  totalRecords: number;
  selectedDatasetName: string;
  isProcessing: boolean;
  portfolioSummary: {
    totalValue?: number;
    totalExposure?: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
    avgLeverageRatio?: number;
    performingCount?: number;
    nonPerformingCount?: number;
    weightedAvgPd?: number;
    weightedAvgLgd?: number;
    expectedLoss?: number;
    avgLoanSize?: number;
  } | null;
  previewData: any[];
  allData: any[];
  filteredData: any[];
  selectedRecords: Set<string>;
  currentPage: number;
  hasMore: boolean;
  datasetName: string;
  uploadProgress: number;
  uploadStatus: string;
  onClose: () => void;
  onRefreshData: () => void;
  onShowSharingManager: () => void;
  onClearData: () => void;
  onSaveToDatabase: () => void;
  onDatasetNameChange: (name: string) => void;
  onSelectRecord: (recordId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onDeleteCompleteDataset: () => void;
  onPageChange: (page: number) => void;
  onFileDrop: (files: File[]) => void;
  onFilteredDataChange: (filteredData: any[], filters?: any, filteredCount?: number) => void;
  onSaveFilteredDataset: (filteredData: any[], datasetName: string) => void;
  onPortfolioSummaryChange: (summary: any) => void;
  currentFilters?: any;
  filteredCount?: number;
  selectedLoanType: LoanType;
  onLoanTypeChange: (type: LoanType) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  showExistingData,
  totalRecords,
  selectedDatasetName,
  isProcessing,
  portfolioSummary,
  previewData,
  allData,
  filteredData,
  selectedRecords,
  currentPage,
  hasMore,
  datasetName,
  uploadProgress,
  uploadStatus,
  onClose,
  onRefreshData,
  onShowSharingManager,
  onClearData,
  onSaveToDatabase,
  onDatasetNameChange,
  onSelectRecord,
  onSelectAll,
  onDeleteSelected,
  onDeleteCompleteDataset,
  onPageChange,
  onFileDrop,
  onFilteredDataChange,
  onSaveFilteredDataset,
  onPortfolioSummaryChange,
  currentFilters,
  filteredCount,
  selectedLoanType,
  onLoanTypeChange
}) => {
  if (!isOpen) return null;

  // Check if we have data to save (either from upload or existing data)
  const hasDataToSave = allData.length > 0 || previewData.length > 0;
  const isSaveButtonDisabled = isProcessing || !hasDataToSave || !datasetName.trim();

  console.log('🔍 MODAL RENDER - Save button state:', {
    isProcessing,
    hasDataToSave,
    allDataLength: allData.length,
    previewDataLength: previewData.length,
    datasetName: datasetName,
    datasetNameTrimmed: datasetName.trim(),
    isSaveButtonDisabled
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto border w-full max-w-6xl shadow-lg rounded-md bg-white h-[90vh] flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {showExistingData ? "Manage Existing Data" : "Upload Excel File"}
                </CardTitle>
                <CardDescription>
                  {showExistingData 
                    ? `View and manage your existing loan portfolio data ${allData.length > 0 ? `(${allData.length.toLocaleString()} total records)` : ''}`
                    : "Upload your loan portfolio data in .xlsx or .xls format. Looking for 'loan_tape' worksheet."
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {showExistingData && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowSharingManager}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Sharing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefreshData}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    {allData.length > 0 && selectedDatasetName && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isProcessing}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Dataset
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Dataset "{selectedDatasetName}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the entire dataset <strong>"{selectedDatasetName}"</strong> containing {allData.length.toLocaleString()} loan records and all associated tranche structures. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={onDeleteCompleteDataset}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Dataset
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {!showExistingData && (
                <>
                  <LoanTypeSelector 
                    value={selectedLoanType}
                    onChange={onLoanTypeChange}
                    disabled={isProcessing || previewData.length > 0}
                  />
                  <FileUploadSection
                    datasetName={datasetName}
                    onDatasetNameChange={onDatasetNameChange}
                    onFileDrop={onFileDrop}
                    isProcessing={isProcessing}
                    uploadProgress={uploadProgress}
                    uploadStatus={uploadStatus}
                  />
                </>
              )}

              {showExistingData && selectedDatasetName && (
                selectedLoanType === 'corporate_term_loans' ? (
                  <CTLDataFilterPanel
                    datasetName={selectedDatasetName}
                    totalRecords={totalRecords}
                    onFilteredDataChange={onFilteredDataChange}
                    onSaveFilteredDataset={onSaveFilteredDataset}
                    onPortfolioSummaryChange={onPortfolioSummaryChange}
                    isProcessing={isProcessing}
                  />
                ) : (
                  <DataFilterPanel
                    datasetName={selectedDatasetName}
                    totalRecords={totalRecords}
                    onFilteredDataChange={onFilteredDataChange}
                    onSaveFilteredDataset={onSaveFilteredDataset}
                    onPortfolioSummaryChange={onPortfolioSummaryChange}
                    isProcessing={isProcessing}
                  />
                )
              )}

              {portfolioSummary && selectedLoanType === 'corporate_term_loans' && (
                <CTLPortfolioSummary portfolioSummary={{
                  totalExposure: (portfolioSummary as any).totalValue ?? (portfolioSummary as any).totalExposure ?? 0,
                  avgInterestRate: portfolioSummary.avgInterestRate,
                  highRiskLoans: portfolioSummary.highRiskLoans,
                  totalRecords: portfolioSummary.totalRecords,
                  avgLeverageRatio: portfolioSummary.avgLeverageRatio || 0,
                  performingCount: portfolioSummary.performingCount || 0,
                  nonPerformingCount: portfolioSummary.nonPerformingCount || 0,
                  weightedAvgPd: portfolioSummary.weightedAvgPd || 0,
                  weightedAvgLgd: portfolioSummary.weightedAvgLgd || 0,
                  expectedLoss: portfolioSummary.expectedLoss || 0,
                  avgLoanSize: portfolioSummary.avgLoanSize || 0,
                }} />
              )}
              
              {portfolioSummary && selectedLoanType === 'consumer_finance' && (
                <PortfolioSummary portfolioSummary={{
                  totalValue: portfolioSummary.totalValue || 0,
                  avgInterestRate: portfolioSummary.avgInterestRate,
                  highRiskLoans: portfolioSummary.highRiskLoans,
                  totalRecords: portfolioSummary.totalRecords,
                }} />
              )}

              {(previewData.length > 0 || (showExistingData && totalRecords > 0)) && selectedLoanType === 'corporate_term_loans' && (
                <CTLPortfolioCharts
                  allData={allData}
                  previewData={previewData}
                  showExistingData={showExistingData}
                  selectedDatasetName={selectedDatasetName}
                />
              )}

              {(previewData.length > 0 || (showExistingData && totalRecords > 0)) && selectedLoanType === 'consumer_finance' && (
                <>
                  <PortfolioCharts 
                    allData={showExistingData ? (filteredData.length > 0 ? filteredData : allData) : allData}
                    previewData={previewData}
                    showExistingData={showExistingData}
                    selectedDatasetName={selectedDatasetName}
                    filters={currentFilters}
                    totalRecords={totalRecords}
                    filteredCount={filteredCount}
                  />

                  <DataPreviewTable
                    previewData={previewData}
                    selectedRecords={selectedRecords}
                    showExistingData={showExistingData}
                    totalRecords={showExistingData ? (currentFilters ? (filteredCount || filteredData.length) : totalRecords) : totalRecords}
                    currentPage={currentPage}
                    hasMore={hasMore}
                    isProcessing={isProcessing}
                    selectedLoanType={selectedLoanType}
                    onSelectRecord={onSelectRecord}
                    onSelectAll={onSelectAll}
                    onDeleteSelected={onDeleteSelected}
                    onPageChange={onPageChange}
                  />
                </>
              )}

              {(previewData.length > 0 || (showExistingData && totalRecords > 0)) && selectedLoanType === 'corporate_term_loans' && (
                <DataPreviewTable
                  previewData={previewData}
                  selectedRecords={selectedRecords}
                  showExistingData={showExistingData}
                  totalRecords={showExistingData ? (currentFilters ? (filteredCount || filteredData.length) : totalRecords) : totalRecords}
                  currentPage={currentPage}
                  hasMore={hasMore}
                  isProcessing={isProcessing}
                  selectedLoanType={selectedLoanType}
                  onSelectRecord={onSelectRecord}
                  onSelectAll={onSelectAll}
                  onDeleteSelected={onDeleteSelected}
                  onPageChange={onPageChange}
                />
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-4 flex-shrink-0 border-t">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            {hasDataToSave && !showExistingData && (
              <Button variant="destructive" onClick={onClearData}>Clear Data</Button>
            )}
            {!showExistingData && (
              <Button 
                onClick={onSaveToDatabase} 
                disabled={isSaveButtonDisabled}
                className={`${isSaveButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadStatus || 'Saving...'}
                  </>
                ) : (
                  "Save to Database"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
