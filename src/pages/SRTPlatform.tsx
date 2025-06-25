import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkedExample from '../components/WorkedExample';

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

    // Load Google Fonts - Adding Poppins
    const googleFonts = document.createElement('link');
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap';
    googleFonts.rel = 'stylesheet';
    document.head.appendChild(googleFonts);

    // Load main script
    const mainScript = document.createElement('script');
    mainScript.src = '/srt-platform/js/main.js';
    document.body.appendChild(mainScript);

    return () => {
      // Cleanup on unmount
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(fontAwesome)) document.head.removeChild(fontAwesome);
      if (document.head.contains(googleFonts)) document.head.removeChild(googleFonts);
      if (document.body.contains(mainScript)) document.body.removeChild(mainScript);
    };
  }, []);

  const handleAccessApps = () => {
    navigate('/apps');
  };

  const handleRiskBlocsClick = () => {
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
            <img 
              src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" 
              alt="RiskBlocs Logo" 
              className="nav-logo-img"
              style={{ height: '1.5rem', width: '1.5rem' }}
            />
            <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>RiskBlocs</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#home" className="nav-link active">Home</a></li>
            <li><a href="/srt-platform/demo" className="nav-link">Demo</a></li>
            <li><a href="/srt-platform/example" className="nav-link">Worked Example</a></li>
            <li>
              <button 
                onClick={handleRiskBlocsClick} 
                className="nav-link" 
                style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit'}}
              >
                RiskBlocs
              </button>
            </li>
          </ul>
          <div className="nav-access-apps">
            <button 
              onClick={handleAccessApps} 
              className="nav-access-apps-text"
            >
              Access Apps
            </button>
          </div>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Transform Risk into <span className="gradient-text">Opportunity</span></h1>
              <p className="hero-subtitle">The comprehensive platform for Significant Risk Transfer transactions. Optimize capital efficiency, manage credit risk, and unlock growth potential with cutting-edge analytics and regulatory-compliant solutions.</p>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">€200B+</span>
                  <span className="stat-label">Transactions Facilitated</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Capital Efficiency</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Global Institutions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Compliance Rate</span>
                </div>
              </div>

              <div className="hero-actions">
                <a href="/srt-platform/demo" className="btn btn-primary">
                  <i className="fas fa-play"></i>
                  Explore Demo
                </a>
                <a href="/srt-platform/example" className="btn btn-secondary">
                  <i className="fas fa-chart-bar"></i>
                  View Example
                </a>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="dashboard-preview">
                <div className="dashboard-header">
                  <div className="dashboard-title">SRT Analytics Dashboard</div>
                  <div className="dashboard-status">
                    <span className="status-indicator active"></span>
                    Live Data
                  </div>
                </div>
                <div className="dashboard-content">
                  <div className="metric-card">
                    <div className="metric-label">Portfolio Value</div>
                    <div className="metric-value">€2.4B</div>
                    <div className="metric-change positive">+12.3%</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Risk-Weighted Assets</div>
                    <div className="metric-value">€480M</div>
                    <div className="metric-change negative">-23.1%</div>
                  </div>
                  <div className="chart-container">
                    <canvas id="heroChart" width="300" height="150"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="platform-overview">
        <div className="container">
          <div className="section-header">
            <h2>Advanced SRT Solutions for Modern Banking</h2>
            <p>Our platform revolutionizes how financial institutions approach credit risk transfer through sophisticated analytics and regulatory expertise.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-pie"></i>
              </div>
              <h3>Capital Optimization</h3>
              <p>Reduce Risk-Weighted Assets by up to 80% through sophisticated SRT structuring. Maximize capital relief while maintaining regulatory compliance.</p>
              <div className="feature-metric">
                <span className="metric-number">80%</span>
                <span className="metric-text">RWA Reduction</span>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Risk Management</h3>
              <p>Advanced modeling capabilities provide deep insights into portfolio risk characteristics with comprehensive stress testing and scenario analysis.</p>
              <div className="feature-metric">
                <span className="metric-number">1000+</span>
                <span className="metric-text">Risk Scenarios</span>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <h3>Regulatory Compliance</h3>
              <p>Built-in compliance frameworks ensure adherence to Basel III, IFRS 9, and regional regulatory requirements with automated reporting.</p>
              <div className="feature-metric">
                <span className="metric-number">100%</span>
                <span className="metric-text">Compliance</span>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-brain"></i>
              </div>
              <h3>Market Intelligence</h3>
              <p>Access real-time market data, pricing benchmarks, and transaction comparables for optimal SRT transaction structuring.</p>
              <div className="feature-metric">
                <span className="metric-number">24/7</span>
                <span className="metric-text">Market Data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Context */}
      <section className="market-context">
        <div className="container">
          <div className="market-content">
            <div className="market-text">
              <h2>The Growing SRT Market</h2>
              <p>The global Significant Risk Transfer market has experienced unprecedented growth, driven by increasing regulatory capital requirements and the need for balance sheet optimization.</p>
              
              <div className="market-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <i className="fas fa-trending-up"></i>
                  </div>
                  <div className="highlight-content">
                    <h4>Market Growth</h4>
                    <p>Transaction volumes increased from €3.7B in 2016 to over €20B in 2022, representing 440% growth.</p>
                  </div>
                </div>
                
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <i className="fas fa-globe-europe"></i>
                  </div>
                  <div className="highlight-content">
                    <h4>Global Adoption</h4>
                    <p>European banks lead adoption with strategic capital optimization, while U.S. banks rapidly expand usage.</p>
                  </div>
                </div>
                
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <i className="fas fa-university"></i>
                  </div>
                  <div className="highlight-content">
                    <h4>Regulatory Support</h4>
                    <p>Clear regulatory frameworks from Fed, ECB, and other authorities support continued market growth.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="market-chart">
              <div className="chart-header">
                <h3>SRT Market Growth</h3>
                <p>Global transaction volumes (€ billions)</p>
              </div>
              <canvas id="marketChart" width="400" height="300"></canvas>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="capabilities">
        <div className="container">
          <div className="section-header">
            <h2>Comprehensive Platform Capabilities</h2>
            <p>Everything you need to structure, execute, and manage SRT transactions</p>
          </div>
          
          <div className="capabilities-grid">
            <div className="capability-item">
              <div className="capability-header">
                <i className="fas fa-analytics"></i>
                <h3>Portfolio Analysis Engine</h3>
              </div>
              <ul className="capability-features">
                <li>Comprehensive credit risk assessment</li>
                <li>Granular exposure analysis by sector and geography</li>
                <li>Historical performance analytics</li>
                <li>Stress testing and scenario modeling</li>
              </ul>
            </div>
            
            <div className="capability-item">
              <div className="capability-header">
                <i className="fas fa-cogs"></i>
                <h3>SRT Structure Optimizer</h3>
              </div>
              <ul className="capability-features">
                <li>Automated structure recommendations</li>
                <li>Tranche sizing and pricing optimization</li>
                <li>Capital relief calculations</li>
                <li>Regulatory capital impact analysis</li>
              </ul>
            </div>
            
            <div className="capability-item">
              <div className="capability-header">
                <i className="fas fa-clipboard-check"></i>
                <h3>Compliance Management</h3>
              </div>
              <ul className="capability-features">
                <li>Regulatory framework mapping</li>
                <li>Automated documentation generation</li>
                <li>Ongoing compliance monitoring</li>
                <li>Audit trail and reporting capabilities</li>
              </ul>
            </div>
            
            <div className="capability-item">
              <div className="capability-header">
                <i className="fas fa-database"></i>
                <h3>Market Data Integration</h3>
              </div>
              <ul className="capability-features">
                <li>Real-time pricing feeds</li>
                <li>Transaction comparables database</li>
                <li>Market trend analysis</li>
                <li>Investor sentiment tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose">
        <div className="container">
          <div className="why-content">
            <div className="why-text">
              <h2>Why Choose Our Platform</h2>
              <p>Our clients consistently achieve superior outcomes with industry-leading expertise and technology.</p>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-medal"></i>
                  </div>
                  <div className="benefit-content">
                    <h4>Proven Expertise</h4>
                    <p>Decades of experience in structured finance, risk management, and regulatory compliance.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-rocket"></i>
                  </div>
                  <div className="benefit-content">
                    <h4>Technology Leadership</h4>
                    <p>Proprietary analytics engine leveraging machine learning and advanced statistical models.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-award"></i>
                  </div>
                  <div className="benefit-content">
                    <h4>Client Success</h4>
                    <p>Average capital relief of 75% with transaction execution times reduced by 60%.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="success-metrics">
              <div className="metrics-header">
                <h3>Client Success Metrics</h3>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <div className="metric-value">75%</div>
                  <div className="metric-label">Average Capital Relief</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">60%</div>
                  <div className="metric-label">Faster Execution</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">100%</div>
                  <div className="metric-label">Regulatory Approval</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">24/7</div>
                  <div className="metric-label">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Risk Management?</h2>
            <p>Discover how our SRT platform can optimize your capital efficiency and enhance your risk management capabilities.</p>
            
            <div className="cta-actions">
              <a href="/srt-platform/demo" className="btn btn-primary btn-large">
                <i className="fas fa-play"></i>
                Try Interactive Demo
              </a>
              <a href="/srt-platform/example" className="btn btn-secondary btn-large">
                <i className="fas fa-chart-line"></i>
                View Worked Example
              </a>
            </div>
            
            <div className="contact-info">
              <p>Or contact our experts directly:</p>
              <div className="contact-methods">
                <a href="mailto:info@srtplatform.com" className="contact-method">
                  <i className="fas fa-envelope"></i>
                  info@srtplatform.com
                </a>
                <a href="tel:+1-555-0123" className="contact-method">
                  <i className="fas fa-phone"></i>
                  +1 (555) 012-3456
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Worked Example Section */}
      <section className="worked-example-section" id="worked-example">
        <div className="container">
          <div className="section-header text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Worked Example</h2>
            <p className="text-xl text-gray-600">Deep dive into a real-world SRT transaction from start to finish</p>
          </div>
          <WorkedExample />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <i className="fas fa-chart-line"></i>
                <span>BlocsTransfer</span>
              </div>
              <p>Advanced Significant Risk Transfer solutions for modern banking.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-linkedin"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-github"></i></a>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>Platform</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="/srt-platform/demo">Demo</a></li>
                <li><a href="/srt-platform/example">Examples</a></li>
                <li><a href="#">API Documentation</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">White Papers</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Regulatory Updates</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 BlocsTransfer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SRTPlatform;
