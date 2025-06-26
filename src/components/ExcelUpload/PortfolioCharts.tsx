
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LoanRecord } from '@/utils/supabase';

interface PortfolioChartsProps {
  allData: LoanRecord[];
  previewData: LoanRecord[];
  showExistingData: boolean;
  portfolioSummary?: {
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  };
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  allData,
  previewData,
  showExistingData,
  portfolioSummary
}) => {
  // For existing data with lazy loading, use summary data to create simplified charts
  if (showExistingData && portfolioSummary && allData.length === 0) {
    // Create simple charts from summary data
    const riskData = [
      { name: 'Low Risk', value: portfolioSummary.totalRecords - portfolioSummary.highRiskLoans },
      { name: 'High Risk', value: portfolioSummary.highRiskLoans }
    ];

    const COLORS = ['#10b981', '#ef4444'];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>High risk vs low risk loans (PD > 5%)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Key portfolio metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Records:</span>
                <span className="text-sm">{portfolioSummary.totalRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Value:</span>
                <span className="text-sm">${(portfolioSummary.totalValue / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg Interest Rate:</span>
                <span className="text-sm">{portfolioSummary.avgInterestRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">High Risk Loans:</span>
                <span className="text-sm">{portfolioSummary.highRiskLoans.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                💡 Load the data table to see detailed charts and analysis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For uploaded files or when full data is loaded, show detailed charts
  const dataToUse = showExistingData ? allData : previewData;
  
  if (dataToUse.length === 0) {
    return null;
  }

  // Interest rate distribution
  const interestRateRanges = [
    { range: '0-3%', min: 0, max: 3, count: 0 },
    { range: '3-5%', min: 3, max: 5, count: 0 },
    { range: '5-7%', min: 5, max: 7, count: 0 },
    { range: '7-10%', min: 7, max: 10, count: 0 },
    { range: '10%+', min: 10, max: 100, count: 0 }
  ];

  dataToUse.forEach(loan => {
    const rate = loan.interest_rate;
    const range = interestRateRanges.find(r => rate >= r.min && rate < r.max) || interestRateRanges[4];
    range.count++;
  });

  // Risk distribution (PD > 5% considered high risk)
  const highRiskCount = dataToUse.filter(loan => (loan.pd || 0) > 0.05).length;
  const lowRiskCount = dataToUse.length - highRiskCount;
  
  const riskData = [
    { name: 'Low Risk', value: lowRiskCount },
    { name: 'High Risk', value: highRiskCount }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Interest Rate Distribution</CardTitle>
          <CardDescription>Number of loans by interest rate range</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={interestRateRanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>High risk vs low risk loans (PD > 5%)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
