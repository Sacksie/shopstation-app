import React from 'react';

const LearnMorePopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Empowering Independent Stores</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div className="text-gray-700 space-y-4">
          <p>
            Our mission is to provide local, independent stores with the same data-driven tools that major supermarkets use to compete. 
          </p>
          <p>
            By digitizing your inventory and providing powerful analytics on pricing, customer demand, and profitability, we help you increase your margins, optimize your stock, and win more customers.
          </p>
          <p className="font-semibold pt-4 border-t mt-4">
            Ready to learn more? Get in touch with our founder directly:
          </p>
          <ul className="list-none space-y-2">
            <li><strong>Email:</strong> gavrielsacks21@gmail.com</li>
            <li><strong>Phone:</strong> +447539499216</li>
          </ul>
        </div>
        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnMorePopup;
