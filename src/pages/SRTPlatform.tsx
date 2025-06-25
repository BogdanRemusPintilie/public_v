
import { useEffect } from 'react';
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

    // Load Google Fonts - Adding Poppins
    const googleFonts = document.createElement('link');
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap';
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

      {/* Component placeholders */}
      <div id="header-placeholder"></div>
      <div id="hero-placeholder"></div>
      <div id="platform-overview-placeholder"></div>
      <div id="market-context-placeholder"></div>
      <div id="capabilities-placeholder"></div>
      <div id="why-choose-placeholder"></div>
      <div id="cta-placeholder"></div>
      <div id="footer-placeholder"></div>
    </div>
  );
};

export default SRTPlatform;
