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

const INVESTOR_POOL = [
  "European Investment Banking Group",
  "Atalaya", 
  "Bayview",
  "International Finance Corporation",
  "Luminarx",
  "PGGM",
  "Blackstone",
  "British Business Bank",
  "European Bank for Reconstruction and Development",
  "Veld Capital",
  "Kohlberg Kravis Roberts",
  "AXA",
  "Seer Capital",
  "Cheyne Capital Management",
  "M&G plc",
  "Intermediate Capital Group",
  "Orchard Global",
  "Arini",
  "Man Group",
  "Great Lakes Insurance",
  "Christofferson Robb and Company",
  "Coface",
  "Keva",
  "Chorus Capital",
  "Zurich Insurance",
  "Arch Capital Group",
  "Abrdn plc",
  "Allianz Insurance"
];

const INVESTOR_TRANSACTION_INFO: Record<string, string> = {
  "European Investment Banking Group": "Conducted 9 unfunded bilateral unfunded transactions",
  "Atalaya": "Conducted 1 bilateral transaction",
  "Bayview": "Conducted 2 SVP CLN bilateral transactions",
  "International Finance Corporation": "Conducted 3 bilateral transactions",
  "Luminarx": "Conducted 1 bilateral transaction",
  "PGGM": "Conducted 3 unfunded and 5 Direct CLN bilateral transactions",
  "Blackstone": "Conducted 2 transactions",
  "British Business Bank": "Conducted 1 unfunded bilateral transaction",
  "European Bank for Reconstruction and Development": "Conducted 1 unfunded bilateral transaction",
  "Veld Capital": "Conducted 1 bilateral transaction",
  "Kohlberg Kravis Roberts": "Conducted 1 SVP CLN bilateral transaction",
  "AXA": "Conducted 110 SRT deals since 2000",
  "Seer Capital": "Conducted 71 SRT deals since 2010",
  "Cheyne Capital Management": "Active in the market from 2004-2018, recently re-entered the market in 2024",
  "M&G plc": "Conducted €9.7Bn in SRT transactions since 2008",
  "Intermediate Capital Group": "No previous SRT transactions but conducted $32Bn in Structured Capital AUM (ICG)",
  "Orchard Global": "Planned up to 20 SRT deals with 7 being conducted up to 2024",
  "Arini": "No previous SRT transactions but experienced in the CLO field",
  "Man Group": "Conducts junior tranche SRT transactions",
  "Great Lakes Insurance": "No previous SRT transactions",
  "Christofferson Robb and Company": "Plays a significant institutional role in the space conducting 4 SRT transactions in 2024",
  "Coface": "No previous SRT transactions",
  "Keva": "No previous SRT transactions",
  "Chorus Capital": "Core player in the space (SRT investor of the year 2023, 2024, 2025)",
  "Zurich Insurance": "No previous SRT transactions",
  "Arch Capital Group": "Conducted nearly 30 unfunded SRT transactions since 2018, operating in 13 countries with a portfolio size of around $6Bn",
  "Abrdn plc": "No previous SRT transactions",
  "Allianz Insurance": "No previous SRT transactions but involved within the ART space"
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StructureModificationComponent } from './StructureModificationComponent';
import { InvestorSelector } from './InvestorSelector';

