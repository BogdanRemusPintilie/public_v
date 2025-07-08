
import React from 'react';

interface PortfolioSummaryProps {
  portfolioSummary: {
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  };
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolioSummary }) => {
  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Portfolio Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{portfolioSummary.totalRecords.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Loans</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            €{(portfolioSummary.totalValue / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-600">Portfolio Value</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {portfolioSummary.avgInterestRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Avg Interest Rate</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">{portfolioSummary.highRiskLoans}</div>
          <div className="text-sm text-gray-600">High Risk Loans</div>
        </div>
      </div>
    </div>
  );
};
