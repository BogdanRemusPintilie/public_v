import React, { useState, useEffect, useCallback } from 'react';
import { ExcelUploadModal } from './ExcelUploadModal';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { 
  insertLoanData, 
  getLoanDataByDataset, 
  deleteLoanData,
  deleteLoanDataByDataset,
  LoanRecord
} from '@/utils/supabase';
import { parseExcelFile } from '@/utils/excelParser';

interface ExcelUploadProps {
  isOpen: boolean;
  showExistingData: boolean;
  selectedDatasetName: string;
  onClose: () => void;
  onRefreshData: () => void;
  onShowSharingManager: () => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({
  isOpen,
  showExistingData,
  selectedDatasetName,
  onClose,
  onRefreshData,
  onShowSharingManager,
}) => {
  const [allData, setAllData] = useState<LoanRecord[]>([]);
  const [previewData, setPreviewData] = useState<LoanRecord[]>([]);
  const [filteredData, setFilteredData] = useState<LoanRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [datasetName, setDatasetName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [portfolioSummary, setPortfolioSummary] = useState<{
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data when modal opens with selected dataset
  const loadExistingData = useCallback(async () => {
    if (!showExistingData || !selectedDatasetName || !user) return;

    try {
      setIsProcessing(true);
      console.log('Loading existing data for dataset:', selectedDatasetName);

      // Load data in parallel for faster loading
      const [pageResult, allDataResult] = await Promise.all([
        // Load first page for preview
        getLoanDataByDataset(selectedDatasetName, 0, 1000),
        // Load a larger subset for portfolio summary and charts (first 10k records for performance)
        getLoanDataByDataset(selectedDatasetName, 0, 10000)
      ]);

      // Set preview data from first page
      setPreviewData(pageResult.data);
      setTotalRecords(pageResult.totalCount);
      setHasMore(pageResult.hasMore);
      setCurrentPage(0);

      // Use the larger subset for portfolio summary and charts
      setAllData(allDataResult.data);
      setFilteredData(allDataResult.data);

      // Calculate portfolio summary from the loaded data
      if (allDataResult.data.length > 0) {
        const totalValue = allDataResult.data.reduce((sum, loan) => sum + loan.opening_balance, 0);
        const avgInterestRate = allDataResult.data.reduce((sum, loan) => sum + loan.interest_rate, 0) / allDataResult.data.length;
        const highRiskLoans = allDataResult.data.filter(loan => (loan.pd || 0) > 0.05).length;

        setPortfolioSummary({
          totalValue,
          avgInterestRate,
          highRiskLoans,
          totalRecords: pageResult.totalCount // Use actual total count from database
        });
      }

      toast({
        title: "Data Loaded",
        description: `Loaded ${pageResult.totalCount.toLocaleString()} records from ${selectedDatasetName}`,
      });
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load existing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [showExistingData, selectedDatasetName, user, toast]);

  // Load data when modal opens or dataset changes
  useEffect(() => {
    if (isOpen) {
      if (showExistingData) {
        loadExistingData();
      } else {
        // Reset state for new upload
        setAllData([]);
        setPreviewData([]);
        setFilteredData([]);
        setSelectedRecords(new Set());
        setPortfolioSummary(null);
        setCurrentPage(0);
        setTotalRecords(0);
        setDatasetName('');
      }
    }
  }, [isOpen, showExistingData, loadExistingData]);

  const handleFileDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadStatus('Reading Excel file...');
      
      const parsedData = await parseExcelFile(file);
      
      if (parsedData.length === 0) {
        toast({
          title: "No Data Found",
          description: "The Excel file doesn't contain any valid loan data",
          variant: "destructive",
        });
        return;
      }

      // Calculate portfolio summary
      const totalValue = parsedData.reduce((sum, loan) => sum + loan.opening_balance, 0);
      const avgInterestRate = parsedData.reduce((sum, loan) => sum + loan.interest_rate, 0) / parsedData.length;
      const highRiskLoans = parsedData.filter(loan => (loan.pd || 0) > 0.05).length;

      setPortfolioSummary({
        totalValue,
        avgInterestRate,
        highRiskLoans,
        totalRecords: parsedData.length
      });

      setAllData(parsedData);
      setPreviewData(parsedData.slice(0, 100)); // Show first 100 for preview
      setTotalRecords(parsedData.length);

      toast({
        title: "File Uploaded Successfully",
        description: `Parsed ${parsedData.length.toLocaleString()} loan records`,
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: "Error Parsing File",
        description: "Failed to parse the Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
    }
  }, [toast]);

  const handleSaveToDatabase = async () => {
    if (!user || allData.length === 0 || !datasetName.trim()) {
      toast({
        title: "Cannot Save",
        description: "Please ensure you're logged in, have data to save, and have entered a dataset name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadStatus('Preparing data for upload...');

      const dataToSave = allData.map(loan => ({
        ...loan,
        user_id: user.id,
        dataset_name: datasetName.trim(),
      }));

      console.log('Saving to database:', {
        recordCount: dataToSave.length,
        datasetName: datasetName.trim(),
        userId: user.id
      });

      await insertLoanData(dataToSave, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Saving records: ${completed.toLocaleString()} of ${total.toLocaleString()}`);
      });

      toast({
        title: "Data Saved Successfully",
        description: `Saved ${dataToSave.length.toLocaleString()} loan records to dataset "${datasetName}"`,
      });

      // Clear the form and close modal
      setAllData([]);
      setPreviewData([]);
      setPortfolioSummary(null);
      setDatasetName('');
      setUploadProgress(0);
      setUploadStatus('');
      onRefreshData();
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error Saving Data",
        description: "Failed to save data to database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(previewData.filter(r => r.id).map(r => r.id!));
      setSelectedRecords(allIds);
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecords.size === 0) return;

    try {
      setIsProcessing(true);
      await deleteLoanData(Array.from(selectedRecords));
      
      // Reload data after deletion
      await loadExistingData();
      setSelectedRecords(new Set());
      
      toast({
        title: "Records Deleted",
        description: `Successfully deleted ${selectedRecords.size} records`,
      });
    } catch (error) {
      console.error('Error deleting records:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCompleteDataset = async () => {
    if (!selectedDatasetName) return;

    try {
      setIsProcessing(true);
      await deleteLoanDataByDataset(selectedDatasetName);
      
      toast({
        title: "Dataset Deleted",
        description: `Successfully deleted all data from ${selectedDatasetName}`,
      });
      
      onRefreshData();
      onClose();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!selectedDatasetName || isProcessing) return;

    try {
      setIsProcessing(true);
      const result = await getLoanDataByDataset(selectedDatasetName, page, 1000);
      
      setPreviewData(result.data);
      setCurrentPage(page);
      setHasMore(result.hasMore);
      setSelectedRecords(new Set()); // Clear selection when changing pages
    } catch (error) {
      console.error('Error loading page:', error);
      toast({
        title: "Error Loading Page",
        description: "Failed to load the requested page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearData = () => {
    setAllData([]);
    setPreviewData([]);
    setPortfolioSummary(null);
    setDatasetName('');
    setUploadProgress(0);
    setUploadStatus('');
  };

  const handleFilteredDataChange = (newFilteredData: LoanRecord[]) => {
    setFilteredData(newFilteredData);
    // Update preview to show filtered data
    setPreviewData(newFilteredData.slice(0, 1000));
  };

  const handleSaveFilteredDataset = (filteredData: LoanRecord[], newDatasetName: string) => {
    // This would save the filtered data as a new dataset
    console.log('Saving filtered dataset:', { count: filteredData.length, name: newDatasetName });
    // Implementation would be similar to handleSaveToDatabase but with filtered data
  };

  return (
    <ExcelUploadModal
      isOpen={isOpen}
      showExistingData={showExistingData}
      totalRecords={totalRecords}
      selectedDatasetName={selectedDatasetName}
      isProcessing={isProcessing}
      portfolioSummary={portfolioSummary}
      previewData={previewData}
      allData={allData}
      filteredData={filteredData}
      selectedRecords={selectedRecords}
      currentPage={currentPage}
      hasMore={hasMore}
      datasetName={datasetName}
      uploadProgress={uploadProgress}
      uploadStatus={uploadStatus}
      onClose={onClose}
      onRefreshData={onRefreshData}
      onShowSharingManager={onShowSharingManager}
      onClearData={handleClearData}
      onSaveToDatabase={handleSaveToDatabase}
      onDatasetNameChange={setDatasetName}
      onSelectRecord={handleSelectRecord}
      onSelectAll={handleSelectAll}
      onDeleteSelected={handleDeleteSelected}
      onDeleteCompleteDataset={handleDeleteCompleteDataset}
      onPageChange={handlePageChange}
      onFileDrop={handleFileDrop}
      onFilteredDataChange={handleFilteredDataChange}
      onSaveFilteredDataset={handleSaveFilteredDataset}
    />
  );
};

export default ExcelUpload;
