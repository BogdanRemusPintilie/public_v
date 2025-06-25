
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SRTPlatform = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load external CSS for the SRT platform
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/srt-platform/css/styles.css';
    document.head.appendChild(link);

    // Load Font Awesome
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);

    // Load Google Fonts
    const googleFonts = document.createElement('link');
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    googleFonts.rel = 'stylesheet';
    document.head.appendChild(googleFonts);

    // Load component loader script
    const script = document.createElement('script');
    script.src = '/srt-platform/js/component-loader.js';
    document.body.appendChild(script);

    // Load main script
    const mainScript = document.createElement('script');
    mainScript.src = '/srt-platform/js/main.js';
    document.body.appendChild(mainScript);

    return () => {
      // Cleanup on unmount
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(fontAwesome)) document.head.removeChild(fontAwesome);
      if (document.head.contains(googleFonts)) document.head.removeChild(googleFonts);
      if (document.body.contains(script)) document.body.removeChild(script);
      if (document.body.contains(mainScript)) document.body.removeChild(mainScript);
    };
  }, []);

  const handleAccessApps = () => {
    navigate('/dashboard');
  };

  return (
    <div className="srt-platform-container">
      {/* Header Banner */}
      <div className="header-banner">
        <div className="container">
          <span className="header-banner-text">Complete SRT Platform Suite</span>
          <button onClick={handleAccessApps} className="access-apps-btn">
            <i className="fas fa-external-link-alt"></i>
            Access Apps
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <i className="fas fa-chart-line"></i>
            <span>BlocsTransfer</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#home" className="nav-link active">Home</a></li>
            <li><a href="/srt-platform/demo" className="nav-link">Demo</a></li>
            <li><a href="/srt-platform/example" className="nav-link">Worked Example</a></li>
          </ul>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Component placeholders */}
      <div id="header-placeholder"></div>
      <div id="hero-placeholder"></div>
      <div id="platform-overview-placeholder"></div>
      <div id="market-context-placeholder"></div>
      <div id="capabilities-placeholder"></div>
      <div id="why-choose-placeholder"></div>

      {/* Access Apps Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Access Apps
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Ready to implement SRT solutions? Access our comprehensive platform suite and start managing your risk transfer strategies with advanced analytics and enterprise-grade tools.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-line text-2xl"></i>
                  </div>
                  <CardTitle className="text-xl text-white">Risk Dashboard</CardTitle>
                  <CardDescription className="text-blue-100">
                    Real-time analytics and monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={handleAccessApps}
                    variant="outline" 
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                  >
                    Access Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-cogs text-2xl"></i>
                  </div>
                  <CardTitle className="text-xl text-white">Management Tools</CardTitle>
                  <CardDescription className="text-blue-100">
                    Configure and manage SRT strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={handleAccessApps}
                    variant="outline" 
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                  >
                    Access Tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-2xl"></i>
                  </div>
                  <CardTitle className="text-xl text-white">Admin Portal</CardTitle>
                  <CardDescription className="text-blue-100">
                    Enterprise administration and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={handleAccessApps}
                    variant="outline" 
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                  >
                    Access Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12">
              <Button 
                onClick={handleAccessApps}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-4 text-lg font-semibold"
              >
                Get Started Now
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div id="cta-placeholder"></div>
      <div id="footer-placeholder"></div>
    </div>
  );
};

export default SRTPlatform;
