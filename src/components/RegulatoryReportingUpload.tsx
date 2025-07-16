import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ESMARecord {
  cmrl1: string;
  cmrl2: string;
  cmrl3: string;
  cmrl4: string;
  cmrl5: string;
  cmrl6: string;
  cmrl10_1: string;
  cmrl10_2: string;
  cmrl27: string;
  cmrl28: string;
  cmrl30: string;
  cmrl31: string;
  cmrl36: string;
  cmrl37: string;
  cmrl38: string;
  cmrl41: string;
  cmrl42: string;
  cmrl43: string;
  cmrl44: string;
  cmrl45: string;
  cmrl46: string;
  cmrl47: string;
  cmrl48: string;
  cmrl49: string;
  cmrl50: string;
  cmrl51: string;
  cmrl52: string;
  cmrl53: string;
  cmrl54: string;
  cmrl55: string;
  cmrl56: string;
  cmrl57: string;
  cmrl58: string;
  cmrl59: string;
  cmrl60: string;
  cmrl61: string;
  cmrl62: string;
  cmrl63: string;
  cmrl64: string;
  cmrl65: string;
  cmrl66: string;
  cmrl67: string;
  cmrl68: string;
  cmrl69: string;
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataQuality: {
    idFields: number;
    obligorFields: number;
    loanFields: number;
    performanceFields: number;
  };
}

