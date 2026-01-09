import React, { useState, useEffect } from 'react';

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

  const addCash = () => {
  const amount = prompt('How much cash do you want to add?');
  if (amount && !isNaN(amount)) {
    setCash(cash + parseFloat(amount));
  }
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

  const addStock = () => {
    if (newStock.symbol && newStock.shares > 0 && newStock.price > 0) {
      const cost = newStock.shares * newStock.price;
      if (cost <= cash) {
        setPortfolio([...portfolio, {
          id: Date.now(),
          symbol: newStock.symbol.toUpperCase(),
          name: newStock.symbol.toUpperCase(),
          shares: parseFloat(newStock.shares),
          buyPrice: parseFloat(newStock.price),
          currentPrice: parseFloat(newStock.price)
        }]);
        setCash(cash - cost);
        setNewStock({ symbol: '', shares: 0, price: 0 });
      } else {
        alert("Not enough cash!");
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#6B46C1', fontSize: '32px', marginBottom: '10px' }}>
            📈 Abby's Investment Tracker
          </h1>
          <p style={{ color: '#666' }}>Learn about stocks and saving money! 🚀</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['portfolio', 'add', 'learn'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#6B46C1' : 'white',
                color: activeTab === tab ? 'white' : '#666',
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

            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>My Stocks</h2>
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
      cursor: 'pointer',
      marginBottom: '15px'
    }}
  >
    🗑️ Sell All Stocks
  </button>
)}
              {portfolio.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  No stocks yet! Click "Buy Stock" to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {portfolio.map(stock => {
                    const gainLoss = stock.shares * (stock.currentPrice - stock.buyPrice);
                    const gainLossPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice * 100).toFixed(1);
                    return (
                      <div key={stock.id} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>{stock.symbol}</h3>
                          <p style={{ fontSize: '14px', color: '#666' }}>
                            {stock.shares} shares × ${stock.currentPrice} = ${(stock.shares * stock.currentPrice).toFixed(2)}
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
                        <button
                          onClick={() => removeStock(stock.id)}
                          style={{ padding: '8px 12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' }}
                        >
                          🗑️ Sell
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>Buy a Stock</h2>
            <div style={{ maxWidth: '400px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
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
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Price per Share ($)
                </label>
                <input
                  type="number"
                  value={newStock.price || ''}
                  onChange={(e) => setNewStock({...newStock, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '6px' }}
                  placeholder="150.00"
                />
              </div>
              
              {newStock.shares > 0 && newStock.price > 0 && (
                <div style={{ backgroundColor: '#EFF6FF', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Cost:</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3B82F6' }}>
                    ${(newStock.shares * newStock.price).toFixed(2)}
                  </p>
                </div>
              )}
              
              <button
                onClick={addStock}
                style={{ width: '100%', padding: '12px', backgroundColor: '#6B46C1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ➕ Buy Stock
              </button>
            </div>
          </div>
        )}

        {activeTab === 'learn' && (
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>📚 Learn About Investing</h2>
            
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