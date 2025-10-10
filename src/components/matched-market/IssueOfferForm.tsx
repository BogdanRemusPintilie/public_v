import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, BarChart3 } from 'lucide-react';
import { InvestorSelector } from '@/components/InvestorSelector';
import { StructureSummary } from './StructureSummary';

const offerSchema = z.object({
  offer_name: z.string().min(1, 'Offer name is required'),
  structure_id: z.string().min(1, 'Please select a structure'),
  shared_with_emails: z.array(z.string().email('Invalid email format')).min(0),
  target_investors: z.array(z.string()).min(0),
  comments: z.string().optional(),
  issuer_nationality: z.string().optional(),
  issuer_overview: z.string().optional(),
  issuer_business_focus: z.string().optional(),
  structure_synthetic: z.boolean().default(false),
  structure_true_sale: z.boolean().default(false),
  structure_sts: z.boolean().default(false),
  structure_sector: z.string().optional(),
  structure_sector_other: z.string().optional(),
  expected_pool_size: z.string().optional(),
  weighted_average_life: z.string().optional(),
  additional_comments: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface IssueOfferFormProps {
  onSuccess?: () => void;
}

export function IssueOfferForm({ onSuccess }: IssueOfferFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [showInvestorSelector, setShowInvestorSelector] = useState(false);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_name: '',
      structure_id: '',
      shared_with_emails: [],
      target_investors: [],
      comments: '',
      issuer_nationality: '',
      issuer_overview: '',
      issuer_business_focus: '',
      structure_synthetic: false,
      structure_true_sale: false,
      structure_sts: false,
      structure_sector: '',
      structure_sector_other: '',
      expected_pool_size: '',
      weighted_average_life: '',
      additional_comments: '',
    },
  });

  useEffect(() => {
    if (user) {
      fetchStructures();
    }
  }, [user]);

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('tranche_structures')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      
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

  const handleStructureSelect = async (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    setSelectedStructure(structure || null);
    
    if (structure) {
      try {
        const { data, error } = await supabase
          .from('loan_data')
          .select('loan_amount, opening_balance')
          .eq('dataset_name', structure.dataset_name)
          .eq('user_id', user?.id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const totalAmount = data.reduce((sum, loan) => sum + Number(loan.loan_amount || 0), 0);
          const totalBalance = data.reduce((sum, loan) => sum + Number(loan.opening_balance || 0), 0);
          
          setSelectedDataset({
            dataset_name: structure.dataset_name,
            loan_count: data.length,
            total_loan_amount: totalAmount,
            total_opening_balance: totalBalance
          });
          
          // Set the overall asset pool size in millions
          const poolSizeInMillions = (totalBalance / 1000000).toFixed(2);
          form.setValue('expected_pool_size', poolSizeInMillions);
        }
      } catch (error) {
        console.error('Error fetching dataset summary:', error);
        setSelectedDataset(null);
      }
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !emailList.includes(email)) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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
          shared_with_emails: [...emailList, ...additionalEmails],
          target_investors: selectedInvestors,
          comments: data.comments || null,
          issuer_nationality: data.issuer_nationality || null,
          issuer_overview: data.issuer_overview || null,
          issuer_business_focus: data.issuer_business_focus || null,
          structure_synthetic: data.structure_synthetic,
          structure_true_sale: data.structure_true_sale,
          structure_sts: data.structure_sts,
          structure_sector: data.structure_sector === 'Other' ? data.structure_sector_other : data.structure_sector,
          additional_comments: data.additional_comments || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer created successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
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
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Structure Selection</CardTitle>
              <CardDescription>Select a tranche structure for this offer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        ))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStructure && selectedDataset && (
                <StructureSummary structure={selectedStructure} dataset={selectedDataset} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Target Investors</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInvestorSelector(true)}
                  className="w-full"
                >
                  {selectedInvestors.length > 0 
                    ? `${selectedInvestors.length} investor(s) selected` 
                    : 'Choose investors'
                  }
                </Button>
                
                {selectedInvestors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedInvestors.map((investor) => (
                      <div key={investor} className="bg-secondary px-3 py-1 rounded-md text-sm">
                        {investor}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Additional Emails</Label>
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
                    {emailList.map((email) => (
                      <div
                        key={email}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issuer Characterization</CardTitle>
              <CardDescription>Provide details about the issuer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="issuer_nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuer Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter issuer nationality" {...field} />
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
                    <FormLabel>Issuer Overview</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter issuer overview" {...field} />
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
                    <FormLabel>Issuer Business Focus</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter issuer business focus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Structure Characterization</CardTitle>
              <CardDescription>Provide details about the structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Sector</h3>
              <FormField
                control={form.control}
                name="structure_sector"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Automotive Finance">Automotive Finance</SelectItem>
                        <SelectItem value="Project Finance">Project Finance</SelectItem>
                        <SelectItem value="Large Corporate Loans">Large Corporate Loans</SelectItem>
                        <SelectItem value="SME Corporate Loans">SME Corporate Loans</SelectItem>
                        <SelectItem value="Consumer Finance">Consumer Finance</SelectItem>
                        <SelectItem value="Commercial real-estate">Commercial real-estate</SelectItem>
                        <SelectItem value="Residential real-estate">Residential real-estate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('structure_sector') === 'Other' && (
                <FormField
                  control={form.control}
                  name="structure_sector_other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Sector</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter sector name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <h3 className="text-lg font-semibold mt-4">Structure Features</h3>
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="structure_synthetic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Synthetic</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="structure_true_sale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">True Sale</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="structure_sts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">STS</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Transaction Key Figures & Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expected_pool_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Asset Pool Size (Millions)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Enter pool size in millions" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weighted_average_life"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weighted Average Life (Years)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Enter weighted average life" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additional_comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any additional comments" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review Your Offer</CardTitle>
              <CardDescription>Summary of your offer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-sm">Offer Name</Label>
                  <p className="text-base font-medium mt-1">
                    {form.watch('offer_name') || '-'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Business Focus</Label>
                  <p className="text-base font-medium mt-1">
                    {form.watch('issuer_business_focus') || '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Transaction Key Figures & Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Overall Asset Pool Size</Label>
                    <p className="text-base font-medium mt-1">
                      {selectedDataset?.total_opening_balance 
                        ? `€${selectedDataset.total_opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-sm">Weighted Average Life</Label>
                    <p className="text-base font-medium mt-1">
                      {selectedStructure?.weighted_avg_cost_bps
                        ? `${(selectedStructure.weighted_avg_cost_bps / 100).toFixed(2)}%`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
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
          </div>
        </form>
      </Form>

      <InvestorSelector
        open={showInvestorSelector}
        onOpenChange={setShowInvestorSelector}
        selectedInvestors={selectedInvestors}
        onInvestorsChange={setSelectedInvestors}
        additionalEmails={additionalEmails}
        onAdditionalEmailsChange={setAdditionalEmails}
      />
    </div>
  );
}
