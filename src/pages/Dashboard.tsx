import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, Users, TrendingUp, BarChart3, Database, DollarSign, FileCheck, Activity, LogOut, FolderOpen, Shield, Settings, FileText, BarChart, Trash2, ChevronDown, Plus, Eye, Globe, UserCog, Handshake } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ExcelUpload from '@/components/ExcelUpload';
import DatasetManager from '@/components/DatasetManager';
import DataExtractor from '@/components/DataExtractor';
import TrancheAnalysisDashboard from '@/components/TrancheAnalysisDashboard';
import RegulatoryReportingUpload from '@/components/RegulatoryReportingUpload';
import InvestorReportingUpload from '@/components/InvestorReportingUpload';
import ExtractionTool from '@/components/ExtractionTool';
import { preloadDatasets } from '@/components/DatasetSelector';
import { preloadTrancheData } from '@/components/TrancheAnalysisDashboard';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useUserType } from '@/hooks/useUserType';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showExistingData, setShowExistingData] = useState(false);
  const [showDatasetManager, setShowDatasetManager] = useState(false);
  const [showDataExtractor, setShowDataExtractor] = useState(false);
  const [showTrancheAnalysis, setShowTrancheAnalysis] = useState(false);
  const [preTradePopoverOpen, setPreTradePopoverOpen] = useState(false);
  const [globalRefreshTrigger, setGlobalRefreshTrigger] = useState(0);
  const [showRegulatoryReporting, setShowRegulatoryReporting] = useState(false);
  const [showInvestorReporting, setShowInvestorReporting] = useState(false);
  const [showExtractionTool, setShowExtractionTool] = useState(false);
  const { isAdmin } = useAdminCheck();

  // Handle navigation from PDAnalysis page
  useEffect(() => {
    if (location.state?.showExtractionTool) {
      setShowExtractionTool(true);
      // Clear the state
      navigate('/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

  // Preload data when user is authenticated for instant loading
  useEffect(() => {
    if (user) {
      console.log('🚀 DASHBOARD - User authenticated, preloading all data');
      preloadDatasets(user);
      preloadTrancheData(user);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  const handleRiskBlocsClick = () => {
    navigate('/apps');
  };

  const handleLogoClick = () => {
    console.log('Logo clicked - navigating to home');
    navigate('/');
  };

  const handlePreTradeAction = (action: string) => {
    // Close the popover immediately when any action is selected
    setPreTradePopoverOpen(false);
    
    if (action === 'Upload Data Tape') {
      setShowExcelUpload(true);
    } else if (action === 'Access Existing Data') {
      setShowExistingData(true);
    } else if (action === 'Manage Datasets') {
      setShowDatasetManager(true);
    } else if (action === 'Extract Data') {
      setShowDataExtractor(true);
    } else if (action === 'Tranche and Analyse Data') {
      setShowTrancheAnalysis(true);
    } else {
      toast({
        title: "Pre-trade Action",
        description: `Selected: ${action}`,
      });
    }
  };

  const handleDatasetUploaded = () => {
    // Trigger refresh across all components that show datasets
    const newTrigger = Date.now();
    setGlobalRefreshTrigger(newTrigger);
    console.log('🔄 DASHBOARD - Global dataset refresh triggered:', newTrigger);
  };

  const handlePostTradeAnalytics = (action: string) => {
    if (action === 'Regulatory Reporting') {
      setShowRegulatoryReporting(true);
    } else if (action === 'Investor Reporting') {
      setShowInvestorReporting(true);
    } else if (action === 'Extraction Tool') {
      setShowExtractionTool(true);
    } else {
      toast({
        title: "Post-trade Analytics",
        description: `Selected: ${action}`,
      });
    }
  };

  const handleMatchedMarket = (action: string) => {
    if (action === 'Create Offer') {
      navigate('/matched-market/issue-offer');
    } else if (action === 'Manage Offer') {
      navigate('/matched-market/manage-offers');
    } else {
      toast({
        title: "Matched Market",
        description: `Selected: ${action}`,
      });
    }
  };

  const handleMarketplace = (action: string) => {
    toast({
      title: "Marketplace",
      description: `Selected: ${action}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogoClick}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900 font-poppins">RiskBlocs</span>
              </button>
              <button 
                onClick={handleRiskBlocsClick}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                View All Apps
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, {user?.email}</span>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin/users')}
                  className="gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SRT Platform Dashboard</h1>
          <p className="text-gray-600">Access and manage your transactions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pre-trade - Only for Issuers */}
          {userType === 'issuer' && (
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Pre-trade</CardTitle>
                    <CardDescription>Upload and access transaction data, manage Silent RiskData vault, transaction preparation and analytics</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">45</div>
                  <div className="text-sm text-blue-700">Data Files</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-green-700">Analytics Ready</div>
                </div>
              </div>
              <div className="pt-2">
                <Popover open={preTradePopoverOpen} onOpenChange={setPreTradePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Access Pre-trade Tools
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="center">
                    <div className="bg-white rounded-lg shadow-lg border">
                      <div className="p-2">
                        <h3 className="font-semibold text-gray-900 px-2 py-1 text-sm">Pre-trade Tools</h3>
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left"
                            onClick={() => handlePreTradeAction('Upload Data Tape')}
                          >
                            <Upload className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm">Upload Data Tape</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left"
                            onClick={() => handlePreTradeAction('Access Existing Data')}
                          >
                            <FolderOpen className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-sm">Access Existing Data</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left"
                            onClick={() => handlePreTradeAction('Extract Data')}
                          >
                            <Database className="h-4 w-4 mr-2 text-cyan-600" />
                            <span className="text-sm">Extract Data</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left"
                            onClick={() => handlePreTradeAction('Tranche and Analyse Data')}
                          >
                            <BarChart className="h-4 w-4 mr-2 text-indigo-600" />
                            <span className="text-sm">Tranche and Analyse Data</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left"
                            onClick={() => handlePreTradeAction('Manage Silent RiskData Vault')}
                          >
                            <Shield className="h-4 w-4 mr-2 text-purple-600" />
                            <span className="text-sm">Manage Silent RiskData Vault</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Matched Market - For both Issuers and Investors */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Matched Market</CardTitle>
                    <CardDescription>Share or access transactions in progress, manage pricing and ready transaction for execution</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Transactions</span>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">8 In Progress</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pricing Updates</span>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-600">3 Pending</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ready for Execution</span>
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600">5 Ready</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Manage Market Transactions
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64">
                    {userType === 'issuer' && (
                      <DropdownMenuItem onClick={() => handleMatchedMarket('Create Offer')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Offer
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleMatchedMarket('Manage Offer')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Offer
                    </DropdownMenuItem>
                    {userType === 'investor' && (
                      <DropdownMenuItem onClick={() => navigate('/matched-market/manage-nda')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Manage NDAs
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleMatchedMarket('Review Completed Transactions')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review Completed Transactions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace - Only for Issuers */}
          {userType === 'issuer' && (
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Marketplace</CardTitle>
                    <CardDescription>Undertake or review transactions and related data</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New transaction review available</p>
                    <p className="text-xs text-gray-500">2 hours ago • Portfolio A</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Transaction completed successfully</p>
                    <p className="text-xs text-gray-500">4 hours ago • Portfolio B</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Data review requested</p>
                    <p className="text-xs text-gray-500">6 hours ago • Portfolio C</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Enter Marketplace
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64">
                    <DropdownMenuItem onClick={() => handleMarketplace('Access Market')}>
                      <Globe className="h-4 w-4 mr-2" />
                      Access Market
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMarketplace('Market Data')}>
                      <Database className="h-4 w-4 mr-2" />
                      Market Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Post-trade - For both Issuers and Investors */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Post-trade</CardTitle>
                    <CardDescription>Replenishments, reporting, pricing and performance analytics</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">23</div>
                  <div className="text-sm text-orange-700">Reports Generated</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-purple-700">Performance Score</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Analytics Run:</span>
                <span className="text-gray-900 font-medium">1 hour ago</span>
              </div>
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      View Post-trade Analytics
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64">
                    <DropdownMenuItem onClick={() => handlePostTradeAnalytics('Regulatory Reporting')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Regulatory Reporting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePostTradeAnalytics('Investor Reporting')}>
                      <Users className="h-4 w-4 mr-2" />
                      Investor Reporting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePostTradeAnalytics('Extraction Tool')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Extraction Tool
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePostTradeAnalytics('Valuation Analyses')}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Valuation Analyses
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload Data</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Access Vault</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Update Pricing</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </div>
        </div>
      </main>

      <ExcelUpload 
        isOpen={showExcelUpload} 
        onClose={() => setShowExcelUpload(false)} 
        onDatasetUploaded={handleDatasetUploaded}
      />
      
      <ExcelUpload 
        isOpen={showExistingData} 
        onClose={() => setShowExistingData(false)} 
        showExistingData={true}
        onDatasetUploaded={handleDatasetUploaded}
      />
      
      <DataExtractor 
        isOpen={showDataExtractor} 
        onClose={() => setShowDataExtractor(false)}
        refreshTrigger={globalRefreshTrigger}
      />
      
      <DatasetManager
        isOpen={showDatasetManager}
        onClose={() => setShowDatasetManager(false)}
      />
      
      <TrancheAnalysisDashboard
        isOpen={showTrancheAnalysis}
        onClose={() => setShowTrancheAnalysis(false)}
      />
      
      <RegulatoryReportingUpload
        isOpen={showRegulatoryReporting}
        onClose={() => setShowRegulatoryReporting(false)}
      />
      
      <InvestorReportingUpload
        isOpen={showInvestorReporting}
        onClose={() => setShowInvestorReporting(false)}
      />
      
      {showExtractionTool && (
        <ExtractionTool onClose={() => setShowExtractionTool(false)} />
      )}
    </div>
  );
};

export default Dashboard;
