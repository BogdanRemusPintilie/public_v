
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

interface DataPreviewTableProps {
  previewData: LoanRecord[];
  selectedRecords: Set<string>;
  showExistingData: boolean;
  totalRecords: number;
  currentPage: number;
  hasMore: boolean;
  isProcessing: boolean;
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
  onSelectRecord,
  onSelectAll,
  onDeleteSelected,
  onPageChange
}) => {
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
                <TableHead>Opening Balance</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Term (Months)</TableHead>
                <TableHead>PD</TableHead>
                <TableHead>Loan Type</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>LTV</TableHead>
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
                  <TableCell>${row.opening_balance.toLocaleString()}</TableCell>
                  <TableCell>{row.interest_rate.toFixed(2)}%</TableCell>
                  <TableCell>{row.term}</TableCell>
                  <TableCell>{((row.pd || 0) * 100).toFixed(2)}%</TableCell>
                  <TableCell>{row.loan_type}</TableCell>
                  <TableCell>{row.credit_score}</TableCell>
                  <TableCell>{row.ltv.toFixed(2)}%</TableCell>
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