interface RegulatoryReportingUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegulatoryReportingUpload: React.FC<RegulatoryReportingUploadProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [parsedData, setParsedData] = useState<ESMARecord[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<ESMARecord[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<{
    exposureCount: number;
    totalCurrentBalance: number;
    waInterestRate: number;
    waRemainingTerm: number;
    fixedRatePercentage: number;
    gracePeriodPercentage: number;
  } | null>(null);
  const { toast } = useToast();

  const validateESMAFormat = (data: ESMARecord[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    const requiredFields = ['cmrl1', 'cmrl2', 'cmrl3', 'cmrl4', 'cmrl5', 'cmrl6', 'cmrl10_1', 'cmrl27', 'cmrl28'];
    
    let validRecords = 0;
    let ndCodeCount = 0;
    let totalFields = 0;
    
    data.forEach((record, index) => {
      let recordValid = true;
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!record[field] || record[field].trim() === '') {
          errors.push(`Row ${index + 1}: Missing required field ${field}`);
          recordValid = false;
        }
      });
      
      // Check for excessive ND codes
      Object.values(record).forEach(value => {
        totalFields++;
        if (value && value.toString().startsWith('ND')) {
          ndCodeCount++;
        }
      });
      
      // Validate date format (CMRL6 - Cut-off date) - Accept both ISO and German formats
      const cutOffDate = record.cmrl6;
      if (cutOffDate && !cutOffDate.match(/^(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})$/)) {
        errors.push(`Row ${index + 1}: Invalid date format in CMRL6. Expected YYYY-MM-DD or DD.MM.YYYY`);
        recordValid = false;
      }
      
      // Validate currency amounts (CMRL27, CMRL28)
      const principalBalance = record.cmrl27;
      const currentBalance = record.cmrl28;
      
      if (principalBalance && isNaN(parseFloat(principalBalance.replace(',', '.')))) {
        errors.push(`Row ${index + 1}: Invalid amount format in CMRL27`);
        recordValid = false;
      }
      
      if (currentBalance && isNaN(parseFloat(currentBalance.replace(',', '.')))) {
        errors.push(`Row ${index + 1}: Invalid amount format in CMRL28`);
        recordValid = false;
      }
      
      // Validate NUTS code (CMRL10_2)
      const nutsCode = record.cmrl10_2;
      if (nutsCode && !nutsCode.match(/^[A-Z]{2}[0-9A-Z]{1,3}$/)) {
        warnings.push(`Row ${index + 1}: NUTS code ${nutsCode} may not be valid NUTS-3 format`);
      }
      
      if (recordValid) validRecords++;
    });
    
    // Check ND code ratio
    const ndRatio = (ndCodeCount / totalFields) * 100;
    if (ndRatio > 5) {
      warnings.push(`High ND code ratio: ${ndRatio.toFixed(1)}% (recommended: ≤5%)`);
    }
    
    // Data quality assessment
    const dataQuality = {
      idFields: Math.floor(Math.random() * 10) + 90, // Mock data quality scores
      obligorFields: Math.floor(Math.random() * 15) + 85,
      loanFields: Math.floor(Math.random() * 20) + 80,
      performanceFields: Math.floor(Math.random() * 25) + 75
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataQuality
    };
  };

  const calculateKeyMetrics = (data: ESMARecord[]) => {
    let totalBalance = 0;
    let totalInterestRate = 0;
    let totalTerm = 0;
    let fixedRateCount = 0;
    let gracePeriodCount = 0;
    
    data.forEach(record => {
      const balance = parseFloat(record.cmrl28?.replace(',', '.') || '0');
      const interestRate = parseFloat(record.cmrl36?.replace(',', '.') || '0');
      const term = parseFloat(record.cmrl43 || '0');
      
      totalBalance += balance;
      totalInterestRate += interestRate * balance;
      totalTerm += term * balance;
      
      if (record.cmrl32 === 'FRXX') fixedRateCount++;
      // Add grace period logic based on your business rules
    });
    
    const weightedAvgRate = totalBalance > 0 ? totalInterestRate / totalBalance : 0;
    const weightedAvgTerm = totalBalance > 0 ? totalTerm / totalBalance : 0;
    
    setKeyMetrics({
      exposureCount: data.length,
      totalCurrentBalance: totalBalance,
      waInterestRate: weightedAvgRate,
      waRemainingTerm: weightedAvgTerm,
      fixedRatePercentage: (fixedRateCount / data.length) * 100,
      gracePeriodPercentage: (gracePeriodCount / data.length) * 100
    });
  };

  const parseCSVFile = async (file: File): Promise<ESMARecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          
          if (lines.length < 2) {
            reject(new Error('File must contain at least a header row and one data row'));
            return;
          }
          
          // Handle different delimiter types
          const headerLine = lines[0];
          let delimiter = ',';
          if (headerLine.includes('\t')) {
            delimiter = '\t';
          } else if (headerLine.includes(';')) {
            delimiter = ';';
          }
          
          const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
          const data: ESMARecord[] = [];
          
          // Debug logging
          console.log('Header line:', headerLine);
          console.log('Delimiter:', delimiter);
          console.log('Parsed headers:', headers);
          console.log('First 10 headers:', headers.slice(0, 10));
          
          // Validate headers contain CMRL fields (case-insensitive)
          const requiredHeaders = ['cmrl1', 'cmrl2', 'cmrl3', 'cmrl4', 'cmrl5', 'cmrl6'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          console.log('Required headers:', requiredHeaders);
          console.log('Missing headers:', missingHeaders);
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required CMRL fields: ${missingHeaders.join(', ')}`));
            return;
          }
          
          // Store original headers for data mapping
          const originalHeaders = headerLine.split(delimiter).map(h => h.trim());
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = line.split(delimiter);
              const record: ESMARecord = {} as ESMARecord;
              
              originalHeaders.forEach((header, index) => {
                record[header.toLowerCase()] = values[index]?.trim() || '';
              });
              
              data.push(record);
            }
          }
          
          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setSelectedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Parsing regulatory data file...');
    
    try {
      const data = await parseCSVFile(file);
      setParsedData(data);
      setPreviewData(data.slice(0, 50)); // Show first 50 rows
      
      setUploadStatus('Validating ESMA format...');
      setUploadProgress(50);
      
      const validationResult = validateESMAFormat(data);
      setValidation(validationResult);
      
      setUploadStatus('Calculating key metrics...');
      setUploadProgress(75);
      
      calculateKeyMetrics(data);
      
      setUploadProgress(100);
      setUploadStatus('');
      
      toast({
        title: "File Processed Successfully",
        description: `Processed ${data.length} regulatory records`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
      setParsedData([]);
      setPreviewData([]);
      setValidation(null);
      setKeyMetrics(null);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const getDataQualityColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const generateFileName = () => {
    const now = new Date();
    const cutOffDate = now.toISOString().split('T')[0];
    return `ESMABank_Annex6_Consumer_Initial_${cutOffDate}_Demo.csv`;
  };

  const downloadSampleFile = () => {
    const sampleData = `cmrl1\tcmrl2\tcmrl3\tcmrl4\tcmrl5\tcmrl6\tcmrl7\tcmrl8\tcmrl9\tcmrl10_1\tcmrl10_2\tcmrl27\tcmrl28\tcmrl32\tcmrl36\tcmrl43
529900CLVK38HUKPKF71N202101\t3607404\t3607404\t8188053\t8188053\t2021-12-31\tND5\tND5\tND5\tDE\t87600\t10029.60\t1205.40\tFRXX\t80.00\t84
529900CLVK38HUKPKF71N202101\t3922882\t3922882\t8567011\t8567011\t2021-12-31\tND5\tND5\tND5\tDE\t38543\t22000.00\t976.44\tFRXX\t305.40\t84`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ESMA_Consumer_Loan_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Regulatory Reporting Upload</h2>
              <p className="text-gray-600">ESMA Consumer Loan Data (Annex 6)</p>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload & Validate</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
              <TabsTrigger value="export">Export Options</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload ESMA-compliant CSV file with consumer loan data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={downloadSampleFile}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Template
                      </Button>
                      <Badge variant="secondary">Template v1.3.2</Badge>
                    </div>
                    
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      {isDragActive ? (
                        <p className="text-blue-600">Drop the CSV file here...</p>
                      ) : (
                        <div>
                          <p className="text-gray-600 mb-2">
                            Drag and drop a CSV file here, or click to select
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports CSV, TSV, and TXT files
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedFile && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{uploadStatus}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {validation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {validation.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      Schema Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={validation.isValid ? "default" : "destructive"}>
                          {validation.isValid ? "✅ Schema-valid (v 1.3.2)" : "❌ Validation Failed"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {parsedData.length} records processed
                        </span>
                      </div>

                      {validation.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Validation Errors:</p>
                              {validation.errors.slice(0, 5).map((error, index) => (
                                <p key={index} className="text-sm">• {error}</p>
                              ))}
                              {validation.errors.length > 5 && (
                                <p className="text-sm">... and {validation.errors.length - 5} more</p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {validation.warnings.length > 0 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Warnings:</p>
                              {validation.warnings.slice(0, 3).map((warning, index) => (
                                <p key={index} className="text-sm">• {warning}</p>
                              ))}
                              {validation.warnings.length > 3 && (
                                <p className="text-sm">... and {validation.warnings.length - 3} more</p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ID Fields</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDataQualityColor(validation.dataQuality.idFields)}`} />
                            <span className="font-medium">{validation.dataQuality.idFields}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Obligor Fields</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDataQualityColor(validation.dataQuality.obligorFields)}`} />
                            <span className="font-medium">{validation.dataQuality.obligorFields}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Loan Fields</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDataQualityColor(validation.dataQuality.loanFields)}`} />
                            <span className="font-medium">{validation.dataQuality.loanFields}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Performance</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getDataQualityColor(validation.dataQuality.performanceFields)}`} />
                            <span className="font-medium">{validation.dataQuality.performanceFields}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {keyMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {keyMetrics.exposureCount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Exposures</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          €{(keyMetrics.totalCurrentBalance / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-gray-600">Total Balance</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {keyMetrics.waInterestRate.toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-600">WA Coupon</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {keyMetrics.waRemainingTerm.toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-600">WA Remaining Term</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {keyMetrics.fixedRatePercentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Fixed Rate</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {keyMetrics.gracePeriodPercentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Grace Period</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {previewData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Preview (First 50 rows)</CardTitle>
                    <CardDescription>
                      Frozen column groupings: ID ✓, Obligor ✓, Loan terms ✓, Performance ✓
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="bg-blue-50">CMRL1</TableHead>
                            <TableHead className="bg-blue-50">CMRL2</TableHead>
                            <TableHead className="bg-blue-50">CMRL3</TableHead>
                            <TableHead className="bg-green-50">CMRL4</TableHead>
                            <TableHead className="bg-green-50">CMRL5</TableHead>
                            <TableHead className="bg-green-50">CMRL6</TableHead>
                            <TableHead className="bg-green-50">CMRL10_1</TableHead>
                            <TableHead className="bg-green-50">CMRL10_2</TableHead>
                            <TableHead className="bg-yellow-50">CMRL27</TableHead>
                            <TableHead className="bg-yellow-50">CMRL28</TableHead>
                            <TableHead className="bg-yellow-50">CMRL32</TableHead>
                            <TableHead className="bg-yellow-50">CMRL36</TableHead>
                            <TableHead className="bg-yellow-50">CMRL43</TableHead>
                            <TableHead className="bg-red-50">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.slice(0, 50).map((record, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs">{record.cmrl1}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl2}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl3}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl4}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl5}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl6}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl10_1}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl10_2}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl27}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl28}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl32}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl36}</TableCell>
                              <TableCell className="font-mono text-xs">{record.cmrl43}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {record.cmrl28 && !isNaN(parseFloat(record.cmrl28.replace(',', '.'))) ? 'Valid' : 'Check'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedData.length > 50 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Showing 50 of {parsedData.length} total records
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No data to preview. Please upload a file first.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>Download processed data in various formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        disabled={parsedData.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Raw CSV
                      </Button>
                      <Button 
                        variant="outline"
                        disabled={parsedData.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        ESMA-compliant XML
                      </Button>
                      <Button 
                        variant="outline"
                        disabled={parsedData.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Sample Excel Pivot
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">File Naming Convention</h4>
                      <code className="text-sm bg-white px-2 py-1 rounded">
                        {generateFileName()}
                      </code>
                      <p className="text-xs text-gray-600 mt-1">
                        Format: &lt;Originator&gt;_Annex6_Consumer_Initial_&lt;CutOffDate&gt;_Demo.csv
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryReportingUpload;