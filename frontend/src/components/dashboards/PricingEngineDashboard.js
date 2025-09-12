import React from 'react';

const PricingEngineDashboard = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Rules */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">My Pricing Rules</h3>
          <ul className="space-y-3">
            {data.rules.map(rule => (
              <li key={rule.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{rule.name}</p>
                  <p className="text-sm text-gray-500">{rule.description}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {rule.active ? 'Active' : 'Paused'}
                </span>
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            + Create New Rule
          </button>
        </div>

        {/* Pricing Suggestions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Pricing Suggestions</h3>
          <ul className="space-y-3">
            {data.suggestions.map(item => (
              <li key={item.productId} className="p-3 rounded-md border border-yellow-300 bg-yellow-50">
                <p className="font-medium text-yellow-900">{item.name}</p>
                <p className="text-sm text-yellow-800 mt-1">{item.reason}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm">
                    Current: <span className="font-semibold line-through">£{item.currentPrice.toFixed(2)}</span>
                    <span className="ml-2 font-bold text-green-600">→ £{item.suggestedPrice.toFixed(2)}</span>
                  </p>
                  <div>
                    <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">Accept</button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded-md ml-2">Dismiss</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingEngineDashboard;
