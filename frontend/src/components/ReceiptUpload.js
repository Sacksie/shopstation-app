import React, { useState } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const ReceiptUpload = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadMessage('📸 Please choose a photo of your receipt');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadMessage('📏 Photo is too large. Please choose a smaller image');
      return;
    }

    setIsUploading(true);
    setUploadMessage('🔍 Reading your receipt...');

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${API_URL}/api/receipts/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUploadMessage('✅ Great! Your receipt was processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }
      } else {
        setUploadMessage('😅 We had trouble reading your receipt. Please try a clearer photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.name === 'AbortError') {
        setUploadMessage('⏰ Upload took too long. Please try again with a smaller image');
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || !navigator.onLine) {
        setUploadMessage('📶 Connection problem. Please check your internet and try again');
      } else if (error.message.includes('413')) {
        setUploadMessage('📏 Image is too large. Please choose a smaller photo');
      } else {
        setUploadMessage('😊 Something went wrong. Please try again');
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-700">Quick Add from Receipt</h3>
          <p className="text-sm text-gray-500">Upload a receipt to add prices</p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <div className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
          } text-white`}>
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              '📷 Upload Receipt'
            )}
          </div>
        </label>
      </div>
      {uploadMessage && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
          uploadMessage.includes('✅') || uploadMessage.includes('🔍')
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : uploadMessage.includes('📸') || uploadMessage.includes('📏')
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
