
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, BarChart3, TrendingUp, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SrtPlatform = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [creditRating, setCreditRating] = useState('A');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'structure', label: 'Structure Analysis', icon: TrendingUp },
    { id: 'capital', label: 'Capital Analysis', icon: Calculator },
    { id: 'economics', label: 'Economics', icon: FileText },
    { id: 'sensitivity', label: 'Sensitivity', icon: TrendingUp }
  ];

  const scenarios = [
    'Base Case',
    'Stress Scenario',
    'Severe Stress',
    'Recovery Scenario'
  ];

  const calculateMetrics = () => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
    const totalInterest = (monthlyPayment * numPayments) - loanAmount;
    
    return {
      monthlyPayment: monthlyPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalAmount: (loanAmount + totalInterest).toFixed(2)
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">SRT Platform</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Structured Risk Transfer Platform
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Advanced risk analytics and compliance management for modern enterprises. 
            Streamline your risk operations with AI-powered insights.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <BarChart3 className="h-5 w-5" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <TrendingUp className="h-5 w-5" />
              <span>Risk Modeling</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <Calculator className="h-5 w-5" />
              <span>Capital Optimization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Application */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Loan Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Amount
                    </label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Term (years)
                    </label>
                    <input
                      type="number"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Rating
                    </label>
                    <select
                      value={creditRating}
                      onChange={(e) => setCreditRating(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AAA">AAA</option>
                      <option value="AA">AA</option>
                      <option value="A">A</option>
                      <option value="BBB">BBB</option>
                      <option value="BB">BB</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Scenarios</h4>
                    <div className="space-y-2">
                      {scenarios.map((scenario) => (
                        <Button
                          key={scenario}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {scenario}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                {/* Tabs */}
                <div className="border-b">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-600 text-blue-600 bg-blue-50'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <CardContent className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900">Overview Dashboard</h3>
                      
                      {/* Metrics Grid */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm">Monthly Payment</p>
                                <p className="text-2xl font-bold">${Number(metrics.monthlyPayment).toLocaleString()}</p>
                              </div>
                              <Calculator className="h-8 w-8 text-blue-200" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm">Total Interest</p>
                                <p className="text-2xl font-bold text-gray-900">${Number(metrics.totalInterest).toLocaleString()}</p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">${Number(metrics.totalAmount).toLocaleString()}</p>
                              </div>
                              <BarChart3 className="h-8 w-8 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm">Credit Rating</p>
                                <p className="text-2xl font-bold text-gray-900">{creditRating}</p>
                              </div>
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Charts Placeholder */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-gray-50">
                          <CardContent className="p-6">
                            <h4 className="text-center text-lg font-medium text-gray-900 mb-4">
                              Payment Breakdown
                            </h4>
                            <div className="h-64 flex items-center justify-center bg-white rounded-lg border">
                              <p className="text-gray-500">Chart visualization would go here</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50">
                          <CardContent className="p-6">
                            <h4 className="text-center text-lg font-medium text-gray-900 mb-4">
                              Risk Analysis
                            </h4>
                            <div className="h-64 flex items-center justify-center bg-white rounded-lg border">
                              <p className="text-gray-500">Chart visualization would go here</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  
                  {activeTab !== 'overview' && (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {tabs.find(tab => tab.id === activeTab)?.label} Analysis
                      </h3>
                      <p className="text-gray-600">
                        This section would contain detailed {activeTab} analysis and visualizations.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Export Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Export Analysis</h3>
          <p className="text-gray-600 mb-8 text-lg">
            Download your analysis in multiple formats for reporting and compliance.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Export Charts
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SrtPlatform;
