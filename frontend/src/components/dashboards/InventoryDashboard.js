import React from 'react';

const InventoryDashboard = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Inventory Summary</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">{data.inventorySummary.totalItems.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">In Stock %</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">{data.inventorySummary.inStockPercentage}%</p>
          <p className="text-sm text-gray-500">{data.inventorySummary.outOfStockItems} items are out of stock</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Estimated Weekly Profit</h4>
          <p className="text-3xl font-bold text-purple-600 mt-2">£{data.inventorySummary.estimatedWeeklyProfit.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Based on current stock & sales</p>
        </div>
      </div>

      {/* Restock Advisory */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Restock Advisor</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggestion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.restockAdvisory.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{item.suggestion}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add to Order</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryDashboard;
