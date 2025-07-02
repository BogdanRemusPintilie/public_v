
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Trash2 } from 'lucide-react';
import { FileUploadSection } from './FileUploadSection';
import { PortfolioSummary } from './PortfolioSummary';
import { PortfolioCharts } from './PortfolioCharts';
import { DataPreviewTable } from './DataPreviewTable';
import { DataFilterPanel } from './DataFilterPanel';
import { LoanRecord } from '@/utils/supabase';
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
  isProcessing: boolean;
  portfolioSummary: {
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  } | null;
  previewData: LoanRecord[];
  allData: LoanRecord[];
  filteredData: LoanRecord[];
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
  onFilteredDataChange: (filteredData: LoanRecord[]) => void;
  onSaveFilteredDataset: (filteredData: LoanRecord[], datasetName: string) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  showExistingData,
  totalRecords,
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
  onSaveFilteredDataset
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
                    ? `View and manage your existing loan portfolio data ${totalRecords > 0 ? `(${totalRecords.toLocaleString()} total records)` : ''}`
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
                    {totalRecords > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isProcessing}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete All Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Complete Dataset?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete all {totalRecords.toLocaleString()} loan records from your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={onDeleteCompleteDataset}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All Data
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
                <FileUploadSection
                  datasetName={datasetName}
                  onDatasetNameChange={onDatasetNameChange}
                  onFileDrop={onFileDrop}
                  isProcessing={isProcessing}
                  uploadProgress={uploadProgress}
                  uploadStatus={uploadStatus}
                />
              )}

              {showExistingData && allData.length > 0 && (
                <DataFilterPanel
                  allData={allData}
                  onFilteredDataChange={onFilteredDataChange}
                  onSaveFilteredDataset={onSaveFilteredDataset}
                  isProcessing={isProcessing}
                />
              )}

              {portfolioSummary && (
                <PortfolioSummary portfolioSummary={portfolioSummary} />
              )}

              {(previewData.length > 0 || (showExistingData && allData.length > 0)) && (
                <>
                  <PortfolioCharts 
                    allData={showExistingData ? filteredData : allData}
                    previewData={previewData}
                    showExistingData={showExistingData}
                  />

                  <DataPreviewTable
                    previewData={previewData}
                    selectedRecords={selectedRecords}
                    showExistingData={showExistingData}
                    totalRecords={showExistingData ? filteredData.length : totalRecords}
                    currentPage={currentPage}
                    hasMore={hasMore}
                    isProcessing={isProcessing}
                    onSelectRecord={onSelectRecord}
                    onSelectAll={onSelectAll}
                    onDeleteSelected={onDeleteSelected}
                    onPageChange={onPageChange}
                  />
                </>
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
