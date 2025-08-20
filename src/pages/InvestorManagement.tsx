import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Upload } from 'lucide-react';
import { InvestorUpload } from '@/components/InvestorUpload';
import { getInvestors, InvestorRecord } from '@/utils/investorUtils';
import { useToast } from '@/hooks/use-toast';

export const InvestorManagement = () => {
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<InvestorRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadInvestors = async () => {
    try {
      setIsLoading(true);
      const data = await getInvestors();
      setInvestors(data);
      setFilteredInvestors(data);
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

  useEffect(() => {
    loadInvestors();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredInvestors(investors);
    } else {
      const filtered = investors.filter(investor =>
        investor.investor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.overview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvestors(filtered);
    }
  }, [searchTerm, investors]);

  const handleUploadComplete = () => {
    loadInvestors();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investor Management</h1>
        <p className="text-muted-foreground">
          Manage your SRT market investor database
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">
            <Users className="h-4 w-4 mr-2" />
            Browse Investors
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Investor Database</span>
                <Badge variant="secondary">{filteredInvestors.length} investors</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search investors, overview, contact details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading investors...</div>
              ) : filteredInvestors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {investors.length === 0 ? 'No investors found. Upload data to get started.' : 'No investors match your search.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvestors.map((investor) => (
                    <Card key={investor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{investor.investor}</h3>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                              {investor.overview || 'No overview available'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {investor.contact_name || 'No contact name'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {investor.contact_email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <InvestorUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};