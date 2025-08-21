import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getInvestors, InvestorRecord, insertInvestors } from '@/utils/investorUtils';
import { useToast } from '@/hooks/use-toast';


interface InvestorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestors: string[];
  onInvestorsChange: (investors: string[]) => void;
  additionalEmails: string[];
  onAdditionalEmailsChange: (emails: string[]) => void;
}

export function InvestorSelector({ 
  open, 
  onOpenChange, 
  selectedInvestors, 
  onInvestorsChange,
  additionalEmails,
  onAdditionalEmailsChange
}: InvestorSelectorProps) {
  const [newInvestor, setNewInvestor] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadInvestors();
    }
  }, [open]);

  const loadInvestors = async () => {
    try {
      setIsLoading(true);
      const data = await getInvestors();
      setInvestors(data);
    } catch (error) {
      toast({
        title: "Error loading investors",
        description: error instanceof Error ? error.message : "Failed to load investors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestorToggle = (investor: string) => {
    const isSelected = selectedInvestors.includes(investor);
    if (isSelected) {
      onInvestorsChange(selectedInvestors.filter(inv => inv !== investor));
    } else {
      onInvestorsChange([...selectedInvestors, investor]);
    }
  };

  const addNewContact = async () => {
    const investor = newInvestor.trim();
    const contactName = newContactName.trim();
    const contactEmail = newContactEmail.trim();

    if (!investor) {
      toast({
        title: "Investor required",
        description: "Please enter an investor/company name",
        variant: "destructive",
      });
      return;
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const newInvestorRecord: InvestorRecord = {
        investor,
        overview: '',
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined
      };

      await insertInvestors([newInvestorRecord]);
      
      toast({
        title: "Contact added",
        description: "New contact has been added to the investor pool",
      });

      // Clear form
      setNewInvestor('');
      setNewContactName('');
      setNewContactEmail('');
      
      // Reload investors
      await loadInvestors();
    } catch (error) {
      toast({
        title: "Error adding contact",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onAdditionalEmailsChange(additionalEmails.filter(email => email !== emailToRemove));
  };

  const handleConfirm = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Investors</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Investor Pool Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Investor Pool</h3>
              <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {selectedInvestors.length} selected
              </div>
            </div>
            
            <ScrollArea className="h-[280px] border rounded-lg bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading investors...</p>
                  </div>
                </div>
              ) : investors.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2 p-6">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No investors found</p>
                    <p className="text-xs text-muted-foreground">Upload data first or add new contacts below</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr className="border-b">
                        <th className="w-12 p-3 text-left">
                          <div className="w-4 h-4"></div>
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-muted-foreground">Investor</th>
                        <th className="p-3 text-left text-sm font-medium text-muted-foreground">Overview</th>
                        <th className="p-3 text-left text-sm font-medium text-muted-foreground">Contact Name</th>
                        <th className="p-3 text-left text-sm font-medium text-muted-foreground">Contact Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investors.map((investor) => (
                        <tr 
                          key={investor.id}
                          className={`border-b transition-colors cursor-pointer hover:bg-muted/30 ${
                            selectedInvestors.includes(investor.investor) 
                              ? 'bg-primary/5 border-primary/20' 
                              : ''
                          }`}
                          onClick={() => handleInvestorToggle(investor.investor)}
                        >
                          <td className="p-3">
                            <Checkbox
                              id={investor.id}
                              checked={selectedInvestors.includes(investor.investor)}
                              onCheckedChange={() => handleInvestorToggle(investor.investor)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">
                              {investor.investor}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {investor.overview || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-foreground">
                              {investor.contact_name || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-foreground font-mono">
                              {investor.contact_email || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* New Contacts and Selection Summary */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* New Contacts Form */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Add New Contact</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Investor (Company) *</Label>
                      <Input
                        placeholder="Enter company/investor name"
                        value={newInvestor}
                        onChange={(e) => setNewInvestor(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Contact Name</Label>
                      <Input
                        placeholder="Enter contact name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Contact Email</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter contact email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          className="bg-background flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={addNewContact} 
                          disabled={!newInvestor.trim() || isSaving}
                          className="shrink-0"
                        >
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be added to your investor pool
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection Summary */}
            <Card className="bg-muted/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Selection Summary</h3>
                  </div>
                  
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4 pr-4">
                      {selectedInvestors.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Selected Investors ({selectedInvestors.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedInvestors.map((investor) => (
                              <div 
                                key={investor} 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm font-medium truncate pr-2">{investor}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInvestorToggle(investor)}
                                  className="shrink-0 h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {additionalEmails.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Additional Emails ({additionalEmails.length})
                          </h4>
                          <div className="space-y-2">
                            {additionalEmails.map((email, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm font-mono truncate pr-2">{email}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmail(email)}
                                  className="shrink-0 h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedInvestors.length === 0 && additionalEmails.length === 0 && (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                            <div className="w-6 h-6 border-2 border-muted-foreground/30 border-dashed rounded-full" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No investors selected yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select investors from the pool above
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}