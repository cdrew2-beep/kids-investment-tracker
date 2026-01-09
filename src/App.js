import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  
  // Load saved cash or start with $10,000
  const [cash, setCash] = useState(() => {
    const saved = localStorage.getItem('cash');
    return saved ? parseFloat(saved) : 2.66;
  });
  
  // Load saved portfolio or start with one Apple stock
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [
      { id: 1, symbol: 'AAPL', name: 'Apple', shares: 5, buyPrice: 150, currentPrice: 180 },
    ];
  });
  
  const [newStock, setNewStock] = useState({ symbol: '', shares: 0, price: 0 });

const fetchStockPrice = async (symbol) => {
  try {
    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    console.log('Fetching price for:', symbol);
    const response = await axios.get(url);
    const data = response.data;
    
    // Check for rate limit message
    if (data.Note) {
      alert('⚠️ API Rate Limit Reached!\n\nFree tier allows 5 calls per minute.\nPlease wait 60 seconds and try again.');
      return null;
    }
    
    // Check for invalid API key
    if (data['Error Message']) {
      alert('❌ Error: Invalid API key or stock symbol.\n\nMake sure your .env file has the correct API key.');
      return null;
    }
    
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      console.log('Price fetched successfully:', price);
      return price;
    } else {
      alert(`❌ Stock symbol "${symbol}" not found!\n\nMake sure you're using the correct ticker symbol.\nExamples: AAPL, TSLA, MSFT, GOOGL`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching stock price:', error);
    alert('❌ Network error. Please check your internet connection and try again.');
    return null;
  }
};

const refreshAllPrices = async () => {
  if (portfolio.length === 0) {
    alert('No stocks to refresh!');
    return;
  }
  
  const confirmed = window.confirm(`Refresh all ${portfolio.length} stock prices?\n\nThis will take about ${portfolio.length * 15} seconds to avoid rate limits.`);
  if (!confirmed) return;
  
  const updatedPortfolio = [];
  let successCount = 0;
  let failCount = 0;
  
  // Show progress message
  alert(`⏳ Refreshing ${portfolio.length} stocks...\n\nThis will take ${portfolio.length * 15} seconds.\n\nPlease wait and don't close this window!`);
  
  for (let i = 0; i < portfolio.length; i++) {
    const stock = portfolio[i];
    console.log(`Refreshing ${i + 1}/${portfolio.length}: ${stock.symbol}`);
    
    const newPrice = await fetchStockPrice(stock.symbol);
    
    if (newPrice) {
      updatedPortfolio.push({
        ...stock,
        currentPrice: newPrice
      });
      successCount++;
      console.log(`✅ ${stock.symbol}: $${newPrice}`);
    } else {
      // Keep old price if fetch fails
      updatedPortfolio.push(stock);
      failCount++;
      console.log(`❌ ${stock.symbol}: Failed, keeping old price`);
    }
    
    // Wait 15 seconds before next call (except after last one)
    if (i < portfolio.length - 1) {
      console.log('⏰ Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  setPortfolio(updatedPortfolio);
  
  alert(`✅ Refresh Complete!\n\nSuccessful: ${successCount}\nFailed: ${failCount}\n\n${failCount > 0 ? 'Failed stocks kept their old prices.' : 'All prices updated!'}`);
};

  const addCash = () => {
  const amount = prompt('How much cash do you want to add?');
  if (amount && !isNaN(amount)) {
    setCash(cash + parseFloat(amount));
  }
};

const editStock = (stockId) => {
  const stock = portfolio.find(s => s.id === stockId);
  if (!stock) return;
  
  const newShares = prompt(`Edit number of shares for ${stock.symbol}:\n\nCurrent: ${stock.shares} shares`, stock.shares);
  
  if (newShares === null) return; // User clicked Cancel
  
  const sharesNum = parseFloat(newShares);
  if (isNaN(sharesNum) || sharesNum <= 0) {
    alert('❌ Please enter a valid number of shares greater than 0');
    return;
  }
  
  const newBuyPrice = prompt(`Edit buy price for ${stock.symbol}:\n\nCurrent: $${stock.buyPrice.toFixed(2)}`, stock.buyPrice.toFixed(2));
  
  if (newBuyPrice === null) return; // User clicked Cancel
  
  const priceNum = parseFloat(newBuyPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    alert('❌ Please enter a valid price greater than 0');
    return;
  }
  
  // Calculate the difference in cost
  const oldCost = stock.shares * stock.buyPrice;
  const newCost = sharesNum * priceNum;
  const costDifference = newCost - oldCost;
  
  // Check if user has enough cash for increased cost
  if (costDifference > cash) {
    alert(`❌ Not enough cash!\n\nThis change would cost an additional $${costDifference.toFixed(2)}\nYou only have $${cash.toFixed(2)} available.`);
    return;
  }
  
  // Update the portfolio
  const updatedPortfolio = portfolio.map(s => {
    if (s.id === stockId) {
      return {
        ...s,
        shares: sharesNum,
        buyPrice: priceNum
      };
    }
    return s;
  });
  
  setPortfolio(updatedPortfolio);
  setCash(cash - costDifference);
  
  alert(`✅ Updated ${stock.symbol}!\n\nShares: ${stock.shares} → ${sharesNum}\nBuy Price: $${stock.buyPrice.toFixed(2)} → $${priceNum.toFixed(2)}\nCash adjusted by: $${costDifference.toFixed(2)}`);
};

const removeCash = () => {
  const amount = prompt('How much cash do you want to withdraw?');
  if (amount && !isNaN(amount)) {
    const withdrawal = parseFloat(amount);
    if (withdrawal <= cash) {
      setCash(cash - withdrawal);
    } else {
      alert("You don't have that much cash!");
    }
  }
};

const clearAllStocks = () => {
  if (window.confirm('Are you sure? This will sell ALL stocks and return cash to you!')) {
    // Calculate total value of all stocks
    const totalStockValue = portfolio.reduce((sum, stock) => 
      sum + (stock.shares * stock.currentPrice), 0
    );
    // Add that money back to cash
    setCash(cash + totalStockValue);
    // Clear all stocks
    setPortfolio([]);
  }
};

  // Save cash whenever it changes
  useEffect(() => {
    localStorage.setItem('cash', cash.toString());
  }, [cash]);

  // Save portfolio whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

 const addStock = async () => {
  if (newStock.symbol && newStock.shares > 0) {
    // Fetch real price
    const realPrice = await fetchStockPrice(newStock.symbol);
    
    if (realPrice) {
      const cost = newStock.shares * realPrice;
      if (cost <= cash) {
        setPortfolio([...portfolio, {
          id: Date.now(),
          symbol: newStock.symbol.toUpperCase(),
          name: newStock.symbol.toUpperCase(),
          shares: parseFloat(newStock.shares),
          buyPrice: realPrice,
          currentPrice: realPrice
        }]);
        setCash(cash - cost);
        setNewStock({ symbol: '', shares: 0, price: 0 });
      } else {
        alert(`Not enough cash! ${newStock.shares} shares costs $${cost.toFixed(2)}`);
      }
    }
  }
};

  const removeStock = (id) => {
    const stock = portfolio.find(s => s.id === id);
    if (stock) {
      setCash(cash + (stock.shares * stock.currentPrice));
      setPortfolio(portfolio.filter(s => s.id !== id));
    }
  };

  const totalValue = portfolio.reduce((sum, stock) => 
    sum + (stock.shares * stock.currentPrice), 0
  );

  const totalGainLoss = portfolio.reduce((sum, stock) => 
    sum + (stock.shares * (stock.currentPrice - stock.buyPrice)), 0
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#0F172A', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
  <h1 style={{ color: '#A78BFA', fontSize: '32px', marginBottom: '10px' }}>
    📈 Abby's Investment Tracker
  </h1>
  <p style={{ color: '#94A3B8' }}>Learn about stocks and saving money! 🚀</p>
</div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['portfolio', 'add', 'learn'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: activeTab === tab ? 'none' : '1px solid #334155',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#6B46C1' : '#1E293B',
color: activeTab === tab ? 'white' : '#94A3B8',
              }}
            >
              {tab === 'portfolio' && '📊 My Stocks'}
              {tab === 'add' && '➕ Buy Stock'}
              {tab === 'learn' && '📚 Learn'}
            </button>
          ))}
        </div>

        {activeTab === 'portfolio' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '10px', padding: '20px', color: 'white' }}>
  <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>💵 Cash Available</h3>
  <p style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '15px' }}>${cash.toFixed(2)}</p>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button
      onClick={addCash}
      style={{ 
        flex: 1,
        padding: '8px 12px', 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        color: 'white', 
        border: '2px solid white',
        borderRadius: '6px', 
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      ➕ Add Cash
    </button>
    <button
      onClick={removeCash}
      style={{ 
        flex: 1,
        padding: '8px 12px', 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        color: 'white', 
        border: '2px solid white',
        borderRadius: '6px', 
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      ➖ Withdraw
    </button>
  </div>
</div>
              
              <div style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', borderRadius: '10px', padding: '20px', color: 'white' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📈 Stock Value</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>${totalValue.toFixed(2)}</p>
              </div>
              
              <div style={{ background: `linear-gradient(135deg, ${totalGainLoss >= 0 ? '#8B5CF6, #7C3AED' : '#EF4444, #DC2626'})`, borderRadius: '10px', padding: '20px', color: 'white' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>🎯 Profit/Loss</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>My Stocks</h2>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
  <button
    onClick={refreshAllPrices}
    style={{ 
      padding: '8px 16px', 
      backgroundColor: '#3B82F6', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      fontSize: '14px', 
      cursor: 'pointer'
    }}
  >
    🔄 Refresh Prices
  </button>
  
  {portfolio.length > 0 && (
    <button
      onClick={clearAllStocks}
      style={{ 
        padding: '8px 16px', 
        backgroundColor: '#EF4444', 
        color: 'white', 
        border: 'none', 
        borderRadius: '6px', 
        fontSize: '14px', 
        cursor: 'pointer'
      }}
    >
      🗑️ Sell All Stocks
    </button>
  )}
</div>

              {portfolio.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
                  No stocks yet! Click "Buy Stock" to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {portfolio.map(stock => {
                    const gainLoss = stock.shares * (stock.currentPrice - stock.buyPrice);
                    const gainLossPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice * 100).toFixed(1);
                    return (
                      <div key={stock.id} style={{ backgroundColor: '#0F172A', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
                        <div>
  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>{stock.symbol}</h3>
  <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '5px' }}>
    {stock.shares} shares
  </p>
  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '3px' }}>
  Buy: ${stock.buyPrice.toFixed(2)} → Now: ${stock.currentPrice.toFixed(2)}
  {stock.currentPrice > stock.buyPrice && (
    <span style={{ color: '#10B981', marginLeft: '8px' }}>▲ Up</span>
  )}
  {stock.currentPrice < stock.buyPrice && (
    <span style={{ color: '#EF4444', marginLeft: '8px' }}>▼ Down</span>
  )}
  {stock.currentPrice === stock.buyPrice && (
    <span style={{ color: '#94A3B8', marginLeft: '8px' }}>→ Same</span>
  )}
</p>
  <p style={{ fontSize: '13px', color: '#94A3B8' }}>
    Total Value: ${(stock.shares * stock.currentPrice).toFixed(2)}
  </p>
</div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '18px', fontWeight: 'bold', color: gainLoss >= 0 ? '#10B981' : '#EF4444' }}>
                            {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)}
                          </p>
                          <p style={{ fontSize: '14px', color: gainLoss >= 0 ? '#10B981' : '#EF4444' }}>
                            ({gainLossPercent}%)
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
  <button
    onClick={() => editStock(stock.id)}
    style={{ 
      padding: '8px 12px', 
      backgroundColor: '#3B82F6', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      cursor: 'pointer',
      fontSize: '14px'
    }}
  >
    ✏️ Edit
  </button>
  <button
    onClick={() => removeStock(stock.id)}
    style={{ 
      padding: '8px 12px', 
      backgroundColor: '#EF4444', 
      color: 'white', 
      border: 'none', 
      borderRadius: '6px', 
      cursor: 'pointer',
      fontSize: '14px'
    }}
  >
    🗑️ Sell
  </button>
</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>Buy a Stock</h2>
            <div style={{ maxWidth: '400px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
                  Stock Symbol (like AAPL for Apple)
                </label>
                <input
                  type="text"
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '6px' }}
                  placeholder="AAPL"
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
                  Number of Shares
                </label>
                <input
                  type="number"
                  value={newStock.shares || ''}
                  onChange={(e) => setNewStock({...newStock, shares: e.target.value})}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '6px' }}
                  placeholder="10"
                />
              </div>
              
                            
              {newStock.shares > 0 && (
  <div style={{ backgroundColor: '#1E3A8A', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
    <p style={{ fontSize: '14px', color: '#93C5FD', marginBottom: '5px' }}>
      Price will be fetched automatically when you click "Buy Stock"
    </p>
  </div>
)}
              
              <button
                onClick={addStock}
                style={{ width: '100%', padding: '12px', backgroundColor: '#6B46C1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ➕ Buy Stock (Fetch Real Price)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'learn' && (
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>📚 Learn About Investing</h2>
            
            <div style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '20px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '10px' }}>
                What is a Stock? 📈
              </h3>
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                A stock is like owning a tiny piece of a company! When you buy Apple stock (AAPL), 
                you own a small part of Apple. If the company does well, your stock becomes worth more money!
              </p>
            </div>
            
            <div style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', padding: '20px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534', marginBottom: '10px' }}>
                Why Save Money? 🐷
              </h3>
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                When you save money regularly, it grows over time. This is called "compound interest" - 
                you earn money on your money! Even small amounts add up to big numbers over the years.
              </p>
            </div>
            
            <div style={{ backgroundColor: '#F5F3FF', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#5B21B6', marginBottom: '10px' }}>
                Tips for Young Investors 💡
              </h3>
              <ul style={{ color: '#374151', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Start early - even small amounts matter!</li>
                <li>Don't put all your money in one place</li>
                <li>Think long-term - investing is like planting a tree</li>
                <li>Learn about companies before investing</li>
                <li>Be patient - good things take time!</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;