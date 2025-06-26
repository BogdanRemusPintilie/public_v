
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LoanRecord } from '@/utils/supabase';

interface PortfolioChartsProps {
  allData: LoanRecord[];
  previewData: LoanRecord[];
  showExistingData?: boolean;
  portfolioSummary?: {
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  allData,
  previewData,
  showExistingData = false,
  portfolioSummary
}) => {
  // For uploaded data: use previewData (complete dataset)
  // For existing data: use allData if available, otherwise wait for it to load
  const dataToUse = showExistingData ? allData : previewData;
  
  console.log('📊 CHARTS DATA CHECK:', {
    showExistingData,
    allDataLength: allData.length,
    previewDataLength: previewData.length,
    dataToUseLength: dataToUse.length,
    portfolioSummary: portfolioSummary?.totalRecords
  });
  
  // For existing data: if we have portfolio summary but no allData loaded yet, show loading
  if (showExistingData && allData.length === 0 && portfolioSummary && portfolioSummary.totalRecords > 0) {
    return (
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          <p>Charts will be available once you load the data table</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">Click "View Data Table" to load all {portfolioSummary.totalRecords.toLocaleString()} records for chart analysis</p>
      </div>
    );
  }
  
  // Show no data state when there's truly no data
  if (dataToUse.length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No data available for charts</p>
      </div>
    );
  }

  const loanTypeData = dataToUse.reduce((acc, loan) => {
    const type = loan.loan_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { name: type, count: 0, value: 0 };
    }
    acc[type].count += 1;
    acc[type].value += loan.opening_balance;
    return acc;
  }, {} as Record<string, { name: string; count: number; value: number }>);

  const loanTypeChartData = Object.values(loanTypeData);

  const riskBuckets = [
    { name: 'Low Risk (0-1%)', min: 0, max: 0.01, count: 0, value: 0 },
    { name: 'Medium Risk (1-5%)', min: 0.01, max: 0.05, count: 0, value: 0 },
    { name: 'High Risk (>5%)', min: 0.05, max: 1, count: 0, value: 0 }
  ];

  dataToUse.forEach(loan => {
    const pd = loan.pd || 0;
    const bucket = riskBuckets.find(b => pd >= b.min && pd < b.max) || riskBuckets[riskBuckets.length - 1];
    bucket.count += 1;
    bucket.value += loan.opening_balance;
  });

  const riskChartData = riskBuckets.filter(bucket => bucket.count > 0);

  const creditScoreBuckets = [
    { name: '300-579', min: 300, max: 579, count: 0, value: 0 },
    { name: '580-669', min: 580, max: 669, count: 0, value: 0 },
    { name: '670-739', min: 670, max: 739, count: 0, value: 0 },
    { name: '740-799', min: 740, max: 799, count: 0, value: 0 },
    { name: '800-850', min: 800, max: 850, count: 0, value: 0 }
  ];

  dataToUse.forEach(loan => {
    const score = loan.credit_score;
    const bucket = creditScoreBuckets.find(b => score >= b.min && score <= b.max);
    if (bucket) {
      bucket.count += 1;
      bucket.value += loan.opening_balance;
    }
  });

  const creditScoreChartData = creditScoreBuckets.filter(bucket => bucket.count > 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Portfolio Analytics</h3>
        <p className="text-sm text-gray-600">
          Analysis based on {dataToUse.length.toLocaleString()} records
          {showExistingData && portfolioSummary && dataToUse.length === portfolioSummary.totalRecords && (
            <span className="ml-1 text-green-600 font-medium">
              (Complete dataset loaded)
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Types Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Loan Distribution by Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {loanTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Risk Distribution (PD)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Loan Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Credit Score Distribution */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Credit Score Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={creditScoreChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Loan Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Value Distribution */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Portfolio Value by Loan Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loanTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value, name) => [`$${value.toLocaleString()}`, 'Total Value']} />
              <Legend />
              <Bar dataKey="value" fill="#ffc658" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
