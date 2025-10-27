import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { getCTLIndustryDistribution, getCTLRatingDistribution } from '@/utils/supabaseCTL';

interface CTLPortfolioChartsProps {
  selectedDatasetName?: string;
  showExistingData: boolean;
  allData?: any[];
  previewData?: any[];
}

const CHART_COLORS = ['#4169e1', '#2563eb', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const CTLPortfolioCharts: React.FC<CTLPortfolioChartsProps> = ({
  selectedDatasetName,
  showExistingData,
  allData = [],
  previewData = [],
}) => {
  const [industryData, setIndustryData] = useState<{ industry: string; count: number; totalExposure: number }[]>([]);
  const [ratingData, setRatingData] = useState<{ rating: string; count: number }[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (showExistingData && selectedDatasetName) {
        try {
          const [industry, rating] = await Promise.all([
            getCTLIndustryDistribution(selectedDatasetName),
            getCTLRatingDistribution(selectedDatasetName),
          ]);
          setIndustryData(industry);
          setRatingData(rating);
        } catch (error) {
          console.error('Error fetching CTL chart data:', error);
          // Fallback to client-side calculation
          calculateClientSideData();
        }
      } else {
        // Preview mode - calculate from local data
        calculateClientSideData();
      }
    };

    fetchChartData();
  }, [selectedDatasetName, showExistingData, allData, previewData]);

  const calculateClientSideData = () => {
    const dataToUse = previewData.length > 0 ? previewData : allData;
    
    // Calculate industry distribution
    const industryMap = new Map<string, { count: number; exposure: number }>();
    const ratingMap = new Map<string, number>();

    dataToUse.forEach(loan => {
      const industry = loan.industry_sector || loan.industrySector || 'Unknown';
      const rating = loan.credit_rating || loan.creditRating || 'Not Rated';
      const exposure = Number(loan.current_balance || loan.currentBalance || 0);

      // Industry
      const existing = industryMap.get(industry) || { count: 0, exposure: 0 };
      industryMap.set(industry, {
        count: existing.count + 1,
        exposure: existing.exposure + exposure,
      });

      // Rating
      ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
    });

    setIndustryData(
      Array.from(industryMap.entries())
        .map(([industry, { count, exposure }]) => ({
          industry,
          count,
          totalExposure: exposure,
        }))
        .sort((a, b) => b.totalExposure - a.totalExposure)
        .slice(0, 10)
    );

    setRatingData(
      Array.from(ratingMap.entries())
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => b.count - a.count)
    );
  };

  const getTotalRecords = () => {
    if (showExistingData) {
      return industryData.reduce((sum, item) => sum + item.count, 0);
    }
    return previewData.length > 0 ? previewData.length : allData.length;
  };

  return (
    <div className="mt-6 space-y-6">
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Industry Distribution</h4>
        {showExistingData && (
          <p className="text-sm text-gray-600 mb-2">
            Showing {getTotalRecords().toLocaleString()} loans across {industryData.length} sectors
          </p>
        )}
        <ChartContainer
          config={{
            count: { label: 'Loans', color: '#4169e1' },
            totalExposure: { label: 'Exposure (€)', color: '#2563eb' },
          }}
          className="h-[300px]"
        >
          <BarChart data={industryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="industry"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const exposureValue = payload[1]?.value;
                  const exposureNum = typeof exposureValue === 'number' ? exposureValue : 0;
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold">{payload[0].payload.industry}</p>
                      <p className="text-sm text-blue-600">Loans: {payload[0].value}</p>
                      <p className="text-sm text-green-600">
                        Exposure: €{(exposureNum / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="left" dataKey="count" fill="#4169e1" name="Loans" />
            <Bar yAxisId="right" dataKey="totalExposure" fill="#2563eb" name="Exposure" />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Credit Rating Distribution</h4>
        {showExistingData && (
          <p className="text-sm text-gray-600 mb-2">
            {ratingData.length} rating categories
          </p>
        )}
        <ChartContainer
          config={{
            count: { label: 'Loans', color: '#4169e1' },
          }}
          className="h-[300px]"
        >
          <PieChart>
            <Pie
              data={ratingData}
              dataKey="count"
              nameKey="rating"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ rating, count, percent }) =>
                `${rating}: ${count} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {ratingData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold">{payload[0].name}</p>
                      <p className="text-sm text-blue-600">Count: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ChartContainer>
      </Card>
    </div>
  );
};
