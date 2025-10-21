import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StructureSummaryProps {
  structure: any;
  dataset: any;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_count: number;
  created_at: string;
}

export function StructureSummary({ structure, dataset }: StructureSummaryProps) {
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);

  useEffect(() => {
    const fetchDatasetSummary = async () => {
      if (!structure?.dataset_name) return;

      console.log('📊 StructureSummary - Fetching summary for dataset:', structure.dataset_name);

      try {
        // Use get_portfolio_summary for single dataset - much faster than get_dataset_summaries_optimized
        const { data: summaryData, error: summaryError } = await supabase.rpc('get_portfolio_summary', {
          dataset_name_param: structure.dataset_name
        });
        
        if (summaryError) {
          console.error('❌ Error fetching dataset summary:', summaryError);
          return;
        }

        if (summaryData && summaryData.length > 0) {
          const summary = summaryData[0];
          setDatasetSummary({
            dataset_name: structure.dataset_name,
            record_count: summary.total_records,
            total_value: summary.total_value,
            avg_interest_rate: summary.avg_interest_rate,
            high_risk_count: summary.high_risk_loans,
            created_at: new Date().toISOString()
          });
          console.log('✅ Dataset summary loaded:', summary);
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    };

    fetchDatasetSummary();
  }, [structure?.dataset_name]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculateTrancheValue = (thickness: number) => {
    // Use database-aggregated total_value from get_dataset_summaries_optimized (same as analytics)
    const baseTotal = datasetSummary?.total_value || 0;
    const pct = Number(thickness ?? 0);
    return (baseTotal * pct) / 100;
  };

  const getTranchePosition = (index: number) => {
    const reversedTranches = [...structure.tranches].reverse();
    const reversedIndex = structure.tranches.length - 1 - index;
    
    const startPosition = reversedTranches
      .slice(0, reversedIndex)
      .reduce((sum: number, tranche: any) => sum + tranche.thickness, 0);
    const endPosition = startPosition + structure.tranches[index].thickness;
    return { start: startPosition, end: endPosition };
  };

  const getTrancheColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    return colors[index % colors.length];
  };

  const hasData = datasetSummary && datasetSummary.total_value > 0;
  const hasTranches = structure?.tranches && Array.isArray(structure.tranches) && structure.tranches.length > 0;

  if (!structure) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Structure Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800">⚠️ No Structure Data</p>
            <p className="text-xs text-yellow-700 mt-1">
              Structure information is not available.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Structure Summary: {structure.structure_name}
        </CardTitle>
        <CardDescription>
          Dataset: {structure.dataset_name} | Total Value: {formatCurrency(datasetSummary?.total_value || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-yellow-800">⚠️ Warning: No Data Available</p>
            <p className="text-xs text-yellow-700 mt-1">
              The dataset "{structure.dataset_name}" appears to be empty or has been deleted. 
              Portfolio values and calculations cannot be displayed.
            </p>
          </div>
        )}
        {!hasTranches && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-800">ℹ️ No Tranche Data</p>
            <p className="text-xs text-blue-700 mt-1">
              No tranches have been configured for this structure yet.
            </p>
          </div>
        )}
        {hasTranches && (
          <>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tranche Structure</h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden h-48">
                {structure.tranches.map((tranche: any, index: number) => {
              const position = getTranchePosition(index);
              const height = (tranche.thickness / 100) * 100;
              const bottom = (position.start / 100) * 100;
              
              return (
                <div
                  key={tranche.id}
                  className={`absolute w-full ${getTrancheColor(index)} flex items-center justify-center text-white font-medium text-xs`}
                  style={{
                    height: `${height}%`,
                    bottom: `${bottom}%`,
                  }}
                >
                  <div className="text-center">
                    <div className="font-semibold">{tranche.name}</div>
                    <div>{tranche.thickness}%</div>
                  </div>
                </div>
              );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tranche Details</h4>
              <div className="grid gap-2">
                {structure.tranches.map((tranche: any, index: number) => {
              const position = getTranchePosition(index);
              const trancheValue = calculateTrancheValue(tranche.thickness);
              
              return (
                <div key={tranche.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getTrancheColor(index)}`}></div>
                    <span className="font-medium">{tranche.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(trancheValue)} ({position.start.toFixed(1)}% - {position.end.toFixed(1)}%)
                  </div>
                </div>
              );
                })}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {hasTranches ? structure.tranches.length : 0}
            </div>
            <div className="text-sm text-gray-600">Total Tranches</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {structure.weighted_avg_cost_bps?.toFixed(0) || 0} BPS
            </div>
            <div className="text-sm text-gray-600">Estimated Weighted Average Cost</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
