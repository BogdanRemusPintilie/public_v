
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { LoanRecord, getMaturityDistribution, getLoanSizeDistribution, FilterCriteria } from '@/utils/supabase';

interface PortfolioChartsProps {
  allData: LoanRecord[];
  previewData: LoanRecord[];
  showExistingData: boolean;
  selectedDatasetName?: string;
  filters?: FilterCriteria;
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  allData,
  previewData,
  showExistingData,
  selectedDatasetName,
  filters
}) => {
  const [maturityData, setMaturityData] = useState<{ range: string; count: number }[]>([]);
  const [loanSizeData, setLoanSizeData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const chartConfig = {
    count: {
      label: "Count",
      color: "#2563eb",
    },
  };

  // Client-side calculation for preview mode (when uploading files)
  const getClientSideMaturityDistribution = () => {
    const dataToUse = showExistingData ? allData : previewData;
    if (dataToUse.length === 0) return [];
    
    const buckets = [
      { range: 'Up to 36 months', min: 0, max: 36 },
      { range: '37-60 months', min: 37, max: 60 },
      { range: '61-84 months', min: 61, max: 84 },
      { range: 'More than 84 months', min: 85, max: 1000 }
    ];
    
    return buckets.map(bucket => ({
      range: bucket.range,
      count: dataToUse.filter(loan => 
        loan.term >= bucket.min && loan.term <= bucket.max
      ).length
    }));
  };

  const getClientSideLoanSizeDistribution = () => {
    const dataToUse = showExistingData ? allData : previewData;
    if (dataToUse.length === 0) return [];
    
    const buckets = [
      { range: 'Up to €10k', min: 0, max: 10000 },
      { range: '€10k-€25k', min: 10000, max: 25000 },
      { range: '€25k-€50k', min: 25000, max: 50000 },
      { range: '€50k-€100k', min: 50000, max: 100000 },
      { range: 'More than €100k', min: 100000, max: Number.MAX_VALUE }
    ];
    
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    return buckets.map((bucket, index) => ({
      name: bucket.range,
      value: dataToUse.filter(loan => 
        loan.opening_balance > bucket.min && loan.opening_balance <= bucket.max
      ).length,
      fill: colors[index]
    })).filter(item => item.value > 0);
  };

  // Load chart data from database for existing datasets
  useEffect(() => {
    const loadChartData = async () => {
      if (showExistingData && selectedDatasetName) {
        setLoading(true);
        try {
          const [maturityDist, loanSizeDist] = await Promise.all([
            getMaturityDistribution(selectedDatasetName, filters),
            getLoanSizeDistribution(selectedDatasetName, filters)
          ]);
          
          setMaturityData(maturityDist);
          setLoanSizeData(loanSizeDist);
        } catch (error) {
          console.error('Error loading chart data:', error);
          // Fallback to client-side calculations
          setMaturityData(getClientSideMaturityDistribution());
          setLoanSizeData(getClientSideLoanSizeDistribution());
        } finally {
          setLoading(false);
        }
      } else {
        // For preview mode, use client-side calculations
        setMaturityData(getClientSideMaturityDistribution());
        setLoanSizeData(getClientSideLoanSizeDistribution());
      }
    };

    loadChartData();
  }, [showExistingData, selectedDatasetName, filters, allData, previewData]);

  const totalRecords = showExistingData ? allData.length : previewData.length;

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Loan Distribution by Maturity
            {showExistingData && (
              <span className="text-sm text-gray-500 block">
                Based on {loading ? 'loading...' : `${totalRecords.toLocaleString()} records`}
                {filters && Object.values(filters).some(v => v !== undefined) && ' (filtered)'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={maturityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Portfolio Composition by Loan Size
            {showExistingData && (
              <span className="text-sm text-gray-500 block">
                Based on {loading ? 'loading...' : `${totalRecords.toLocaleString()} records`}
                {filters && Object.values(filters).some(v => v !== undefined) && ' (filtered)'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={loanSizeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {loanSizeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
