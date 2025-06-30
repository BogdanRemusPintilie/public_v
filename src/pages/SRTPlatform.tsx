
import React, { useState, useEffect } from 'react';
import LoginPopup from '@/components/LoginPopup';

const SRTPlatform = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('homepageAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
    setShowLoginPopup(!authenticated);
    setIsLoading(false);
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      setShowLoginPopup(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('homepageAuthenticated');
    setIsAuthenticated(false);
    setShowLoginPopup(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <LoginPopup isOpen={showLoginPopup} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Logout button in top right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-md transition-all duration-200"
        >
          Sign Out
        </button>
      </div>

      {/* Load the original SRT Platform content */}
      <div id="header-placeholder"></div>
      <div id="hero-placeholder"></div>
      <div id="platform-overview-placeholder"></div>
      <div id="market-context-placeholder"></div>
      <div id="capabilities-placeholder"></div>
      <div id="why-choose-placeholder"></div>
      <div id="cta-placeholder"></div>
      <div id="footer-placeholder"></div>

      {/* Load the original scripts */}
      <script src="/srt-platform/js/component-loader.js"></script>
      <script src="/srt-platform/js/main.js"></script>
    </div>
  );
};

export default SRTPlatform;
