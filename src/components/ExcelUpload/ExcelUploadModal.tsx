
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { FileUploadSection } from './FileUploadSection';
import { PortfolioSummary } from './PortfolioSummary';
import { PortfolioCharts } from './PortfolioCharts';
import { DataPreviewTable } from './DataPreviewTable';
import { LoanRecord } from '@/utils/supabase';

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
  selectedRecords: Set<string>;
  currentPage: number;
  hasMore: boolean;
  datasetName: string;
  uploadProgress: number;
  uploadStatus: string;
  isTableDataLoaded: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  onShowSharingManager: () => void;
  onClearData: () => void;
  onSaveToDatabase: () => void;
  onDatasetNameChange: (name: string) => void;
  onSelectRecord: (recordId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onPageChange: (page: number) => void;
  onFileDrop: (files: File[]) => void;
  onLoadTableData: () => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  showExistingData,
  totalRecords,
  isProcessing,
  portfolioSummary,
  previewData,
  allData,
  selectedRecords,
  currentPage,
  hasMore,
  datasetName,
  uploadProgress,
  uploadStatus,
  isTableDataLoaded,
  onClose,
  onRefreshData,
  onShowSharingManager,
  onClearData,
  onSaveToDatabase,
  onDatasetNameChange,
  onSelectRecord,
  onSelectAll,
  onDeleteSelected,
  onPageChange,
  onFileDrop,
  onLoadTableData
}) => {
  if (!isOpen) return null;

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
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Show loading indicator when processing existing data */}
              {showExistingData && isProcessing && !portfolioSummary && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading portfolio data...</span>
                  </div>
                </div>
              )}

              {/* Show loading indicator when processing table data */}
              {showExistingData && isProcessing && portfolioSummary && isTableDataLoaded && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading {totalRecords.toLocaleString()} records...</span>
                  </div>
                </div>
              )}

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

              {portfolioSummary && (
                <PortfolioSummary portfolioSummary={portfolioSummary} />
              )}

              {showExistingData && portfolioSummary && (
                <PortfolioCharts 
                  allData={allData}
                  previewData={previewData}
                  showExistingData={showExistingData}
                  portfolioSummary={portfolioSummary}
                />
              )}

              {!showExistingData && (previewData.length > 0 || allData.length > 0) && (
                <>
                  <PortfolioCharts 
                    allData={allData}
                    previewData={previewData}
                    showExistingData={showExistingData}
                  />

                  <DataPreviewTable
                    previewData={previewData}
                    selectedRecords={selectedRecords}
                    showExistingData={showExistingData}
                    totalRecords={totalRecords}
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

              {showExistingData && portfolioSummary && !isTableDataLoaded && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={onLoadTableData}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Data Table ({totalRecords.toLocaleString()} records)
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Click to load the data table (may take a moment for large datasets)
                  </p>
                </div>
              )}

              {showExistingData && isTableDataLoaded && previewData.length > 0 && (
                <DataPreviewTable
                  previewData={previewData}
                  selectedRecords={selectedRecords}
                  showExistingData={showExistingData}
                  totalRecords={totalRecords}
                  currentPage={currentPage}
                  hasMore={hasMore}
                  isProcessing={isProcessing}
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
            {previewData.length > 0 && !showExistingData && (
              <Button variant="destructive" onClick={onClearData}>Clear Data</Button>
            )}
            {!showExistingData && (
              <Button onClick={onSaveToDatabase} disabled={isProcessing || previewData.length === 0 || !datasetName.trim()}>
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
