import React, { useState } from 'react';

const REQUIRED_FIELDS = [
  { key: 'productName', label: 'Product Name' },
  { key: 'price', label: 'Price' },
  { key: 'barcode', label: 'Barcode (SKU/UPC)' },
  { key: 'category', label: 'Category' },
];

const InventoryImporter = ({ onCancel }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review, 4: Done
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndParseHeaders = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('inventoryFile', file);
    formData.append('stage', 'parseHeaders');

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file headers.');
      }

      setHeaders(data.headers);
      // Pre-populate mapping based on header names (simple matching)
      const initialMapping = {};
      REQUIRED_FIELDS.forEach(field => {
        const matchedHeader = data.headers.find(h => 
          h.toLowerCase().replace(/[\s_]/g, '').includes(field.key.toLowerCase())
        );
        if (matchedHeader) {
          initialMapping[field.key] = matchedHeader;
        }
      });
      setMapping(initialMapping);
      setStep(2);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (systemField, csvHeader) => {
    setMapping(prev => ({ ...prev, [systemField]: csvHeader }));
  };

  const handleProcessData = async () => {
    // Basic validation: ensure all required fields are mapped
    const unmappedField = REQUIRED_FIELDS.find(field => !mapping[field.key]);
    if (unmappedField) {
      setError(`Please map the required field: ${unmappedField.label}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('inventoryFile', file);
    formData.append('stage', 'processData');
    formData.append('mapping', JSON.stringify(mapping));

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process your file.');
      }
      
      console.log('Import successful:', data.summary);
      setStep(3); // Move to a success/review step

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepOne = () => (
    <div>
      <h4 className="text-lg font-semibold text-gray-700">Step 1: Upload Your Spreadsheet</h4>
      <p className="text-sm text-gray-600 mt-1 mb-4">
        Select a CSV file of your product inventory. Don't worry about the format; we'll help you map the columns in the next step.
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium">
          {file ? 'Change file' : 'Select a file'}
        </label>
        {file && <p className="text-gray-500 mt-2">{file.name}</p>}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="flex justify-end mt-6">
        <button 
          onClick={handleUploadAndParseHeaders}
          disabled={!file || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? 'Parsing...' : 'Next: Map Columns'}
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div>
      <h4 className="text-lg font-semibold text-gray-700">Step 2: Map Your Columns</h4>
      <p className="text-sm text-gray-600 mt-1 mb-4">
        Match the columns from your file (on the right) to the required fields in our system (on the left).
      </p>
      <div className="space-y-4">
        {REQUIRED_FIELDS.map(field => (
          <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
            <label className="font-medium text-gray-800">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => handleMappingChange(field.key, e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Select a column from your file...</option>
              {headers.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      <div className="flex justify-between items-center mt-6">
        <button 
          onClick={() => setStep(1)}
          className="text-sm text-gray-600 hover:underline"
        >
          Back to Upload
        </button>
        <button 
          onClick={handleProcessData}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors"
        >
          {isLoading ? 'Importing...' : 'Import Products'}
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="text-center">
      <h4 className="text-2xl font-bold text-green-600">Import Successful!</h4>
      <p className="mt-2 text-gray-700">
        Your products have been successfully imported. You can now manage them in your inventory.
      </p>
      <div className="mt-6">
        <button 
          onClick={onCancel}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3 border-b mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Import Your Inventory</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div>
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </div>
      </div>
    </div>
  );
};

export default InventoryImporter;
