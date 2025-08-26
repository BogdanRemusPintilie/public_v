
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelUpload from '@/components/ExcelUpload';
import DataExtractor from '@/components/DataExtractor';
import TrancheAnalysisDashboard from '@/components/TrancheAnalysisDashboard';
import { InvestorUpload } from '@/components/InvestorUpload';
import { Upload, Database, TrendingUp, Users, FileSpreadsheet, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { preloadDatasets } from '@/components/DatasetSelector';

const Dashboard = () => {
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showExcelView, setShowExcelView] = useState(false);
  const [showDataExtractor, setShowDataExtractor] = useState(false);
  const [showTrancheAnalysis, setShowTrancheAnalysis] = useState(false);
  const [showInvestorUpload, setShowInvestorUpload] = useState(false);
  const [datasetRefreshKey, setDatasetRefreshKey] = useState(0);
  const { user, isLoading } = useAuth();

  // Preload datasets when user is available
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🚀 DASHBOARD: Preloading datasets for user');
      preloadDatasets(user);
    }
  }, [user, isLoading]);

  // Handle dataset uploads/changes
  const handleDatasetUploaded = () => {
    console.log('📢 DASHBOARD: Dataset uploaded/changed, triggering refresh');
    setDatasetRefreshKey(prev => prev + 1);
    
    // Preload datasets again to refresh cache
    if (user) {
      setTimeout(() => {
        preloadDatasets(user);
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SRT Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your securitization data and analysis tools</p>
        </div>

        <Tabs defaultValue="data-management" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data-management" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="investors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Investors
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data-management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowExcelUpload(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Upload New Data
                  </CardTitle>
                  <CardDescription>
                    Upload Excel files containing loan portfolio data for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Upload Excel File
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowExcelView(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Access Existing Data
                  </CardTitle>
                  <CardDescription>
                    View, filter, and manage your uploaded datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Datasets
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowDataExtractor(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                    Extract Data
                  </CardTitle>
                  <CardDescription>
                    Extract and export specific data subsets from your portfolios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Extract Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowTrancheAnalysis(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Tranche Analysis
                  </CardTitle>
                  <CardDescription>
                    Analyze portfolio data and create tranche structures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Analyze Tranches
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Risk Analytics
                  </CardTitle>
                  <CardDescription>
                    Advanced risk modeling and stress testing tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowInvestorUpload(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    Manage Investors
                  </CardTitle>
                  <CardDescription>
                    Upload and manage investor information and contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Manage Investors
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-pink-600" />
                    Investor Reports
                  </CardTitle>
                  <CardDescription>
                    Generate and distribute investor reporting packages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and data settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals with dataset refresh handling */}
      <ExcelUpload 
        isOpen={showExcelUpload} 
        onClose={() => setShowExcelUpload(false)}
        onDatasetUploaded={handleDatasetUploaded}
      />
      
      <ExcelUpload 
        isOpen={showExcelView} 
        onClose={() => setShowExcelView(false)} 
        showExistingData={true}
        onDatasetUploaded={handleDatasetUploaded}
      />
      
      <DataExtractor 
        isOpen={showDataExtractor} 
        onClose={() => setShowDataExtractor(false)}
        key={datasetRefreshKey} // Force re-render when datasets change
      />
      
      <TrancheAnalysisDashboard 
        isOpen={showTrancheAnalysis} 
        onClose={() => setShowTrancheAnalysis(false)}
        key={datasetRefreshKey} // Force re-render when datasets change
      />

      {showInvestorUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Investor Management</h3>
              <Button variant="ghost" onClick={() => setShowInvestorUpload(false)}>
                ×
              </Button>
            </div>
            <InvestorUpload onUploadComplete={() => setShowInvestorUpload(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
