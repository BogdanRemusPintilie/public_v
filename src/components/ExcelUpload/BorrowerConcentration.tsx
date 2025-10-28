import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BorrowerConcentration as BorrowerConcentrationType, getCTLBorrowerConcentration, CTLFilterCriteria } from '@/utils/supabaseCTL';
import { Loader2, Users } from 'lucide-react';

interface BorrowerConcentrationProps {
  datasetName: string;
  filters?: CTLFilterCriteria;
}

/**
 * BorrowerConcentration Component
 * 
 * Displays borrower concentration analysis for Corporate Term Loans.
 * Groups loans by borrower name and shows:
 * - Total exposure per borrower
 * - Number of loans per borrower
 * - Average credit rating
 * - Portfolio share percentage
 * - Average interest rate and leverage ratio
 * 
 * Uses database-side aggregation for performance with large datasets.
 */
export const BorrowerConcentration: React.FC<BorrowerConcentrationProps> = ({ datasetName, filters }) => {
  const [borrowerData, setBorrowerData] = useState<BorrowerConcentrationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadBorrowerConcentration = async () => {
      if (!datasetName) return;
      
      setIsLoading(true);
      try {
        console.log('📊 Loading borrower concentration for:', datasetName, 'with filters:', filters);
        const data = await getCTLBorrowerConcentration(datasetName, filters);
        setBorrowerData(data);
        console.log('✅ Loaded', data.length, 'borrowers');
      } catch (error) {
        console.error('❌ Error loading borrower concentration:', error);
        setBorrowerData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBorrowerConcentration();
  }, [datasetName, filters]);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading borrower concentration...</span>
        </CardContent>
      </Card>
    );
  }

  if (borrowerData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Borrower Concentration
          </CardTitle>
          <CardDescription>No borrower data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Borrower Concentration
        </CardTitle>
        <CardDescription>
          Loan exposure grouped by borrower ({borrowerData.length} borrowers)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Borrower Name</TableHead>
                <TableHead className="text-right font-semibold">Total Exposure</TableHead>
                <TableHead className="text-center font-semibold">Loan Count</TableHead>
                <TableHead className="text-center font-semibold">Avg Rating</TableHead>
                <TableHead className="text-right font-semibold">Portfolio Share</TableHead>
                <TableHead className="text-right font-semibold">Avg Interest Rate</TableHead>
                <TableHead className="text-right font-semibold">Avg Leverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrowerData.map((borrower, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {borrower.borrower_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    €{(borrower.total_exposure / 1_000_000).toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {borrower.loan_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      borrower.avg_credit_rating?.startsWith('A') 
                        ? 'bg-green-100 text-green-700'
                        : borrower.avg_credit_rating?.startsWith('B')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {borrower.avg_credit_rating || 'N/R'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(borrower.portfolio_share, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {borrower.portfolio_share.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {borrower.avg_interest_rate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {borrower.avg_leverage_ratio.toFixed(2)}x
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{borrowerData.length}</div>
            <div className="text-sm text-blue-700">Total Borrowers</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              €{(borrowerData.reduce((sum, b) => sum + b.total_exposure, 0) / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-sm text-green-700">Total Exposure</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {borrowerData.reduce((sum, b) => sum + b.loan_count, 0)}
            </div>
            <div className="text-sm text-purple-700">Total Loans</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
