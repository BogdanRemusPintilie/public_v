import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PARSER_REGISTRY, LoanType } from '@/utils/parsers/parserRegistry';
import { FileText } from 'lucide-react';

interface LoanTypeSelectorProps {
  value: LoanType;
  onChange: (type: LoanType) => void;
  disabled?: boolean;
}

export const LoanTypeSelector: React.FC<LoanTypeSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Select Loan Tape Type
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          <SelectValue placeholder="Choose loan type..." />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 z-50">
          {Object.entries(PARSER_REGISTRY).map(([key, config]) => (
            <SelectItem 
              key={key} 
              value={key}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {config.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        This determines which import schema and analytics will be used for your dataset
      </p>
    </div>
  );
};
