import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw } from 'lucide-react';
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
  onFileDrop
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
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
          
          <CardContent>
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

            {(previewData.length > 0 || (showExistingData && allData.length > 0)) && (
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
          </CardContent>
          
          <CardFooter className="flex justify-end gap-4">
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
