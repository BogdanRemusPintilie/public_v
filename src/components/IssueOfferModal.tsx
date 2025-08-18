import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const offerSchema = z.object({
  offer_name: z.string().min(1, 'Offer name is required'),
  structure_id: z.string().min(1, 'Please select a structure'),
  shared_with_emails: z.array(z.string().email('Invalid email format')).min(0),
  comments: z.string().optional(),
  // Issuer Characterization
  issuer_nationality: z.string().optional(),
  issuer_overview: z.string().optional(),
  issuer_business_focus: z.string().optional(),
  // Structure Characterization
  structure_type: z.string().optional(),
  structure_figures: z.string().optional(),
  structure_synthetic: z.boolean().default(false),
  structure_true_sale: z.boolean().default(false),
  structure_sts: z.boolean().default(false),
  structure_consumer_finance: z.boolean().default(false),
  additional_comments: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface Structure {
  id: string;
  structure_name: string;
  dataset_name: string;
  tranches: Array<{
    id: string;
    name: string;
    thickness: number;
    costBps: number;
    hedgedPercentage: number;
  }>;
  total_cost: number;
  weighted_avg_cost_bps: number;
  cost_percentage: number;
}

interface IssueOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueOfferModal({ open, onOpenChange }: IssueOfferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_name: '',
      structure_id: '',
      shared_with_emails: [],
      comments: '',
      issuer_nationality: '',
      issuer_overview: '',
      issuer_business_focus: '',
      structure_type: '',
      structure_figures: '',
      structure_synthetic: false,
      structure_true_sale: false,
      structure_sts: false,
      structure_consumer_finance: false,
      additional_comments: '',
    },
  });

  // Fetch user's structures
  useEffect(() => {
    if (open && user) {
      fetchStructures();
    }
  }, [open, user]);

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('tranche_structures')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Cast the Json tranches back to array type
      const structures = (data || []).map(item => ({
        ...item,
        tranches: item.tranches as any[]
      }));
      setStructures(structures);
    } catch (error) {
      console.error('Error fetching structures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load structures',
        variant: 'destructive',
      });
    }
  };

  const fetchDatasetSummary = async (datasetName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_dataset_summaries');
      
      if (error) throw error;
      
      const dataset = data?.find((d: any) => d.dataset_name === datasetName);
      setSelectedDataset(dataset);
    } catch (error) {
      console.error('Error fetching dataset summary:', error);
    }
  };

  const handleStructureSelect = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    setSelectedStructure(structure || null);
    if (structure) {
      fetchDatasetSummary(structure.dataset_name);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !emailList.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        const newEmailList = [...emailList, email];
        setEmailList(newEmailList);
        form.setValue('shared_with_emails', newEmailList);
        setEmailInput('');
      } else {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmailList = emailList.filter(email => email !== emailToRemove);
    setEmailList(newEmailList);
    form.setValue('shared_with_emails', newEmailList);
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const onSubmit = async (data: OfferFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          user_id: user.id,
          offer_name: data.offer_name,
          structure_id: data.structure_id,
          shared_with_emails: emailList,
          comments: data.comments || null,
          issuer_nationality: data.issuer_nationality || null,
          issuer_overview: data.issuer_overview || null,
          issuer_business_focus: data.issuer_business_focus || null,
          structure_type: data.structure_type || null,
          structure_figures: data.structure_figures || null,
          structure_synthetic: data.structure_synthetic,
          structure_true_sale: data.structure_true_sale,
          structure_sts: data.structure_sts,
          structure_consumer_finance: data.structure_consumer_finance,
          additional_comments: data.additional_comments || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer created successfully',
      });

      // Reset form and close modal
      form.reset();
      setEmailList([]);
      setEmailInput('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create offer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue New Offer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="structure_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Structure *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handleStructureSelect(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {structures.map((structure) => (
                        <SelectItem key={structure.id} value={structure.id}>
                          {structure.structure_name} ({structure.dataset_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStructure && selectedDataset && (
              <StructureSummary 
                structure={selectedStructure} 
                dataset={selectedDataset}
              />
            )}

            <FormField
              control={form.control}
              name="offer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter offer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Investor Emails</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleEmailKeyPress}
                />
                <Button type="button" onClick={addEmail} variant="outline">
                  Add
                </Button>
              </div>
              
              {emailList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailList.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-6" />
            
            {/* Transaction Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transaction Overview</h3>
              
              {/* Issuer Characterization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Issuer Characterization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="issuer_nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., German, Spanish, Italian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issuer_overview"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Overview</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the issuer, their history, size, etc."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issuer_business_focus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Focus</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description of the issuer's main business activities and focus areas"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Structure Characterization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Structure Characterization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="structure_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Structure Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select structure type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="abs">Asset-Backed Securities (ABS)</SelectItem>
                            <SelectItem value="mbs">Mortgage-Backed Securities (MBS)</SelectItem>
                            <SelectItem value="rmbs">Residential MBS (RMBS)</SelectItem>
                            <SelectItem value="cmbs">Commercial MBS (CMBS)</SelectItem>
                            <SelectItem value="cdo">Collateralized Debt Obligation (CDO)</SelectItem>
                            <SelectItem value="clo">Collateralized Loan Obligation (CLO)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="structure_figures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Figures</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Key numerical figures and metrics of the structure"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="structure_synthetic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Synthetic</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="structure_true_sale"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>True Sale</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="structure_sts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>STS Compliant</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="structure_consumer_finance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Consumer Finance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <FormField
                control={form.control}
                name="additional_comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional open-ended comments about the transaction"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional general comments about this offer"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Offer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface StructureSummaryProps {
  structure: Structure;
  dataset: any;
}

function StructureSummary({ structure, dataset }: StructureSummaryProps) {
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
    return (dataset.total_value * thickness) / 100;
  };

  const getTranchePosition = (index: number) => {
    // Calculate from bottom to top (reverse order)
    const reversedTranches = [...structure.tranches].reverse();
    const reversedIndex = structure.tranches.length - 1 - index;
    
    const startPosition = reversedTranches
      .slice(0, reversedIndex)
      .reduce((sum, tranche) => sum + tranche.thickness, 0);
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
          Dataset: {structure.dataset_name} | Total Value: {formatCurrency(dataset?.total_value || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column Graphic */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Tranche Structure</h4>
          <div className="relative bg-gray-100 rounded-lg overflow-hidden h-48">
            {structure.tranches.map((tranche, index) => {
              const position = getTranchePosition(index);
              const height = (tranche.thickness / 100) * 100;
              // Display from bottom to top
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

        {/* Tranche Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Tranche Details</h4>
          <div className="grid gap-2">
            {structure.tranches.map((tranche, index) => {
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {structure.tranches.length}
            </div>
            <div className="text-sm text-gray-600">Total Tranches</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {structure.weighted_avg_cost_bps.toFixed(0)} BPS
            </div>
            <div className="text-sm text-gray-600">Weighted Avg Cost</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}