import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface StructureSummaryProps {
  structure: any;
  dataset: any;
}

export function StructureSummary({ structure, dataset }: StructureSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const calculateTrancheValue = (thickness: number) => {
    if (!dataset) return 0;
    const baseTotal = Number(dataset?.total_opening_balance ?? dataset?.total_value ?? 0);
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

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Structure Summary: {structure.structure_name}
        </CardTitle>
        <CardDescription>
          Dataset: {structure.dataset_name} | Total Value: {formatCurrency(Number(dataset?.total_opening_balance ?? dataset?.total_value ?? 0))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {structure.tranches.length}
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
