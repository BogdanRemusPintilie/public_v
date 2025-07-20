import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, Eye, TrendingUp, AlertCircle, CheckCircle, Calendar as CalendarComp, Save, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { 
  saveInvestorReport, 
  getInvestorReports, 
  deleteInvestorReport, 
  getFileDownloadUrl,
  updateInvestorReport,
  type InvestorReport,
  type ReportMetadata as ImportedReportMetadata
} from "@/utils/investorReports";
import { DocumentExtractor, type ExtractedFinancialData } from "@/utils/documentExtraction";

interface InvestorReportingUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocalReportMetadata {
  deal_name: string;
  issuer: string;
  asset_class: string;
  jurisdiction: string;
  report_type: string;
  period_start: Date | null;
  period_end: Date | null;
  publish_date: Date | null;
  currency: string;
  sustainability_labelled: boolean;
  sts_compliant: boolean;
  notes: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  file: File;
  metadata: LocalReportMetadata;
  extractedData?: ExtractedFinancialData;
  isProcessing?: boolean;
  processingError?: string;
}

const InvestorReportingUpload: React.FC<InvestorReportingUploadProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [savedReports, setSavedReports] = useState<InvestorReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<LocalReportMetadata>({
    deal_name: '',
    issuer: '',
    asset_class: '',
    jurisdiction: '',
    report_type: '',
    period_start: null,
    period_end: null,
    publish_date: null,
    currency: 'EUR',
    sustainability_labelled: false,
    sts_compliant: false,
    notes: ''
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        file: file,
        metadata: { ...metadata },
        isProcessing: true
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      setSelectedFile(newFile);
      
      // Extract data from the actual file
      try {
        console.log(`Starting data extraction for file: ${file.name}, type: ${file.type}`);
        
        let extractedData: ExtractedFinancialData;
        
        if (file.type === 'application/pdf') {
          extractedData = await DocumentExtractor.extractFromPDF(file);
        } else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          extractedData = await DocumentExtractor.extractFromExcel(file);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          extractedData = await DocumentExtractor.extractFromCSV(file);
        } else {
          throw new Error(`Unsupported file type: ${file.type}`);
        }
        
        console.log('Data extraction completed:', extractedData);
        
        // Update the file with extracted data
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, extractedData, isProcessing: false }
            : f
        ));
        
        toast({
          title: "Data extracted successfully",
          description: `Successfully processed ${file.name}`,
        });
        
      } catch (error) {
        console.error('Data extraction failed:', error);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { 
                ...f, 
                isProcessing: false, 
                processingError: error instanceof Error ? error.message : 'Unknown error'
              }
            : f
        ));
        
        toast({
          title: "Data extraction failed",
          description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
  }, [metadata, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const updateMetadata = (field: keyof LocalReportMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
    if (selectedFile) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, metadata: { ...f.metadata, [field]: value } }
          : f
      ));
    }
  };

  const generateHeroSummary = (file: UploadedFile) => {
    if (!file.extractedData) return null;
    
    const data = file.extractedData;
    return {
      deal_name: file.metadata.deal_name || file.name.split('.')[0],
      period: file.metadata.period_end ? format(file.metadata.period_end, 'PPP') : 'Current Period',
      payment_date: data.payment_date || 'N/A',
      senior_tranche_os: data.senior_tranche_os ? `€${(data.senior_tranche_os / 1000000).toFixed(0)}M` : 'N/A',
      protected_tranche: data.protected_tranche ? `€${(data.protected_tranche / 1000000).toFixed(0)}M` : 'N/A',
      cpr_annualised: data.cpr_annualised ? `${data.cpr_annualised.toFixed(2)}%` : 'N/A',
      cum_losses: data.cum_losses ? `€${(data.cum_losses / 1000000).toFixed(2)}M` : 'N/A',
      next_payment_date: data.next_payment_date || 'N/A',
      portfolio_balance: data.portfolio_balance ? `€${(data.portfolio_balance / 1000000).toFixed(0)}M` : 'N/A',
      weighted_avg_rate: data.weighted_avg_rate ? `${data.weighted_avg_rate.toFixed(2)}%` : 'N/A'
    };
  };

  const exportReport = (format: 'pdf' | 'json' | 'csv') => {
    if (!selectedFile) return;
    
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
    let content, mimeType, extension;
    
    switch (format) {
      case 'pdf':
        // Return original PDF
        const url = URL.createObjectURL(selectedFile.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}_master.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
        
      case 'json':
        content = JSON.stringify({
          metadata: selectedFile.metadata,
          extracted_data: selectedFile.extractedData
        }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      case 'csv':
        if (!selectedFile.extractedData?.tranches) return;
        const headers = ['Name', 'Balance', 'Interest Rate', 'WAL', 'Rating'];
        const rows = selectedFile.extractedData.tranches.map((t: any) => 
          [t.name, t.balance, t.interest_rate, t.wal, t.rating]
        );
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_data.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadSavedReports = async () => {
    setIsLoading(true);
    try {
      const reports = await getInvestorReports();
      setSavedReports(reports);
    } catch (error) {
      toast({
        title: "Error loading reports",
        description: error instanceof Error ? error.message : "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentFile = async () => {
    if (!selectedFile || !selectedFile.extractedData) {
      toast({
        title: "Cannot save file",
        description: "Please select a processed file to save",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert local metadata to database format
      const dbMetadata: ImportedReportMetadata = {
        deal_name: selectedFile.metadata.deal_name,
        issuer: selectedFile.metadata.issuer,
        asset_class: selectedFile.metadata.asset_class,
        jurisdiction: selectedFile.metadata.jurisdiction,
        report_type: selectedFile.metadata.report_type,
        period_start: selectedFile.metadata.period_start?.toISOString().split('T')[0],
        period_end: selectedFile.metadata.period_end?.toISOString().split('T')[0],
        publish_date: selectedFile.metadata.publish_date?.toISOString().split('T')[0],
        currency: selectedFile.metadata.currency,
        sustainability_labelled: selectedFile.metadata.sustainability_labelled,
        sts_compliant: selectedFile.metadata.sts_compliant,
        notes: selectedFile.metadata.notes,
      };

      await saveInvestorReport(selectedFile.file, dbMetadata, selectedFile.extractedData);
      
      toast({
        title: "Report saved successfully",
        description: "Your investor report has been saved to the database",
      });

      // Refresh the saved reports list
      loadSavedReports();
    } catch (error) {
      toast({
        title: "Error saving report",
        description: error instanceof Error ? error.message : "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedReport = async (reportId: string) => {
    setIsLoading(true);
    try {
      await deleteInvestorReport(reportId);
      
      toast({
        title: "Report deleted",
        description: "The investor report has been deleted successfully",
      });

      // Refresh the saved reports list
      loadSavedReports();
    } catch (error) {
      toast({
        title: "Error deleting report",
        description: error instanceof Error ? error.message : "Failed to delete report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSavedReport = async (report: InvestorReport) => {
    try {
      const downloadUrl = await getFileDownloadUrl(report.file_path);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error downloading file",
        description: error instanceof Error ? error.message : "Failed to generate download link",
        variant: "destructive",
      });
    }
  };

  // Load saved reports when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSavedReports();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Post-trade Investor Reporting
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload & Metadata</TabsTrigger>
            <TabsTrigger value="preview">Preview Widgets</TabsTrigger>
            <TabsTrigger value="reports">Manage Reports</TabsTrigger>
            <TabsTrigger value="export">Export & Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Investor Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {isDragActive
                        ? "Drop the files here..."
                        : "Drag & drop PDF reports, or click to select"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports PDF, Excel, CSV files
                    </p>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Uploaded Files</h4>
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded border cursor-pointer",
                            selectedFile?.id === file.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                          )}
                          onClick={() => setSelectedFile(file)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.processingError ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <Badge variant="destructive" className="text-xs">
                                  Error
                                </Badge>
                              </>
                            ) : file.isProcessing ? (
                              <>
                                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                                <Badge variant="secondary" className="text-xs">
                                  Processing...
                                </Badge>
                              </>
                            ) : file.extractedData ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <Badge variant="secondary" className="text-xs">
                                  Processed
                                </Badge>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                <Badge variant="secondary" className="text-xs">
                                  Pending
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deal_name">Deal Name</Label>
                      <Input
                        id="deal_name"
                        placeholder="e.g., Magdalena 6 – Consumer Finance (DE)"
                        value={metadata.deal_name}
                        onChange={(e) => updateMetadata('deal_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="issuer">Issuer</Label>
                      <Input
                        id="issuer"
                        placeholder="e.g., Santander Consumer Bank GmbH"
                        value={metadata.issuer}
                        onChange={(e) => updateMetadata('issuer', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asset_class">Asset Class</Label>
                      <Select value={metadata.asset_class} onValueChange={(value) => updateMetadata('asset_class', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consumer-Finance ABS">Consumer-Finance ABS</SelectItem>
                          <SelectItem value="Auto ABS">Auto ABS</SelectItem>
                          <SelectItem value="Mortgage RMBS">Mortgage RMBS</SelectItem>
                          <SelectItem value="Commercial ABS">Commercial ABS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="jurisdiction">Jurisdiction</Label>
                      <Select value={metadata.jurisdiction} onValueChange={(value) => updateMetadata('jurisdiction', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Spain">Spain</SelectItem>
                          <SelectItem value="Italy">Italy</SelectItem>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report_type">Report Type</Label>
                      <Select value={metadata.report_type} onValueChange={(value) => updateMetadata('report_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Quarterly investor report">Quarterly investor report</SelectItem>
                          <SelectItem value="Monthly investor report">Monthly investor report</SelectItem>
                          <SelectItem value="Annual investor report">Annual investor report</SelectItem>
                          <SelectItem value="Audited financial statements">Audited financial statements</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={metadata.currency} onValueChange={(value) => updateMetadata('currency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about this report..."
                      value={metadata.notes}
                      onChange={(e) => updateMetadata('notes', e.target.value)}
                    />
                  </div>
                  
                  {selectedFile && selectedFile.extractedData && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={saveCurrentFile}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Report to Database
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-6">
            {selectedFile && selectedFile.extractedData ? (
              <div className="space-y-6">
                {/* Hero Summary Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Hero Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const summary = generateHeroSummary(selectedFile);
                      if (!summary) return <p className="text-gray-500">No data available</p>;
                      
                      return (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{summary.deal_name}</h3>
                              <p className="text-sm text-gray-600">{summary.period}</p>
                            </div>
                            <Badge variant="outline">{selectedFile.metadata.currency}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Payment Date</p>
                              <p className="font-semibold">{summary.payment_date}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Senior Tranche O/S</p>
                              <p className="font-semibold">{summary.senior_tranche_os}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Protected Tranche</p>
                              <p className="font-semibold">{summary.protected_tranche}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">CPR (annualised)</p>
                              <p className="font-semibold">{summary.cpr_annualised}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Cum. Losses</p>
                              <p className="font-semibold">{summary.cum_losses}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Next Payment</p>
                              <p className="font-semibold">{summary.next_payment_date}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Interactive Tranche Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tranche Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedFile.extractedData.tranches && selectedFile.extractedData.tranches.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tranche</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Interest Rate</TableHead>
                            <TableHead>WAL</TableHead>
                            <TableHead>Rating</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedFile.extractedData.tranches.map((tranche: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{tranche.name}</TableCell>
                              <TableCell>
                                {tranche.balance > 0 ? `€${(tranche.balance / 1000000).toFixed(0)}M` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {tranche.interest_rate > 0 ? `${tranche.interest_rate.toFixed(2)}%` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {tranche.wal > 0 ? tranche.wal.toFixed(1) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{tranche.rating || 'NR'}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No tranche data available</p>
                        <p className="text-sm text-gray-400 mt-2">
                          The document may not contain structured tranche information
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PDF Viewer Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Original Report Viewer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-8 rounded-lg text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">PDF viewer would be embedded here</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to view original report: {selectedFile.name}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => exportReport('pdf')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Original PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : selectedFile && selectedFile.processingError ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-600 font-medium mb-2">Processing Error</p>
                <p className="text-gray-600 mb-4">{selectedFile.processingError}</p>
                <p className="text-sm text-gray-500">
                  Please try uploading a different file or check the file format
                </p>
              </div>
            ) : selectedFile && selectedFile.isProcessing ? (
              <div className="text-center py-8">
                <RefreshCw className="mx-auto h-12 w-12 text-blue-400 animate-spin mb-4" />
                <p className="text-blue-600 font-medium mb-2">Processing Document</p>
                <p className="text-gray-600">
                  Extracting data from {selectedFile.name}...
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Upload and select a file to see preview widgets</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Reports</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSavedReports}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
                    <p className="text-gray-600">Loading reports...</p>
                  </div>
                ) : savedReports.length > 0 ? (
                  <div className="space-y-4">
                    {savedReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <h4 className="font-medium">{report.deal_name}</h4>
                            <p className="text-sm text-gray-600">
                              {report.issuer} • {report.report_type}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>Uploaded {report.created_at ? format(new Date(report.created_at), 'PPp') : 'Unknown'}</span>
                              <span>{report.currency}</span>
                              <span>{report.file_size ? formatFileSize(report.file_size) : 'Unknown size'}</span>
                            </div>
                            {report.notes && (
                              <p className="text-xs text-gray-600 mt-1 italic">{report.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.sustainability_labelled && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Sustainable
                            </Badge>
                          )}
                          {report.sts_compliant && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              STS
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSavedReport(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSavedReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No saved reports found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload and save reports to see them here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => exportReport('pdf')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Master PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportReport('json')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Data Extract (JSON)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportReport('csv')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Tranche Data (CSV)
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Master PDF: Original unmodified document for audit compliance</li>
                        <li>• Data Extract: Structured metadata and extracted key metrics</li>
                        <li>• Tranche Data: CSV format for analysis and reporting</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Select a file to see export options</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorReportingUpload;
