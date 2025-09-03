import React, { useState } from 'react';
import config from '../config/environments';

const DataDeletionRequest = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    requestType: 'delete_all',
    reason: '',
    dataTypes: {
      search_history: false,
      analytics_data: false,
      preferences: false,
      feedback: false
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDataTypeChange = (type, checked) => {
    setFormData(prev => ({
      ...prev,
      dataTypes: { ...prev.dataTypes, [type]: checked }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Send to backend
      const API_URL = config.api.baseUrl;
      const response = await fetch(`${API_URL}/api/gdpr/data-deletion-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await response.json();
      
      if (result.success) {
        // Store locally as backup
        const existingRequests = JSON.parse(localStorage.getItem('shopstation-deletion-requests') || '[]');
        existingRequests.push({
          ...formData,
          requestId: result.data.requestId,
          timestamp: result.data.timestamp
        });
        localStorage.setItem('shopstation-deletion-requests', JSON.stringify(existingRequests));
        
        setSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Submitted</h3>
            <p className="text-gray-600 mb-6">
              Your data deletion request has been received. We will process it within 30 days as required by GDPR 
              and send confirmation to your email address.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Request ID:</strong> {`DEL-${Date.now().toString().substr(-6)}`}<br/>
                <strong>Email:</strong> {formData.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Data Deletion Request</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Your GDPR Rights</h4>
                <p className="text-sm text-blue-800">
                  Under GDPR, you have the right to request deletion of your personal data. 
                  We'll process your request within 30 days and notify you of the outcome.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What would you like us to do? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="requestType"
                    value="delete_all"
                    checked={formData.requestType === 'delete_all'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Delete all my personal data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="requestType"
                    value="delete_specific"
                    checked={formData.requestType === 'delete_specific'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Delete specific types of data (select below)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="requestType"
                    value="export"
                    checked={formData.requestType === 'export'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Export my data (data portability)</span>
                </label>
              </div>
            </div>

            {/* Specific Data Types (only if delete_specific is selected) */}
            {formData.requestType === 'delete_specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select data types to delete:
                </label>
                <div className="space-y-2">
                  {Object.entries({
                    search_history: 'Search history and grocery lists',
                    analytics_data: 'Analytics and usage data',
                    preferences: 'Settings and preferences',
                    feedback: 'Feedback and survey responses'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dataTypes[key]}
                        onChange={(e) => handleDataTypeChange(key, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reason (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for request (optional)
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Help us improve by telling us why you're making this request..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Processing Request...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              By submitting this request, you confirm that the information provided is accurate. 
              We may need to verify your identity before processing the request. 
              For urgent matters, contact us at{' '}
              <a href="mailto:gavrielsacks21@gmail.com" className="text-blue-600 hover:text-blue-800">
                gavrielsacks21@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionRequest;