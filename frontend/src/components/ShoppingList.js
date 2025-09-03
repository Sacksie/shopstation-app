import React, { useState, useEffect } from 'react';

const ShoppingList = ({ items = [], onListUpdate }) => {
  const [listName, setListName] = useState('My Shopping List');
  const [savedLists, setSavedLists] = useState([]);
  const [currentList, setCurrentList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Load saved lists from localStorage on component mount
  useEffect(() => {
    loadSavedLists();
    // Initialize current list with passed items
    if (items.length > 0) {
      setCurrentList(items);
    }
  }, [items]);

  // Save lists to localStorage
  const saveToLocalStorage = (lists) => {
    try {
      localStorage.setItem('shopstation_shopping_lists', JSON.stringify(lists));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Load lists from localStorage
  const loadSavedLists = () => {
    try {
      const saved = localStorage.getItem('shopstation_shopping_lists');
      if (saved) {
        const lists = JSON.parse(saved);
        setSavedLists(lists);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Save current list
  const saveCurrentList = () => {
    if (!listName.trim()) return;

    const newList = {
      id: Date.now().toString(),
      name: listName.trim(),
      items: currentList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedLists = [...savedLists, newList];
    setSavedLists(updatedLists);
    saveToLocalStorage(updatedLists);
    setShowSaveModal(false);
    setListName('My Shopping List');

    // Notify parent component
    if (onListUpdate) {
      onListUpdate(newList);
    }
  };

  // Load a saved list
  const loadList = (list) => {
    setCurrentList(list.items);
    setListName(list.name);
    setShowLoadModal(false);

    // Notify parent component
    if (onListUpdate) {
      onListUpdate(list);
    }
  };

  // Delete a saved list
  const deleteList = (listId) => {
    const updatedLists = savedLists.filter(list => list.id !== listId);
    setSavedLists(updatedLists);
    saveToLocalStorage(updatedLists);
  };

  // Generate shareable URL
  const generateShareUrl = () => {
    const listData = {
      name: listName,
      items: currentList,
      timestamp: new Date().toISOString()
    };

    const encodedData = btoa(JSON.stringify(listData));
    const url = `${window.location.origin}${window.location.pathname}?list=${encodedData}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share URL copied to clipboard!');
    }
  };

  // Print shopping list
  const printList = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${listName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .list-item { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .quantity { font-weight: bold; color: #2563eb; }
            .product { font-size: 16px; }
            .store-info { font-size: 12px; color: #666; margin-top: 5px; }
            .total { margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${listName}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="list-items">
            ${currentList.map(item => `
              <div class="list-item">
                <div class="quantity">${item.quantity} ${item.unit}</div>
                <div class="product">${item.productName}</div>
                ${item.prices && item.prices.length > 0 ? `
                  <div class="store-info">
                    Available at: ${item.prices.map(p => `${p.store_name} (£${p.price})`).join(', ')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            Total Items: ${currentList.length}
          </div>
          
          <div class="no-print" style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()">Print List</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Split list across stores (basic implementation)
  const splitAcrossStores = () => {
    const storeGroups = {};
    
    currentList.forEach(item => {
      if (item.prices && item.prices.length > 0) {
        item.prices.forEach(price => {
          if (!storeGroups[price.store_name]) {
            storeGroups[price.store_name] = [];
          }
          storeGroups[price.store_name].push({
            ...item,
            selectedPrice: price
          });
        });
      }
    });

    // Create a simple report
    let report = 'Shopping List Split by Store:\n\n';
    
    Object.entries(storeGroups).forEach(([storeName, items]) => {
      report += `${storeName}:\n`;
      items.forEach(item => {
        report += `  - ${item.quantity} ${item.unit} ${item.productName} (£${item.selectedPrice.price})\n`;
      });
      report += '\n';
    });

    // Show in alert for now (could be enhanced with a modal)
    alert(report);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save List
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Load List
          </button>
        </div>
      </div>

      {/* List Items */}
      {currentList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No items in your shopping list yet.</p>
          <p className="text-sm">Add products to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {item.quantity} {item.unit} {item.productName}
                </div>
                {item.prices && item.prices.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Available at: {item.prices.map(p => `${p.store_name} (£${p.price})`).join(', ')}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const updatedList = currentList.filter((_, i) => i !== index);
                  setCurrentList(updatedList);
                }}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {currentList.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={generateShareUrl}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Share List
          </button>
          <button
            onClick={printList}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Print List
          </button>
          <button
            onClick={splitAcrossStores}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Split by Store
          </button>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Shopping List</h3>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Enter list name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={saveCurrentList}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Load Shopping List</h3>
            {savedLists.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved lists found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedLists.map((list) => (
                  <div key={list.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <div>
                      <div className="font-medium">{list.name}</div>
                      <div className="text-sm text-gray-500">
                        {list.items.length} items • {new Date(list.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadList(list)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteList(list.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Share Shopping List</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this URL with others to let them view your shopping list:
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={copyShareUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
