import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { LoanRecord, insertLoanData, getLoanDataByDataset, deleteLoanDataByDataset, deleteLoanData } from '@/utils/supabase';
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
  const [filteredData, setFilteredData] = useState<LoanRecord[]>([]);
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
  const [datasetLoaded, setDatasetLoaded] = useState(false);
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
    setFilteredData([]);
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
    setDatasetLoaded(false);
  };

  const handleDatasetSelection = async (datasetName: string) => {
    setShowDatasetSelector(false);
    setSelectedDatasetName(datasetName);
    await loadDatasetDataFast(datasetName);
  };

  // Fast loading - only load first page initially
  const loadDatasetDataFast = async (datasetName: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      console.log(`📊 FAST LOADING DATASET: ${datasetName} (first page only)`);
      
      // Load only the first page for fast initial display
      const firstPageResult = await getLoanDataByDataset(datasetName, 0, PAGE_SIZE);
      setTotalRecords(firstPageResult.totalCount);
      setPreviewData(firstPageResult.data);
      setCurrentPage(0);
      setHasMore(firstPageResult.hasMore);
      setDatasetLoaded(true);
      
      // Initially set filtered data to first page only
      setFilteredData(firstPageResult.data);
      setAllData([]); // Don't load all data initially
      
      // Calculate quick summary for first page only
      if (firstPageResult.data.length > 0) {
        const quickSummary = {
          totalValue: firstPageResult.data.reduce((sum, loan) => sum + loan.opening_balance, 0),
          avgInterestRate: firstPageResult.data.length > 0 ? 
            firstPageResult.data.reduce((sum, loan) => sum + loan.interest_rate, 0) / firstPageResult.data.length : 0,
          highRiskLoans: firstPageResult.data.filter(loan => (loan.pd || 0) > 0.05).length,
          totalRecords: firstPageResult.totalCount
        };
        setPortfolioSummary(quickSummary);
      }
      
      toast({
        title: "Dataset Loaded",
        description: `Loaded first page (${firstPageResult.data.length.toLocaleString()} of ${firstPageResult.totalCount.toLocaleString()} records) from "${datasetName}"`,
      });
      
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
      setUploadStatus('');
    }
  };

  // Load ALL data when filters are needed
  const loadAllDataForFiltering = async () => {
    if (!user || !selectedDatasetName || allData.length > 0) return;
    
    try {
      setIsProcessing(true);
      setUploadStatus('Loading all data for filtering...');
      
      console.log(`📊 LOADING ALL DATA FOR FILTERING: ${selectedDatasetName}`);
      
      const allPages = [];
      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      
      // Load all pages
      for (let i = 0; i < totalPages; i++) {
        const pageResult = await getLoanDataByDataset(selectedDatasetName, i, PAGE_SIZE);
        allPages.push(...pageResult.data);
        
        // Update progress
        const progress = Math.round(((i + 1) / totalPages) * 100);
        setUploadStatus(`Loading all data: Page ${i + 1}/${totalPages} (${progress}%)`);
      }
      
      console.log(`📊 LOADED ALL DATA: ${allPages.length} records for filtering`);
      setAllData(allPages);
      
      toast({
        title: "All Data Loaded",
        description: `Loaded all ${allPages.length.toLocaleString()} records for filtering`,
      });
      
      return allPages;
      
    } catch (error) {
      console.error('❌ ERROR loading all data:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
    }
  };

  const handleFilteredDataChange = async (filtered: LoanRecord[]) => {
    // If we don't have all data loaded yet, load it first
    let dataToFilter = allData;
    if (allData.length === 0 && datasetLoaded) {
      console.log('🔍 FILTERS APPLIED - Loading all data first for filtering');
      dataToFilter = await loadAllDataForFiltering();
    }
    
    console.log(`🔍 FILTER APPLIED: ${filtered.length} records from ${dataToFilter.length} total`);
    setFilteredData(filtered);
    
    // Update preview data to show filtered results
    const firstPageData = filtered.slice(0, PAGE_SIZE);
    setPreviewData(firstPageData);
    setHasMore(filtered.length > PAGE_SIZE);
    setCurrentPage(0);
    setSelectedRecords(new Set()); // Clear selections when filter changes
    
    // Update portfolio summary based on filtered data
    if (filtered.length > 0) {
      calculatePortfolioSummary(filtered);
    } else {
      setPortfolioSummary(null);
    }
  };

  const handleSaveFilteredDataset = async (filteredRecords: LoanRecord[], newDatasetName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save filtered datasets",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setUploadStatus('Saving filtered dataset...');
      
      console.log('💾 SAVING FILTERED DATASET:', {
        datasetName: newDatasetName,
        recordCount: filteredRecords.length,
        userId: user.id,
        sampleRecord: filteredRecords[0]
      });
      
      // Prepare clean data for insertion - remove database-generated fields completely
      const dataWithUserId = filteredRecords.map(record => {
        // Extract only the fields we want to save, excluding database-generated ones
        const {
          loan_amount,
          interest_rate,
          term,
          loan_type,
          credit_score,
          ltv,
          opening_balance,
          pd,
          file_name,
          worksheet_name
        } = record;
        
        return {
          user_id: user.id,
          dataset_name: newDatasetName,
          loan_amount,
          interest_rate,
          term,
          loan_type,
          credit_score,
          ltv,
          opening_balance,
          pd,
          file_name,
          worksheet_name
        };
      });
      
      console.log('💾 PREPARED CLEAN DATA SAMPLE:', dataWithUserId[0]);
      
      await insertLoanData(dataWithUserId, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Saving filtered dataset: ${completed}/${total} records (${progress}%)`);
      });
      
      console.log('✅ FILTERED DATASET SAVED SUCCESSFULLY');
      
      toast({
        title: "Filtered Dataset Saved",
        description: `Successfully saved ${filteredRecords.length} records as "${newDatasetName}"`,
      });
      
    } catch (error) {
      console.error('❌ Error saving filtered dataset:', error);
      
      let errorMessage = "Failed to save filtered dataset. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check your account permissions.";
        }
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw to let the DataFilterPanel handle the error state
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
      setUploadProgress(0);
    }
  };

  // Handle pagination more efficiently for filtered data
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && showExistingData && filteredData.length > 0) {
      const startIndex = newPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageData = filteredData.slice(startIndex, endIndex);
      
      setPreviewData(pageData);
      setCurrentPage(newPage);
      setHasMore(endIndex < filteredData.length);
      
      // Clear selections when changing pages
      setSelectedRecords(new Set());
      
      console.log(`📊 PAGE CHANGE: Changed to page ${newPage}, showing ${pageData.length} records in table`);
    }
  };

  const calculatePortfolioSummary = (data: LoanRecord[]) => {
    console.log(`📊 PORTFOLIO CALCULATION START: Beginning calculation with ${data.length} records`);
    
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
    setPortfolioSummary(calculatedSummary);
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
      
      // Delete selected records
      await deleteLoanData(Array.from(selectedRecords));
      
      // Refresh dataset after deletion
      await loadDatasetDataFast(selectedDatasetName);
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
    if (!user || !selectedDatasetName || totalRecords === 0) {
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
      setFilteredData(parsedData.data);
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
      setFilteredData([]);
      setPortfolioSummary(null);
      setUploadStatus('');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleSaveToDatabase = async () => {
    console.log('🔍 SAVE TO DATABASE CLICKED - Checking conditions:', {
      selectedFile: !!selectedFile,
      user: !!user,
      userId: user?.id,
      previewDataLength: previewData.length,
      allDataLength: allData.length,
      datasetName: datasetName,
      datasetNameTrimmed: datasetName.trim(),
      isProcessing: isProcessing
    });

    // Use allData instead of previewData for saving all records
    const dataToSave = allData.length > 0 ? allData : previewData;
    
    if (!selectedFile || !user || dataToSave.length === 0) {
      console.log('❌ SAVE FAILED - Missing requirements:', {
        selectedFile: !!selectedFile,
        user: !!user,
        dataLength: dataToSave.length
      });
      
      toast({
        title: "Upload Error",
        description: "Please select a file and ensure you're logged in with data parsed",
        variant: "destructive",
      });
      return;
    }

    if (!datasetName.trim()) {
      console.log('❌ SAVE FAILED - No dataset name');
      toast({
        title: "Dataset Name Required",
        description: "Please enter a name for this dataset",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for user authentication
    if (!user.id || user.id.length < 30) {
      console.log('❌ SAVE FAILED - Invalid user ID:', user.id);
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
      console.log('💾 SAVING TO DATABASE:', dataToSave.length, 'records with user_id:', user.id, 'dataset_name:', datasetName);
      
      // Prepare data with user_id and dataset_name - let insertLoanData handle the rest
      const dataWithMetadata = dataToSave.map(loan => ({
        ...loan,
        user_id: user.id,
        dataset_name: datasetName.trim()
      }));
      
      console.log('💾 PREPARED DATA SAMPLE:', dataWithMetadata.slice(0, 2));
      
      // Use the batch insert function with progress tracking
      await insertLoanData(dataWithMetadata, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Uploading: ${completed}/${total} records (${progress}%)`);
        console.log(`📊 UPLOAD PROGRESS: ${completed}/${total} (${progress}%)`);
      });
      
      console.log('✅ UPLOAD SUCCESSFUL - Data saved to database');
      
      toast({
        title: "Upload Successful",
        description: `${dataToSave.length} loan records saved successfully as "${datasetName}"`,
      });
      
      // Clear the upload state but don't reset everything
      setSelectedFile(null);
      setDatasetName('');
      setPreviewData([]);
      setAllData([]);
      setFilteredData([]);
      setPortfolioSummary(null);
      setUploadProgress(0);
      setUploadStatus('');
      
      handleClose();
    } catch (error) {
      console.error('❌ ERROR uploading data:', error);
      
      let errorMessage = "Failed to save data to database. Please try again.";
      if (error instanceof Error) {
        console.error('❌ ERROR DETAILS:', error.message);
        if (error.message.includes('not authenticated')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('permission')) {
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
        filteredData={filteredData}
        selectedRecords={selectedRecords}
        currentPage={currentPage}
        hasMore={hasMore}
        datasetName={datasetName}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        onClose={handleClose}
        onRefreshData={() => loadDatasetDataFast(selectedDatasetName)}
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
        onFilteredDataChange={handleFilteredDataChange}
        onSaveFilteredDataset={handleSaveFilteredDataset}
      />
      
      <DatasetSharingManager 
        isOpen={showSharingManager}
        onClose={() => setShowSharingManager(false)}
      />
    </>
  );
};

export default ExcelUpload;
