import React, { useState } from 'react';
import DataDeletionRequest from './DataDeletionRequest';

const LegalPages = ({ onClose, initialPage = 'privacy' }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showDataDeletion, setShowDataDeletion] = useState(false);

  const PrivacyPolicy = () => (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
      <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">1. Introduction</h3>
        <p className="mb-4">
          ShopStation ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
          how we collect, use, disclose, and safeguard your information when you use our grocery price comparison service.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">2. Information We Collect</h3>
        <div className="mb-4">
          <h4 className="font-medium mb-2">Personal Information:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Email addresses (when provided for feedback or admin access)</li>
            <li>Names (when provided in contact forms)</li>
            <li>IP addresses (automatically collected)</li>
            <li>Device and browser information</li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-medium mb-2">Usage Information:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Shopping lists and search queries</li>
            <li>Store preferences and selections</li>
            <li>Analytics data (page views, click patterns, session duration)</li>
            <li>Feedback and survey responses</li>
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">3. How We Use Your Information</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Provide and improve our price comparison service</li>
          <li>Analyze usage patterns to enhance user experience</li>
          <li>Respond to feedback and support requests</li>
          <li>Send important service updates (with consent)</li>
          <li>Detect and prevent fraud or misuse</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Legitimate Interest:</strong> Service provision and improvement</li>
          <li><strong>Consent:</strong> Marketing communications and optional analytics</li>
          <li><strong>Legal Obligation:</strong> Compliance with applicable laws</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">5. Cookies and Tracking</h3>
        <p className="mb-4">
          We use cookies to enhance your experience. You can control cookie preferences through our cookie banner 
          or browser settings. Types of cookies we use:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>Necessary:</strong> Essential for site functionality</li>
          <li><strong>Analytics:</strong> Help us understand site usage (requires consent)</li>
          <li><strong>Functional:</strong> Remember your preferences (requires consent)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">6. Data Sharing and Disclosure</h3>
        <p className="mb-4">We do not sell your personal data. We may share information:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>With service providers (hosting, analytics) under strict agreements</li>
          <li>When required by law or legal process</li>
          <li>To protect our rights, property, or safety</li>
          <li>With your explicit consent</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">7. Your Rights (GDPR)</h3>
        <p className="mb-4">If you're in the EU/UK, you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>Access:</strong> Request copies of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
          <li><strong>Erasure:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Receive your data in a portable format</li>
          <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Restrict:</strong> Request restricted processing</li>
        </ul>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            onClick={() => setShowDataDeletion(true)}
            className="text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Submit a data deletion request
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">8. Data Security</h3>
        <p className="text-gray-700">
          We implement appropriate technical and organizational security measures to protect your data, 
          including encryption, access controls, and regular security assessments.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">9. Data Retention</h3>
        <p className="text-gray-700">
          We retain personal data only as long as necessary for the purposes outlined in this policy, 
          typically no longer than 2 years for inactive accounts.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">10. Contact Us</h3>
        <p className="text-gray-700">
          For privacy questions or to exercise your rights, contact us at:{' '}
          <a href="mailto:gavrielsacks21@gmail.com" className="text-blue-600 hover:text-blue-800">
            gavrielsacks21@gmail.com
          </a>
        </p>
      </section>
    </div>
  );

  const TermsOfService = () => (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service</h2>
      <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
        <p className="text-gray-700">
          By accessing and using ShopStation, you accept and agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our service.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">2. Description of Service</h3>
        <p className="text-gray-700">
          ShopStation is a grocery price comparison service that helps users find and compare prices 
          across kosher grocery stores in London. We aggregate pricing information to help you make 
          informed shopping decisions.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">3. User Responsibilities</h3>
        <p className="mb-4">You agree to:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Use the service for legitimate price comparison purposes only</li>
          <li>Not attempt to manipulate or disrupt the service</li>
          <li>Not use automated tools to access the service excessively</li>
          <li>Provide accurate information when requested</li>
          <li>Respect intellectual property rights</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">4. Price Information Disclaimer</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">⚠️ Important Price Disclaimer</p>
          <p className="text-yellow-800 text-sm">
            All prices displayed on ShopStation are estimates and may not reflect current in-store prices. 
            Prices can change frequently and may vary from actual shelf prices. Always verify prices 
            in-store before making purchases. We are not responsible for pricing discrepancies.
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">5. Limitation of Liability</h3>
        <p className="text-gray-700">
          ShopStation is provided "as is" without warranties of any kind. We are not liable for any 
          damages arising from your use of the service, including but not limited to pricing errors, 
          service interruptions, or data loss.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">6. Intellectual Property</h3>
        <p className="text-gray-700">
          All content, features, and functionality of ShopStation are owned by us and protected by 
          copyright, trademark, and other intellectual property laws.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">7. Termination</h3>
        <p className="text-gray-700">
          We reserve the right to terminate or restrict access to our service at any time, 
          with or without notice, for any reason.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">8. Governing Law</h3>
        <p className="text-gray-700">
          These terms are governed by the laws of England and Wales. Any disputes will be 
          subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">9. Contact Information</h3>
        <p className="text-gray-700">
          For questions about these Terms of Service, contact us at:{' '}
          <a href="mailto:gavrielsacks21@gmail.com" className="text-blue-600 hover:text-blue-800">
            gavrielsacks21@gmail.com
          </a>
        </p>
      </section>
    </div>
  );

  const CopyrightNotice = () => (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Copyright Notice</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Copyright Ownership</h3>
        <p className="text-gray-700">
          © {new Date().getFullYear()} ShopStation. All rights reserved.
        </p>
        <p className="text-gray-700 mt-4">
          This website and its original content, features, and functionality are owned by ShopStation 
          and are protected by international copyright, trademark, patent, trade secret, and other 
          intellectual property or proprietary rights laws.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Permitted Use</h3>
        <p className="text-gray-700">
          You may access and use this website for personal, non-commercial purposes only. 
          Any other use requires our prior written consent.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Restrictions</h3>
        <p className="mb-4">You may not:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Copy, reproduce, distribute, or display the content without permission</li>
          <li>Modify, reverse engineer, or create derivative works</li>
          <li>Use the content for commercial purposes without authorization</li>
          <li>Remove or alter copyright notices or attributions</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Third-Party Content</h3>
        <p className="text-gray-700">
          Some content may be licensed from third parties. Such content remains the property 
          of the respective owners and is used under appropriate licenses.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">DMCA Compliance</h3>
        <p className="text-gray-700">
          We respect intellectual property rights. If you believe your copyright has been infringed, 
          please contact us at{' '}
          <a href="mailto:gavrielsacks21@gmail.com" className="text-blue-600 hover:text-blue-800">
            gavrielsacks21@gmail.com
          </a>
          {' '}with detailed information about the alleged infringement.
        </p>
      </section>
    </div>
  );

  const PriceDisclaimer = () => (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Disclaimer</h2>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-600 mt-1 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Important Price Information</h3>
            <p className="text-red-800">
              All prices displayed on ShopStation are estimates only and may not accurately reflect 
              current in-store prices. Always verify prices at the store before making purchases.
            </p>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Price Accuracy</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Prices are manually entered and may contain errors</li>
          <li>Prices change frequently and may be outdated</li>
          <li>Promotional prices and discounts may not be reflected</li>
          <li>Prices may vary by store location or timing</li>
          <li>Special offers, loyalty discounts, and bulk pricing are not included</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Data Sources</h3>
        <p className="text-gray-700">
          Our price data is collected from various sources including manual store visits, 
          user submissions, and publicly available information. We strive for accuracy but 
          cannot guarantee the completeness or timeliness of all price information.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">No Liability</h3>
        <p className="text-gray-700">
          ShopStation is not responsible for any losses, damages, or inconvenience caused by 
          reliance on price information provided through our service. Users are advised to 
          confirm all prices directly with retailers.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Price Updates</h3>
        <p className="text-gray-700">
          We make reasonable efforts to keep prices current, but update frequency varies. 
          The last update timestamp is shown where available to help you assess data freshness.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Reporting Issues</h3>
        <p className="text-gray-700">
          If you notice incorrect pricing information, please help us improve by reporting it 
          through our feedback system or by contacting us at{' '}
          <a href="mailto:gavrielsacks21@gmail.com" className="text-blue-600 hover:text-blue-800">
            gavrielsacks21@gmail.com
          </a>.
        </p>
      </section>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfService />;
      case 'copyright': return <CopyrightNotice />;
      case 'disclaimer': return <PriceDisclaimer />;
      default: return <PrivacyPolicy />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 rounded-l-lg border-r border-gray-200">
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Legal Information</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => setCurrentPage('privacy')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'privacy' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🔒 Privacy Policy
                </button>
                <button
                  onClick={() => setCurrentPage('terms')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'terms' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Terms of Service
                </button>
                <button
                  onClick={() => setCurrentPage('disclaimer')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'disclaimer' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⚠️ Price Disclaimer
                </button>
                <button
                  onClick={() => setCurrentPage('copyright')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'copyright' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  © Copyright Notice
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div></div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {renderPage()}
            </div>
          </div>
        </div>
      </div>

      {showDataDeletion && (
        <DataDeletionRequest onClose={() => setShowDataDeletion(false)} />
      )}
    </>
  );
};

export default LegalPages;