import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { LoanRecord, insertLoanData, getLoanDataPaginated, getPortfolioSummaryOnly, deleteLoanData } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parseExcelFile } from '@/utils/excelParser';
import { ExcelUploadModal } from './ExcelUploadModal';
import DatasetSharingManager from '../DatasetSharingManager';

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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isTableDataLoaded, setIsTableDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const PAGE_SIZE = 1000;

  // Load existing data when showExistingData is true
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      loadExistingDataFast();
    } else if (!showExistingData && isOpen) {
      resetState();
    }
  }, [showExistingData, isOpen, user]);

  // Add effect to refresh data when component becomes visible again
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      const handleFocus = () => {
        loadExistingDataFast();
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [showExistingData, isOpen, user]);

  const resetState = () => {
    setPreviewData([]);
    setAllData([]);
    setSelectedFile(null);
    setDatasetName('');
    setPortfolioSummary(null);
    setUploadProgress(0);
    setUploadStatus('');
    setSelectedRecords(new Set());
    setCurrentPage(0);
    setTotalRecords(0);
    setHasMore(false);
    setIsTableDataLoaded(false);
  };

  // OPTIMIZED: Load portfolio summary first, then table data on demand
  const loadExistingDataFast = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      console.log('🚀 FAST LOAD: Loading portfolio summary only');
      
      // Step 1: Get portfolio summary quickly (no full data load)
      const summary = await getPortfolioSummaryOnly();
      
      if (summary) {
        setPortfolioSummary(summary);
        setTotalRecords(summary.totalRecords);
        console.log(`🚀 SUMMARY LOADED: ${summary.totalRecords} total records, portfolio ready`);
        
        toast({
          title: "Portfolio Summary Loaded",
          description: `Portfolio overview ready (${summary.totalRecords.toLocaleString()} total records)`,
        });
      } else {
        console.log('🚀 NO DATA: No records found');
        setPortfolioSummary(null);
        setTotalRecords(0);
        
        toast({
          title: "No Data Found",
          description: "No existing loan data found for your account",
        });
      }
      
      // Reset table state - data will be loaded when user views the table
      setPreviewData([]);
      setAllData([]);
      setCurrentPage(0);
      setHasMore(summary ? summary.totalRecords > PAGE_SIZE : false);
      setIsTableDataLoaded(false);
      
    } catch (error) {
      console.error('❌ ERROR loading portfolio summary:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load portfolio summary. Please try again.",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: Load table data on demand (when user first views the table)
  const loadTableDataIfNeeded = async () => {
    if (isTableDataLoaded || totalRecords === 0) {
      return; // Already loaded or no data to load
    }
    
    console.log('📋 LOADING TABLE DATA: First page on demand');
    await loadTablePage(0);
    setIsTableDataLoaded(true);
  };

  // NEW: Load specific page of table data
  const loadTablePage = async (page: number) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      console.log(`📋 LOADING PAGE: Fetching page ${page + 1}`);
      
      const result = await getLoanDataPaginated(page, PAGE_SIZE);
      
      setPreviewData(result.data);
      setCurrentPage(page);
      setHasMore(result.hasMore);
      setTotalRecords(result.totalCount);
      
      // Clear selections when changing pages
      setSelectedRecords(new Set());
      
      console.log(`📋 PAGE LOADED: Page ${page + 1} with ${result.data.length} records`);
      
    } catch (error) {
      console.error('❌ ERROR loading table page:', error);
      toast({
        title: "Error Loading Page",
        description: "Failed to load table data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && showExistingData) {
      loadTablePage(newPage);
    }
  };

  const calculatePortfolioSummary = (data: LoanRecord[]) => {
    console.log(`📊 PORTFOLIO CALCULATION: ${data.length} records for uploaded file`);
    
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
    
    console.log(`📊 CALCULATION COMPLETE:`, calculatedSummary);
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
      
      await deleteLoanData(Array.from(selectedRecords));
      
      // Refresh data after deletion
      await loadExistingDataFast();
      setSelectedRecords(new Set());
      setIsTableDataLoaded(false); // Force reload of table data
      
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
      console.log('Using real Supabase user ID:', user.id);
      
      const dataWithUserId = previewData.map(loan => ({
        ...loan,
        user_id: user.id,
        dataset_name: datasetName.trim()
      }));
      
      console.log('Inserting data to database:', dataWithUserId.length, 'records with user_id:', user.id, 'dataset_name:', datasetName);
      
      // Use the new batch insert function with progress tracking
      await insertLoanData(dataWithUserId, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Uploading: ${completed}/${total} records (${progress}%)`);
      });
      
      toast({
        title: "Upload Successful",
        description: `${previewData.length} loan records saved successfully as "${datasetName}"`,
      });
      
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
    resetState();
  };

  return (
    <>
      <ExcelUploadModal
        isOpen={isOpen}
        showExistingData={showExistingData}
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
        isTableDataLoaded={isTableDataLoaded}
        onClose={handleClose}
        onRefreshData={loadExistingDataFast}
        onShowSharingManager={() => setShowSharingManager(true)}
        onClearData={resetState}
        onSaveToDatabase={handleSaveToDatabase}
        onDatasetNameChange={setDatasetName}
        onSelectRecord={handleSelectRecord}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onPageChange={handlePageChange}
        onFileDrop={handleFileDrop}
        onLoadTableData={loadTableDataIfNeeded}
      />
      
      <DatasetSharingManager 
        isOpen={showSharingManager}
        onClose={() => setShowSharingManager(false)}
      />
    </>
  );
};

export default ExcelUpload;
