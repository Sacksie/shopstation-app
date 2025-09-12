import React from 'react';

const CostOfGoodsDashboard = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Upload */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Invoices & Receipts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload images or PDFs of your supplier invoices. Our system will automatically scan them to track your costs.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="font-medium text-blue-600">Drag & Drop Files Here</p>
            <p className="text-sm text-gray-500 my-2">or</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Select Files
            </button>
          </div>
        </div>

        {/* Margin Analysis */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Profit Margin Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Average Store Margin</p>
              <p className="text-2xl font-bold text-green-600">{data.marginAnalysis.averageStoreMargin}%</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <p className="font-medium text-gray-700">Highest Margin Category</p>
              <p className="font-semibold text-gray-800">{data.marginAnalysis.highestMarginCategory.name} ({data.marginAnalysis.highestMarginCategory.margin}%)</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <p className="font-medium text-gray-700">Lowest Margin Category</p>
              <p className="font-semibold text-gray-800">{data.marginAnalysis.lowestMarginCategory.name} ({data.marginAnalysis.lowestMarginCategory.margin}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Uploads</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.recentUploads.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.supplier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">£{item.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostOfGoodsDashboard;
