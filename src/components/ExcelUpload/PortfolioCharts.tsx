
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { LoanRecord } from '@/utils/supabase';

interface PortfolioChartsProps {
  allData: LoanRecord[];
  previewData: LoanRecord[];
  showExistingData: boolean;
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  allData,
  previewData,
  showExistingData
}) => {
  const chartConfig = {
    count: {
      label: "Count",
      color: "#2563eb",
    },
  };

  const getMaturityDistribution = () => {
    // Use allData for charts when showing existing data, previewData for uploads
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

  const getLoanSizeDistribution = () => {
    // Use allData for charts when showing existing data, previewData for uploads
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

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Loan Distribution by Maturity
            {showExistingData && (
              <span className="text-sm text-gray-500 block">Based on all {allData.length.toLocaleString()} records</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={getMaturityDistribution()}>
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
              <span className="text-sm text-gray-500 block">Based on all {allData.length.toLocaleString()} records</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={getLoanSizeDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getLoanSizeDistribution().map((entry, index) => (
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
