
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900 font-poppins">RiskBlocs</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, Admin</span>
              <Button variant="outline" size="sm">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Management Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your organization's risk profile</p>
        </div>

        {/* Dashboard Panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Analytics Panel */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Risk Analytics</CardTitle>
                    <CardDescription>Real-time risk assessment overview</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">12</div>
                  <div className="text-sm text-red-700">High Risk</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">28</div>
                  <div className="text-sm text-yellow-700">Medium Risk</div>
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  View Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Monitoring Panel */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Compliance Status</CardTitle>
                    <CardDescription>Regulatory compliance overview</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ISO 27001</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Compliant</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SOC 2 Type II</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Compliant</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GDPR</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Review Due</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Manage Compliance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Activity Panel */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Team Activity</CardTitle>
                    <CardDescription>Recent team actions and updates</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Risk assessment completed for IT Infrastructure</p>
                    <p className="text-xs text-gray-500">2 hours ago • Sarah Johnson</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Compliance report submitted</p>
                    <p className="text-xs text-gray-500">4 hours ago • Mike Chen</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New risk identified in vendor management</p>
                    <p className="text-xs text-gray-500">6 hours ago • Alex Rivera</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports & Insights Panel */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Reports & Insights</CardTitle>
                    <CardDescription>Generated reports and analytics</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-blue-700">Monthly Reports</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-green-700">Insights Generated</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Report Generated:</span>
                <span className="text-gray-900 font-medium">2 days ago</span>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Generate New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Report New Risk</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>View Trends</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Manage Team</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Export Data</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
