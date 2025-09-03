import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('shopstation-cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const handleAcceptAll = async () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    
    // Save to backend
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://grocery-backend-production-5c7e.up.railway.app';
      await fetch(`${API_URL}/api/gdpr/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: allAccepted,
          timestamp: allAccepted.timestamp
        }),
      });
    } catch (error) {
      console.log('Could not save consent to backend:', error);
    }
    
    localStorage.setItem('shopstation-cookie-consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectAll = async () => {
    const rejected = {
      necessary: true, // Can't reject necessary cookies
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    
    // Save to backend
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://grocery-backend-production-5c7e.up.railway.app';
      await fetch(`${API_URL}/api/gdpr/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: rejected,
          timestamp: rejected.timestamp
        }),
      });
    } catch (error) {
      console.log('Could not save consent to backend:', error);
    }
    
    localStorage.setItem('shopstation-cookie-consent', JSON.stringify(rejected));
    setPreferences(rejected);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = async () => {
    const savedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    // Save to backend
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://grocery-backend-production-5c7e.up.railway.app';
      await fetch(`${API_URL}/api/gdpr/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: savedPreferences,
          timestamp: savedPreferences.timestamp
        }),
      });
    } catch (error) {
      console.log('Could not save consent to backend:', error);
    }
    
    localStorage.setItem('shopstation-cookie-consent', JSON.stringify(savedPreferences));
    setPreferences(savedPreferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (type, value) => {
    if (type === 'necessary') return; // Can't change necessary cookies
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full max-w-4xl mx-auto mb-4 rounded-lg shadow-2xl border-t-4 border-blue-600">
        {!showPreferences ? (
          // Main consent banner
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">🍪</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  We value your privacy
                </h3>
                <p className="text-gray-700 mb-4">
                  ShopStation uses cookies to enhance your experience, analyze site usage, and assist in marketing efforts. 
                  By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or learn more in our{' '}
                  <button className="text-blue-600 hover:text-blue-800 underline font-medium">
                    Privacy Policy
                  </button>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Customize Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Preferences panel
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Cookie Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Necessary Cookies</h4>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  These cookies are essential for the website to function and cannot be switched off. 
                  They include session management, security, and accessibility features.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Help us understand how visitors use our website by collecting anonymous usage statistics.
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Functional Cookies</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Enable enhanced functionality like remembering your preferences and providing personalized content.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Marketing Cookies</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600 text-sm">
                  Used to track visitors for advertising purposes and to show personalized ads.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePreferences}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;