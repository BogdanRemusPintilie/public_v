import React, { useState, useEffect } from 'react';
import { AllocationView } from './AllocationView';
import { DistributionSummary } from './DistributionSummary';

interface AllocationViewWithDistributionProps {
  offer: any;
  datasetSummary: any;
  offerResponses: any[];
  userType: string;
}

/**
 * Wrapper component that manages allocation state and shares it between
 * AllocationView (for assignment) and DistributionSummary (for finalization)
 */
export function AllocationViewWithDistribution({ 
  offer, 
  datasetSummary, 
  offerResponses, 
  userType 
}: AllocationViewWithDistributionProps) {
  const [allocations, setAllocations] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <AllocationView 
        offer={offer} 
        datasetSummary={datasetSummary}
        offerResponses={offerResponses}
        userType={userType}
        allocations={allocations}
        onAllocationsChange={setAllocations}
      />
      <DistributionSummary
        offer={offer}
        datasetSummary={datasetSummary}
        offerResponses={offerResponses}
        userType={userType}
        allocations={allocations}
      />
    </div>
  );
}