const offerSchema = z.object({
  offer_name: z.string().min(1, 'Offer name is required'),
  structure_id: z.string().min(1, 'Please select a structure'),
  shared_with_emails: z.array(z.string().email('Invalid email format')).min(0),
  target_investors: z.array(z.string()).min(0),
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
      structure_type: '',
      structure_figures: '',
      structure_synthetic: false,
      structure_true_sale: false,
      structure_sts: false,
      structure_consumer_finance: false,
      additional_comments: '',
    },
  });

  // Load draft data when modal opens
  useEffect(() => {
    if (open && user) {
      fetchStructures();
      loadDraftData();
    }
  }, [open, user]);

  // Save draft data to localStorage
  const saveDraftData = () => {
    if (!user) return;
    
    const draftData = {
      formData: form.getValues(),
      emailList,
      selectedInvestors,
      additionalEmails,
      selectedStructureId: selectedStructure?.id || null,
    };
    
    localStorage.setItem(`offer_draft_${user.id}`, JSON.stringify(draftData));
  };

  // Load draft data from localStorage
  const loadDraftData = () => {
    if (!user) return;
    
    const savedDraft = localStorage.getItem(`offer_draft_${user.id}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        
        // Restore form data
        form.reset(draftData.formData);
        
        // Restore other state
        setEmailList(draftData.emailList || []);
        setSelectedInvestors(draftData.selectedInvestors || []);
        setAdditionalEmails(draftData.additionalEmails || []);
        
        // Restore selected structure after structures are loaded
        if (draftData.selectedStructureId) {
          setTimeout(() => {
            handleStructureSelect(draftData.selectedStructureId);
          }, 100);
        }
      } catch (error) {
        console.error('Error loading draft data:', error);
      }
    }
  };

  // Clear draft data
  const clearDraftData = () => {
    if (!user) return;
    localStorage.removeItem(`offer_draft_${user.id}`);
  };

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
      const { data, error } = await supabase.rpc('get_dataset_summaries_optimized');
      
      if (error) throw error;
      
      const dataset = data?.find((d: any) => d.dataset_name === datasetName);
      setSelectedDataset(dataset);
    } catch (error) {
      console.error('Error fetching dataset summary:', error);
    }
  };

  const handleStructureSelect = async (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    setSelectedStructure(structure || null);
    
    // Immediately fetch dataset summary when structure is selected
    if (structure) {
      try {
        // Fast direct query for specific dataset instead of slow RPC
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
        } else {
          setSelectedDataset({
            dataset_name: structure.dataset_name,
            loan_count: 0,
            total_loan_amount: 0,
            total_opening_balance: 0
          });
        }
      } catch (error) {
        console.error('Error fetching dataset summary:', error);
        setSelectedDataset(null);
      }
    } else {
      setSelectedDataset(null);
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
          shared_with_emails: [...emailList, ...additionalEmails],
          target_investors: selectedInvestors,
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

      // Clear draft and reset form after successful submission
      clearDraftData();
      form.reset();
      setEmailList([]);
      setEmailInput('');
      setSelectedInvestors([]);
      setAdditionalEmails([]);
      setSelectedStructure(null);
      setSelectedDataset(null);
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
          <DialogTitle>Create New Issue</DialogTitle>
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

            {/* Structure Summary - appears immediately after selection */}
            {selectedStructure && (
              <div className="mt-4">
                {selectedDataset ? (
                  <StructureSummary 
                    structure={selectedStructure} 
                    dataset={selectedDataset}
                  />
                ) : (
                  <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading structure summary...</span>
                  </div>
                )}
              </div>
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

            {/* Target Investor Pool Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Investor Pool</h3>
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
              
              {/* Display selected investors */}
              {selectedInvestors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Investors:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvestors.map((investor) => (
                      <div
                        key={investor}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                      >
                        {investor}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display additional emails */}
              {additionalEmails.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Investor Emails:</Label>
                  <div className="flex flex-wrap gap-2">
                    {additionalEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                        <FormLabel>Nationality/Region</FormLabel>
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
                            placeholder="Brief description of the issuer"
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
                  <CardTitle className="text-base">General Structure Characterization</CardTitle>
                  <CardDescription>Define the core characteristics and components of your securitization structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Structure Features */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Structure Features</Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="structure_synthetic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">Synthetic</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="structure_true_sale"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">True Sale</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="structure_sts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">STS Compliant</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="w-1/3">
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select defaultValue="EUR">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="CHF">CHF</SelectItem>
                              <SelectItem value="JPY">JPY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                   {/* Transaction Key Figures */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Transaction Key Figures & Metrics</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Expected Pool Size (Millions)</Label>
                        <Input placeholder="e.g., 500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Weighted Avg Life (years)</Label>
                        <Input placeholder="e.g., 3.5 years" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Expected Rating</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aaa">AAA</SelectItem>
                            <SelectItem value="aa">AA</SelectItem>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="bbb">BBB</SelectItem>
                            <SelectItem value="bb">BB</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="structure_figures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Comments, Key Figures & Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Include any additional key metrics, performance triggers, payment mechanics, or structural features"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
            </div>

            {/* Review Section */}
            <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Review Your Offer
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Basic Offer Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-muted-foreground">Offer Name:</span>
                    <p className="mt-1">{form.watch('offer_name') || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Selected Structure:</span>
                    <p className="mt-1">{selectedStructure?.structure_name || 'Not selected'}</p>
                  </div>
                </div>

                {/* Target Investors */}
                <div>
                  <span className="font-medium text-muted-foreground">Target Investors:</span>
                  <div className="mt-1">
                    {selectedInvestors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedInvestors.map((investor) => (
                          <span key={investor} className="px-2 py-1 bg-secondary rounded text-xs">
                            {investor}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No investors selected</p>
                    )}
                  </div>
                </div>

                {/* Email Addresses */}
                <div>
                  <span className="font-medium text-muted-foreground">Email Addresses:</span>
                  <div className="mt-1">
                    {(emailList.length > 0 || additionalEmails.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {[...emailList, ...additionalEmails].map((email) => (
                          <span key={email} className="px-2 py-1 bg-secondary rounded text-xs">
                            {email}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No email addresses added</p>
                    )}
                  </div>
                </div>

                {/* Issuer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-muted-foreground">Issuer Nationality:</span>
                    <p className="mt-1">{form.watch('issuer_nationality') || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Focus:</span>
                    <p className="mt-1">{form.watch('issuer_business_focus') || 'Not specified'}</p>
                  </div>
                </div>

                {/* Structure Type */}
                <div>
                  <span className="font-medium text-muted-foreground">Structure Type:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {form.watch('structure_synthetic') && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Synthetic</span>
                    )}
                    {form.watch('structure_true_sale') && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">True Sale</span>
                    )}
                    {form.watch('structure_sts') && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">STS</span>
                    )}
                    {form.watch('structure_consumer_finance') && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Consumer Finance</span>
                    )}
                    {!form.watch('structure_synthetic') && !form.watch('structure_true_sale') && 
                     !form.watch('structure_sts') && !form.watch('structure_consumer_finance') && (
                      <span className="text-muted-foreground">No structure types selected</span>
                    )}
                  </div>
                </div>

                {/* Transaction Key Figures & Metrics */}
                {selectedStructure && selectedDataset && (
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg border">
                    <h4 className="font-semibold text-primary flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Transaction Key Figures & Metrics
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <span className="text-xs font-medium text-muted-foreground block mb-1">Expected Pool Size</span>
                        <p className="text-lg font-bold text-primary">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(selectedDataset.total_opening_balance || selectedDataset.total_value || 0)}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-xs font-medium text-muted-foreground block mb-1">Weighted Avg Life</span>
                        <p className="text-lg font-bold text-primary">
                          2.8 years
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-xs font-medium text-muted-foreground block mb-1">Expected Rating</span>
                        <p className="text-lg font-bold text-primary">
                          A-
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {(form.watch('comments') || form.watch('additional_comments')) && (
                  <div>
                    <span className="font-medium text-muted-foreground">Comments:</span>
                    <div className="mt-1 space-y-2">
                      {form.watch('comments') && (
                        <p className="bg-secondary p-2 rounded text-xs">{form.watch('comments')}</p>
                      )}
                      {form.watch('additional_comments') && (
                        <p className="bg-secondary p-2 rounded text-xs">{form.watch('additional_comments')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Review Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    saveDraftData();
                    toast({
                      title: 'Draft Saved',
                      description: 'Your offer has been saved and will be retained until confirmed and sent',
                    });
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Confirm & Send'
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      <InvestorSelector
        open={showInvestorSelector}
        onOpenChange={setShowInvestorSelector}
        selectedInvestors={selectedInvestors}
        onInvestorsChange={setSelectedInvestors}
        additionalEmails={additionalEmails}
        onAdditionalEmailsChange={setAdditionalEmails}
      />
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