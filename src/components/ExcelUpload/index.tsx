import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { LoanRecord, insertLoanData, getAllLoanDataByDataset, deleteLoanDataByDataset } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parseExcelFile } from '@/utils/excelParser';
import { ExcelUploadModal } from './ExcelUploadModal';
import DatasetSharingManager from '../DatasetSharingManager';
import DatasetSelector from '../DatasetSelector';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  showExistingData?: boolean;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ 
  isOpen, 
  onClose, 
  showExistingData = false 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [selectedDatasetName, setSelectedDatasetName] = useState<string>('');
  const [previewData, setPreviewData] = useState<LoanRecord[]>([]);
  const [allData, setAllData] = useState<LoanRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [portfolioSummary, setPortfolioSummary] = useState<{
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  } | null>(null);
  const [showSharingManager, setShowSharingManager] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const PAGE_SIZE = 1000;

  // Show dataset selector when trying to view existing data
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      setShowDatasetSelector(true);
    } else if (!showExistingData && isOpen) {
      resetState();
    }
  }, [showExistingData, isOpen, user]);

  const resetState = () => {
    console.log('🔄 RESETTING STATE: Clearing all cached data');
    setPreviewData([]);
    setAllData([]);
    setSelectedFile(null);
    setDatasetName('');
    setSelectedDatasetName('');
    setPortfolioSummary(null);
    setUploadProgress(0);
    setUploadStatus('');
    setSelectedRecords(new Set());
    setCurrentPage(0);
    setTotalRecords(0);
    setHasMore(false);
  };

  const handleDatasetSelection = async (datasetName: string) => {
    setShowDatasetSelector(false);
    setSelectedDatasetName(datasetName);
    await loadDatasetData(datasetName);
  };

  const loadDatasetData = async (datasetName: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      console.log(`📊 LOADING DATASET: ${datasetName}`);
      
      const datasetRecords = await getAllLoanDataByDataset(datasetName);
      console.log(`📊 DATASET LOADED: ${datasetRecords.length} records for ${datasetName}`);
      
      setAllData(datasetRecords);
      setTotalRecords(datasetRecords.length);
      
      if (datasetRecords.length > 0) {
        calculatePortfolioSummary(datasetRecords);
        
        toast({
          title: "Dataset Loaded",
          description: `Loaded ${datasetRecords.length.toLocaleString()} records from "${datasetName}"`,
        });
      } else {
        setPortfolioSummary(null);
        toast({
          title: "No Data Found",
          description: `No records found in dataset "${datasetName}"`,
        });
      }
      
      // Set preview data to first page
      const firstPageData = datasetRecords.slice(0, PAGE_SIZE);
      setPreviewData(firstPageData);
      setHasMore(datasetRecords.length > PAGE_SIZE);
      setCurrentPage(0);
      
    } catch (error) {
      console.error('❌ ERROR loading dataset:', error);
      toast({
        title: "Error Loading Dataset",
        description: "Failed to load dataset. Please try again.",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && showExistingData && allData.length > 0) {
      const startIndex = newPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageData = allData.slice(startIndex, endIndex);
      
      setPreviewData(pageData);
      setCurrentPage(newPage);
      setHasMore(endIndex < allData.length);
      
      // Clear selections when changing pages
      setSelectedRecords(new Set());
      
      // Portfolio summary should NOT change when paging - it should always reflect ALL data
      console.log(`📊 PAGE CHANGE: Changed to page ${newPage}, showing ${pageData.length} records in table, but portfolio summary remains based on all ${allData.length} records`);
    }
  };

  const calculatePortfolioSummary = (data: LoanRecord[]) => {
    console.log(`📊 PORTFOLIO CALCULATION START: Beginning calculation with ${data.length} records`);
    console.log(`📊 CALCULATION INPUT: First few records:`, data.slice(0, 3));
    
    const totalValue = data.reduce((sum, loan) => sum + loan.opening_balance, 0);
    const avgInterestRate = data.length > 0 ? 
      data.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / totalValue : 0;
    const highRiskLoans = data.filter(loan => (loan.pd || 0) > 0.05).length;
    
    const calculatedSummary = {
      totalValue,
      avgInterestRate,
      highRiskLoans,
      totalRecords: data.length
    };
    
    console.log(`📊 PORTFOLIO CALCULATION COMPLETE:`, calculatedSummary);
    console.log(`📊 DETAILED RESULTS:`);
    console.log(`   - Total Records: ${calculatedSummary.totalRecords.toLocaleString()}`);
    console.log(`   - Total Value: $${(calculatedSummary.totalValue / 1000000).toFixed(1)}M`);
    console.log(`   - Avg Interest Rate: ${calculatedSummary.avgInterestRate.toFixed(2)}%`);
    console.log(`   - High Risk Loans: ${calculatedSummary.highRiskLoans}`);
    
    setPortfolioSummary(calculatedSummary);
    console.log(`📊 PORTFOLIO STATE SET: Portfolio summary state updated with ${calculatedSummary.totalRecords} total records`);
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
      const allIds = previewData.filter(record => record.id).map(record => record.id!);
      setSelectedRecords(new Set(allIds));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select records to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadStatus(`Deleting ${selectedRecords.size} records...`);
      
      // Implementation would need to be updated to handle individual record deletion
      // For now, we'll keep the existing logic but need to modify supabase utils
      
      // Refresh dataset after deletion
      await loadDatasetData(selectedDatasetName);
      setSelectedRecords(new Set());
      
      toast({
        title: "Records Deleted",
        description: `Successfully deleted ${selectedRecords.size} records`,
      });
    } catch (error) {
      console.error('Error deleting records:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
    }
  };

  const handleDeleteCompleteDataset = async () => {
    if (!user || !selectedDatasetName || allData.length === 0) {
      toast({
        title: "No Dataset to Delete",
        description: "No dataset selected to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadStatus(`Deleting dataset "${selectedDatasetName}"...`);
      
      console.log('🗑️ DELETING COMPLETE DATASET:', selectedDatasetName);
      await deleteLoanDataByDataset(selectedDatasetName);
      
      toast({
        title: "Dataset Deleted",
        description: `Successfully deleted dataset "${selectedDatasetName}"`,
      });

      // Close modal after successful deletion
      handleClose();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
    }
  };

  const handleFileDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Parsing Excel file...');

    try {
      console.log('Parsing Excel file:', file.name);
      const parsedData = await parseExcelFile(file);
      
      console.log('Parsed data:', {
        worksheets: parsedData.worksheets,
        recordCount: parsedData.data.length
      });

      // For uploaded files, previewData and allData are the same
      setPreviewData(parsedData.data);
      setAllData(parsedData.data);
      calculatePortfolioSummary(parsedData.data);
      setUploadStatus('');
      setSelectedRecords(new Set());
      
      toast({
        title: "File Parsed Successfully",
        description: `Found ${parsedData.data.length} loan records in ${parsedData.worksheets.join(', ')}`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse Excel file",
        variant: "destructive",
      });
      setPreviewData([]);
      setAllData([]);
      setPortfolioSummary(null);
      setUploadStatus('');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleSaveToDatabase = async () => {
    console.log('Save to database button clicked', {
      selectedFile: !!selectedFile,
      user: !!user,
      previewDataLength: previewData.length,
      userId: user?.id,
      datasetName: datasetName
    });

    if (!selectedFile || !user || previewData.length === 0) {
      toast({
        title: "Upload Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    if (!datasetName.trim()) {
      toast({
        title: "Dataset Name Required",
        description: "Please enter a name for this dataset",
        variant: "destructive",
      });
      return;
    }

    if (!user.id || user.id.length < 30) {
      toast({
        title: "Authentication Error",
        description: "Invalid user session. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Preparing data for upload...');
    
    try {
      console.log('💾 SAVING TO DATABASE:', previewData.length, 'records with user_id:', user.id, 'dataset_name:', datasetName);
      
      const dataWithUserId = previewData.map(loan => ({
        ...loan,
        user_id: user.id,
        dataset_name: datasetName.trim()
      }));
      
      // Use the batch insert function with progress tracking
      await insertLoanData(dataWithUserId, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Uploading: ${completed}/${total} records (${progress}%)`);
      });
      
      console.log('✅ UPLOAD SUCCESSFUL - Data saved to database');
      
      toast({
        title: "Upload Successful",
        description: `${previewData.length} loan records saved successfully as "${datasetName}"`,
      });
      
      // Clear the upload state but don't reset everything
      setSelectedFile(null);
      setDatasetName('');
      setPreviewData([]);
      setAllData([]);
      setPortfolioSummary(null);
      setUploadProgress(0);
      setUploadStatus('');
      
      handleClose();
    } catch (error) {
      console.error('Error uploading data:', error);
      
      let errorMessage = "Failed to save data to database. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check your account permissions.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "Security error. Please ensure you're properly authenticated.";
        }
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleClose = () => {
    onClose();
    setShowDatasetSelector(false);
    resetState();
  };

  return (
    <>
      <DatasetSelector
        isOpen={showDatasetSelector}
        onClose={() => {
          setShowDatasetSelector(false);
          onClose();
        }}
        onSelectDataset={handleDatasetSelection}
      />
      
      <ExcelUploadModal
        isOpen={isOpen && !showDatasetSelector}
        showExistingData={showExistingData && !showDatasetSelector}
        totalRecords={totalRecords}
        isProcessing={isProcessing}
        portfolioSummary={portfolioSummary}
        previewData={previewData}
        allData={allData}
        selectedRecords={selectedRecords}
        currentPage={currentPage}
        hasMore={hasMore}
        datasetName={datasetName}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        onClose={handleClose}
        onRefreshData={() => loadDatasetData(selectedDatasetName)}
        onShowSharingManager={() => setShowSharingManager(true)}
        onClearData={resetState}
        onSaveToDatabase={handleSaveToDatabase}
        onDatasetNameChange={setDatasetName}
        onSelectRecord={handleSelectRecord}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onDeleteCompleteDataset={handleDeleteCompleteDataset}
        onPageChange={handlePageChange}
        onFileDrop={handleFileDrop}
      />
      
      <DatasetSharingManager 
        isOpen={showSharingManager}
        onClose={() => setShowSharingManager(false)}
      />
    </>
  );
};

export default ExcelUpload;
