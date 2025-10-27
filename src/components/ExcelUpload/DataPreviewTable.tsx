
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoanRecord } from '@/utils/supabase';
import { CorporateTermLoanRecord } from '@/utils/parsers/corporateTermLoansParser';
import { LoanType } from '@/utils/parsers/parserRegistry';

interface DataPreviewTableProps {
  previewData: LoanRecord[] | CorporateTermLoanRecord[];
  selectedRecords: Set<string>;
  showExistingData: boolean;
  totalRecords: number;
  currentPage: number;
  hasMore: boolean;
  isProcessing: boolean;
  selectedLoanType: LoanType;
  onSelectRecord: (recordId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 1000;

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  previewData,
  selectedRecords,
  showExistingData,
  totalRecords,
  currentPage,
  hasMore,
  isProcessing,
  selectedLoanType,
  onSelectRecord,
  onSelectAll,
  onDeleteSelected,
  onPageChange
}) => {
  const isCTL = selectedLoanType === 'corporate_term_loans';
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          Data Preview ({previewData.length.toLocaleString()} records on this page)
          {showExistingData && totalRecords > PAGE_SIZE && (
            <span className="text-sm text-gray-500 ml-2">
              Page {currentPage + 1} of {Math.ceil(totalRecords / PAGE_SIZE)}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {showExistingData && totalRecords > PAGE_SIZE && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0 || isProcessing}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {currentPage + 1} / {Math.ceil(totalRecords / PAGE_SIZE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasMore || isProcessing}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {showExistingData && selectedRecords.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isProcessing}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedRecords.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selectedRecords.size} loan records from your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteSelected}>
                    Delete Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {showExistingData && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRecords.size === previewData.filter(r => r.id).length && previewData.length > 0}
                      onCheckedChange={onSelectAll}
                    />
                  </TableHead>
                )}
                {showExistingData && <TableHead>Dataset</TableHead>}
                {isCTL ? (
                  <>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Credit Rating</TableHead>
                    <TableHead>PD</TableHead>
                    <TableHead>LGD</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Term (Months)</TableHead>
                    <TableHead>PD</TableHead>
                    <TableHead>Remaining Term</TableHead>
                    <TableHead>Credit Score</TableHead>
                    <TableHead>LTV</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.slice(0, 10).map((row, index) => (
                <TableRow key={row.id || index}>
                  {showExistingData && (
                    <TableCell>
                      {row.id && (
                        <Checkbox
                          checked={selectedRecords.has(row.id)}
                          onCheckedChange={(checked) => onSelectRecord(row.id!, checked as boolean)}
                        />
                      )}
                    </TableCell>
                  )}
                  {showExistingData && (
                    <TableCell className="font-medium">
                      {row.dataset_name || 'Unnamed Dataset'}
                    </TableCell>
                  )}
                  {isCTL ? (
                    <>
                      <TableCell>{(row as CorporateTermLoanRecord).borrower_name || 'N/A'}</TableCell>
                      <TableCell>{(row as CorporateTermLoanRecord).country || 'N/A'}</TableCell>
                      <TableCell>{(row as CorporateTermLoanRecord).industry_sector || 'N/A'}</TableCell>
                      <TableCell>£{row.loan_amount.toLocaleString()}</TableCell>
                      <TableCell>£{row.current_balance.toLocaleString()}</TableCell>
                      <TableCell>{(row.interest_rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>{(row as CorporateTermLoanRecord).credit_rating || 'N/A'}</TableCell>
                      <TableCell>{((row.pd || 0) * 100).toFixed(2)}%</TableCell>
                      <TableCell>{((row.lgd || 0) * 100).toFixed(2)}%</TableCell>
                      <TableCell>{(row as CorporateTermLoanRecord).performing_status || 'N/A'}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>€{row.opening_balance.toLocaleString()}</TableCell>
                      <TableCell>{(row.interest_rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>{row.term}</TableCell>
                      <TableCell>{((row.pd || 0) * 100).toFixed(2)}%</TableCell>
                      <TableCell>{row.remaining_term ? Number(row.remaining_term).toFixed(0) : 'N/A'}</TableCell>
                      <TableCell>{row.lgd || 0}</TableCell>
                      <TableCell>{((row as LoanRecord).ltv || 0).toFixed(2)}%</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      {previewData.length > 10 && (
        <p className="text-sm text-gray-500 mt-2">Showing first 10 of {previewData.length.toLocaleString()} records on this page</p>
      )}
    </div>
  );
};
