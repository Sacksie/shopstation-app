import React, { useState } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const ProductRequestModal = ({ 
  isOpen, 
  onClose, 
  productName = '', 
  onRequestSubmitted 
}) => {
  const [formData, setFormData] = useState({
    productName: productName,
    preferredBrand: '',
    userEmail: '',
    userName: '',
    categorySuggestion: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${API_URL}/api/requests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        
        // Reset form
        setFormData({
          productName: '',
          preferredBrand: '',
          userEmail: '',
          userName: '',
          categorySuggestion: '',
          description: ''
        });

        // Notify parent component
        if (onRequestSubmitted) {
          onRequestSubmitted(result.requestId);
        }

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit request'
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Request Product
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Help us add this product to our database
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Status Messages */}
          {submitStatus && (
            <div className={`mb-4 p-3 rounded-md ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Product Name */}
          <div className="mb-4">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Organic Almond Milk"
            />
          </div>

          {/* Preferred Brand */}
          <div className="mb-4">
            <label htmlFor="preferredBrand" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Brand
            </label>
            <input
              type="text"
              id="preferredBrand"
              name="preferredBrand"
              value={formData.preferredBrand}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Alpro, Silk, etc."
            />
          </div>

          {/* Category Suggestion */}
          <div className="mb-4">
            <label htmlFor="categorySuggestion" className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Category
            </label>
            <select
              id="categorySuggestion"
              name="categorySuggestion"
              value={formData.categorySuggestion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category...</option>
              <option value="dairy">Dairy & Alternatives</option>
              <option value="bakery">Bakery</option>
              <option value="meat">Meat & Poultry</option>
              <option value="fish">Fish & Seafood</option>
              <option value="fruits">Fruits & Vegetables</option>
              <option value="pantry">Pantry & Staples</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks & Treats</option>
              <option value="frozen">Frozen Foods</option>
              <option value="household">Household & Cleaning</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information that might help us add this product..."
            />
          </div>

          {/* Contact Information */}
          <div className="mb-4">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              id="userEmail"
              name="userEmail"
              value={formData.userEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll notify you when this product is added to our database
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestModal;
