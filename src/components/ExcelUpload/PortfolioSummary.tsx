
import React from 'react';

interface PortfolioSummaryProps {
  portfolioSummary: {
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
    weightedAvgInterestRate: number;
    weightedAvgLtv: number;
    weightedAvgPd: number;
    weightedAvgLgd: number;
    expectedLoss: number;
  };
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolioSummary }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else {
      return `€${value.toLocaleString()}`;
    }
  };

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
            {formatCurrency(portfolioSummary.totalValue)}
          </div>
          <div className="text-sm text-gray-600">Portfolio Value</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {portfolioSummary.weightedAvgInterestRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Weighted Avg IR</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-indigo-600">
            {portfolioSummary.weightedAvgLtv.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Weighted Avg LTV</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {(portfolioSummary.weightedAvgPd).toFixed(4)}%
          </div>
          <div className="text-sm text-gray-600">Weighted Avg PD</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {(portfolioSummary.weightedAvgLgd).toFixed(4)}%
          </div>
          <div className="text-sm text-gray-600">Weighted Avg LGD</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(portfolioSummary.expectedLoss)}
          </div>
          <div className="text-sm text-gray-600">Expected Loss</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">{portfolioSummary.highRiskLoans}</div>
          <div className="text-sm text-gray-600">High Risk Loans</div>
          <div className="text-xs text-gray-400">PD {'>'}  10%</div>
        </div>
      </div>
    </div>
  );
};
