import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Shield, Trash2 } from 'lucide-react';
import { 
  getExposureByDimension, 
  setExposureLimit, 
  deleteExposureLimit,
  type ExposureData 
} from '@/utils/supabaseCTL';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExposureLimitsManagerProps {
  datasetName: string;
}

type DimensionType = 'sector' | 'borrower' | 'country' | 'rating';

const ExposureLimitsManager: React.FC<ExposureLimitsManagerProps> = ({ datasetName }) => {
  const [selectedDimension, setSelectedDimension] = useState<DimensionType>('sector');
  const [exposures, setExposures] = useState<ExposureData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (datasetName && user) {
      loadExposures();
    }
  }, [datasetName, selectedDimension, user]);

  const loadExposures = async () => {
    try {
      setIsLoading(true);
      const data = await getExposureByDimension(datasetName, selectedDimension);
      setExposures(data);
    } catch (error) {
      console.error('Error loading exposures:', error);
      toast({
        title: "Error",
        description: "Failed to load exposure data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetLimit = async (key: string) => {
    if (!user) return;
    
    const amount = parseFloat(limitValue);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      await setExposureLimit(user.id, datasetName, selectedDimension, key, amount);
      toast({
        title: "Limit Set",
        description: `Exposure limit for ${key} set to €${amount.toLocaleString()}`,
      });
      setEditingKey(null);
      setLimitValue('');
      loadExposures();
    } catch (error) {
      console.error('Error setting limit:', error);
      toast({
        title: "Error",
        description: "Failed to set exposure limit",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLimit = async (key: string) => {
    if (!user) return;

    try {
      await deleteExposureLimit(user.id, datasetName, selectedDimension, key);
      toast({
        title: "Limit Removed",
        description: `Exposure limit for ${key} has been removed`,
      });
      loadExposures();
    } catch (error) {
      console.error('Error deleting limit:', error);
      toast({
        title: "Error",
        description: "Failed to remove exposure limit",
        variant: "destructive",
      });
    }
  };

  const totalBreaches = exposures.filter(e => e.limit_breach).length;
  const totalWithLimits = exposures.filter(e => e.limit_amount !== null).length;

  const getDimensionLabel = (type: DimensionType) => {
    const labels = {
      sector: 'Industry Sector',
      borrower: 'Borrower',
      country: 'Country',
      rating: 'Credit Rating'
    };
    return labels[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Exposure Limits Monitor
            </CardTitle>
            <CardDescription>
              Set and monitor exposure limits by {getDimensionLabel(selectedDimension).toLowerCase()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {totalBreaches > 0 && (
              <Badge variant="destructive" className="text-sm">
                {totalBreaches} Breach{totalBreaches > 1 ? 'es' : ''}
              </Badge>
            )}
            <Badge variant="outline" className="text-sm">
              {totalWithLimits} Limit{totalWithLimits !== 1 ? 's' : ''} Set
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dimension Selector */}
        <div className="flex items-center gap-4">
          <Label htmlFor="dimension" className="text-sm font-medium whitespace-nowrap">
            Group By:
          </Label>
          <Select
            value={selectedDimension}
            onValueChange={(value) => setSelectedDimension(value as DimensionType)}
          >
            <SelectTrigger id="dimension" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sector">Industry Sector</SelectItem>
              <SelectItem value="borrower">Borrower</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="rating">Credit Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Breach Alert */}
        {totalBreaches > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{totalBreaches}</strong> {getDimensionLabel(selectedDimension).toLowerCase()}{totalBreaches > 1 ? 's have' : ' has'} breached exposure limits
            </AlertDescription>
          </Alert>
        )}

        {/* Exposures Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading exposure data...</span>
          </div>
        ) : exposures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No exposure data available for this dataset
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{getDimensionLabel(selectedDimension)}</TableHead>
                  <TableHead className="text-right">Loans</TableHead>
                  <TableHead className="text-right">Current Exposure</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposures.map((exposure) => (
                  <TableRow 
                    key={exposure.dimension_key}
                    className={exposure.limit_breach ? "bg-destructive/10" : ""}
                  >
                    <TableCell className="font-medium">
                      {exposure.dimension_key}
                    </TableCell>
                    <TableCell className="text-right">
                      {exposure.loan_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      €{(exposure.total_exposure / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      {editingKey === exposure.dimension_key ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={limitValue}
                            onChange={(e) => setLimitValue(e.target.value)}
                            className="w-32 h-8 text-sm"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleSetLimit(exposure.dimension_key)}
                            className="h-8"
                          >
                            Set
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingKey(null);
                              setLimitValue('');
                            }}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : exposure.limit_amount ? (
                        <span className="text-sm">
                          €{(exposure.limit_amount / 1000000).toFixed(2)}M
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingKey(exposure.dimension_key);
                            setLimitValue('');
                          }}
                          className="h-8"
                        >
                          Set Limit
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {exposure.limit_breach ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Breach: €{(exposure.breach_amount / 1000000).toFixed(2)}M
                        </Badge>
                      ) : exposure.limit_amount ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Within Limit
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No Limit
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {exposure.limit_amount && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLimit(exposure.dimension_key)}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposureLimitsManager;
