import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { LoanRecord, insertLoanData, getLoanDataByDataset, deleteLoanDataByDataset, deleteLoanData, getPortfolioSummary } from '@/utils/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PARSER_REGISTRY, LoanType } from '@/utils/parsers/parserRegistry';
import { CorporateTermLoanRecord } from '@/utils/parsers/corporateTermLoansParser';
import { insertCorporateTermLoans, getCorporateTermLoansByDataset, deleteCorporateTermLoansByDataset, deleteCorporateTermLoans, getCTLPortfolioSummary } from '@/utils/supabaseCTL';
import { ExcelUploadModal } from './ExcelUploadModal';
import DatasetSharingManager from '../DatasetSharingManager';
import DatasetSelector, { clearDatasetCache } from '../DatasetSelector';
import { LoanTypeSelector } from '../LoanTypeSelector';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  showExistingData?: boolean;
  onDatasetUploaded?: () => void; // New prop to notify parent of dataset uploads
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ 
  isOpen, 
  onClose, 
  showExistingData = false,
  onDatasetUploaded 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [selectedDatasetName, setSelectedDatasetName] = useState<string>('');
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>('consumer_finance');
  const [previewData, setPreviewData] = useState<LoanRecord[] | CorporateTermLoanRecord[]>([]);
  const [allData, setAllData] = useState<LoanRecord[] | CorporateTermLoanRecord[]>([]);
  const [filteredData, setFilteredData] = useState<LoanRecord[] | CorporateTermLoanRecord[]>([]);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [filteredCount, setFilteredCount] = useState<number>(0);
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
  const [datasetRefreshTrigger, setDatasetRefreshTrigger] = useState(0);
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
    setFilteredData([]);
    setSelectedFile(null);
    setDatasetName('');
    setSelectedDatasetName('');
    setSelectedLoanType('consumer_finance');
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

  // Load all dataset data for filtering (note: this loads all records at once)
  const loadDatasetData = async (datasetName: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      console.log(`📊 LOADING DATASET SUMMARY: ${datasetName}`);
      
      // First, load portfolio summary immediately (fast)
      const portfolioSummary = await getPortfolioSummary(datasetName);
      setPortfolioSummary(portfolioSummary);
      
      // Get the total count without loading all data
      const firstBatch = await getLoanDataByDataset(datasetName, 0, PAGE_SIZE);
      const firstPageRecords = firstBatch.data || [];
      const totalCount = firstBatch.totalCount || 0;
      
      console.log(`✅ DATASET SUMMARY LOADED: ${totalCount} total records, showing first ${firstPageRecords.length}`);
      
      // Set minimal data for immediate display
      setPreviewData(firstPageRecords);
      setFilteredData([]); // Clear filtered data
      setCurrentFilters(null); // Clear any active filters
      setAllData([]); // Don't load all data initially - use totalRecords instead
      setCurrentPage(0);
      setTotalRecords(totalCount);
      setHasMore(totalCount > PAGE_SIZE);
      
      
      if (totalCount > 0) {
        toast({
          title: "Dataset Selected",
          description: `Dataset "${datasetName}" has ${totalCount.toLocaleString()} records. Use filters or pagination to view data.`,
        });
      } else {
        setPortfolioSummary(null);
        toast({
          title: "No Data Found",
          description: `No records found in dataset "${datasetName}"`,
        });
      }
      
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

  const handleFilteredDataChange = async (filtered: LoanRecord[], filters?: any, actualFilteredCount?: number) => {
    setFilteredData(filtered);
    setCurrentFilters(filters);
    setFilteredCount(actualFilteredCount || 0);
    
    if (filtered.length === 0 && filters === null) {
      // Clear filters case - reset to show full dataset
      // If no filters applied, get fresh portfolio summary from database
      if (selectedDatasetName) {
        const portfolioSummary = await getPortfolioSummary(selectedDatasetName);
        setPortfolioSummary(portfolioSummary);
        
        // For preview mode with uploaded data, fall back to client-side calculation
        if (!portfolioSummary && allData.length > 0) {
          const originalSummary = {
            totalValue: allData.reduce((sum, loan) => sum + loan.opening_balance, 0),
            avgInterestRate: allData.length > 0 ? 
              allData.reduce((sum, loan) => sum + loan.interest_rate, 0) / allData.length : 0,
            highRiskLoans: allData.filter(loan => (loan.pd || 0) > 0.10).length,
            totalRecords: allData.length
          };
          setPortfolioSummary(originalSummary);
        }
      }
      
      // Show original data
      setPreviewData(allData.slice(0, PAGE_SIZE));
      setHasMore(allData.length > PAGE_SIZE);
      setCurrentPage(0);
      setSelectedRecords(new Set());
    } else {
      // For filtered data, use database-side calculation if we have a dataset
      if (selectedDatasetName && filters) {
        const filteredSummary = await getPortfolioSummary(selectedDatasetName, filters);
        setPortfolioSummary(filteredSummary);
      } else {
        // Fallback to client-side calculation for preview mode
        const filteredSummary = {
          totalValue: filtered.reduce((sum, loan) => sum + loan.opening_balance, 0),
          avgInterestRate: filtered.length > 0 ? 
            filtered.reduce((sum, loan) => sum + loan.interest_rate, 0) / filtered.length : 0,
          highRiskLoans: filtered.filter(loan => (loan.pd || 0) > 0.10).length,
          totalRecords: filtered.length
        };
        setPortfolioSummary(filteredSummary);
      }
      
      // Update preview data to show filtered results
      const firstPageData = filtered.slice(0, PAGE_SIZE);
      setPreviewData(firstPageData);
      setHasMore(filtered.length > PAGE_SIZE);
      setCurrentPage(0);
      setSelectedRecords(new Set()); // Clear selections when filter changes
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
          remaining_term,
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
          remaining_term,
          lgd: record.pd || 0,
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
      
      // Clear dataset cache immediately to ensure fresh data
      clearDatasetCache();
      
      // Enhanced refresh mechanism
      const timestamp = Date.now();
      setDatasetRefreshTrigger(timestamp);
      
      // Notify parent component about the new dataset
      if (onDatasetUploaded) {
        onDatasetUploaded();
      }
      
      console.log('🔄 DATASET REFRESH TRIGGERED:', timestamp);
      
      const recordCount = filteredRecords.length > 0 ? filteredRecords.length : 'all filtered';
      
      toast({
        title: "Filtered Dataset Saved Successfully",
        description: `Successfully saved ${recordCount} records as "${newDatasetName}". The dataset should now appear in "Select Dataset to Manage" within a few seconds.`,
        duration: 8000,
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
      throw error;
    } finally {
      setIsProcessing(false);
      setUploadStatus('');
      setUploadProgress(0);
    }
  };

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
    const highRiskLoans = data.filter(loan => (loan.pd || 0) > 0.10).length;
    
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
        description: `Successfully deleted dataset "${selectedDatasetName}" and all associated structures`,
      });

      // Clear dataset cache to force refresh
      clearDatasetCache();
      
      // Trigger global refresh
      const newTrigger = Date.now();
      setDatasetRefreshTrigger(newTrigger);
      
      // Notify parent component
      if (onDatasetUploaded) {
        onDatasetUploaded();
      }

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
      const parserConfig = PARSER_REGISTRY[selectedLoanType];
      const parsedData = await parserConfig.parser(file);
      
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

    // Enhanced user authentication validation
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
      
      // Prepare data with dataset_name only - let insertLoanData handle user_id assignment
      const dataWithMetadata = dataToSave.map(loan => ({
        ...loan,
        dataset_name: datasetName.trim()
        // Don't set user_id here - insertLoanData will handle it for RLS compliance
      }));
      
      console.log('💾 PREPARED DATA SAMPLE:', dataWithMetadata.slice(0, 2));
      
      // Use the updated batch insert function with enhanced authentication
      await insertLoanData(dataWithMetadata, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Uploading: ${completed}/${total} records (${progress}%)`);
        console.log(`📊 UPLOAD PROGRESS: ${completed}/${total} (${progress}%)`);
      });
      
      console.log('✅ UPLOAD SUCCESSFUL - Data saved to database');
      
      // Enhanced refresh mechanism
      // Clear dataset cache immediately to ensure fresh data
      clearDatasetCache();
      
      const newTrigger = Date.now();
      setDatasetRefreshTrigger(newTrigger);
      
      // Notify parent component about the new dataset
      if (onDatasetUploaded) {
        onDatasetUploaded();
      }
      
      toast({
        title: "Upload Successful",
        description: `${dataToSave.length} loan records saved successfully as "${datasetName}". The dataset will appear in "Access Existing Data" and "Extract Data" sections.`,
        duration: 6000,
      });
      
      // Wait longer to ensure the dataset appears in selectors
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
        if (error.message.includes('not authenticated') || error.message.includes('session')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = "Permission denied. Please ensure you're properly authenticated.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "Security error. Please log out and log back in to refresh your session.";
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
        refreshTrigger={datasetRefreshTrigger}
      />
      
      <ExcelUploadModal
        isOpen={isOpen && !showDatasetSelector}
        showExistingData={showExistingData && !showDatasetSelector}
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
        onFilteredDataChange={handleFilteredDataChange}
        onSaveFilteredDataset={handleSaveFilteredDataset}
        onPortfolioSummaryChange={setPortfolioSummary}
        currentFilters={currentFilters}
        filteredCount={filteredCount}
      />
      
      <DatasetSharingManager 
        isOpen={showSharingManager}
        onClose={() => setShowSharingManager(false)}
      />
    </>
  );
};

export default ExcelUpload;
