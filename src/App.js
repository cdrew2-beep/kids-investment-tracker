import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const [savings, setSavings] = useState({
  initial: 1000,
  monthly: 100,
  years: 10,
  rate: 7
});

const [watchlist, setWatchlist] = useState(() => {
  const saved = localStorage.getItem('watchlist');
  return saved ? JSON.parse(saved) : [];
});

const [watchlistLoading] = useState(false);
const [researchSymbol, setResearchSymbol] = useState('');
const [researchData, setResearchData] = useState(null);
const [researchLoading, setResearchLoading] = useState(false);


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

const researchStock = async () => {
  console.log('=== RESEARCH STOCK STARTED ===');
  console.log('Symbol:', researchSymbol);
  
  if (!researchSymbol) {
    alert('Please enter a stock symbol');
    return;
  }
  
  setResearchLoading(true);
  
  try {
    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key (partial):', apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 'MISSING');
    
    // STEP 1: Get current price
    console.log('STEP 1: Fetching price data...');
    const priceUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${researchSymbol.toUpperCase()}&apikey=${apiKey}`;
    
    const priceResponse = await axios.get(priceUrl);
    console.log('Price API Response:', priceResponse.data);
    
    const priceData = priceResponse.data['Global Quote'];
    
    if (!priceData || !priceData['05. price']) {
      console.log('❌ ERROR: No price data found');
      alert('Stock not found! Try another symbol.');
      setResearchLoading(false);
      setResearchData(null);
      return;
    }
    
    console.log('✅ Price fetched successfully:', priceData['05. price']);
    
    // STEP 2: Wait before second API call
    console.log('STEP 2: Waiting 15 seconds to avoid rate limit...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // STEP 3: Get company overview
    console.log('STEP 3: Fetching company overview data...');
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${researchSymbol.toUpperCase()}&apikey=${apiKey}`;
    
    const overviewResponse = await axios.get(overviewUrl);
    console.log('Overview API Response:', overviewResponse.data);
    
    const overview = overviewResponse.data;
    
    // Check for rate limit
    if (overview.Note) {
      console.log('❌ RATE LIMIT hit on overview call');
      alert('⚠️ API rate limit reached. Wait 60 seconds and try again.');
      setResearchLoading(false);
      return;
    }
    
    // Check if we got any data
    if (!overview.Symbol && Object.keys(overview).length === 0) {
      console.log('❌ Overview returned empty object');
      alert('⚠️ No company data available. Your API key may not have access to OVERVIEW endpoint.');
      setResearchLoading(false);
      return;
    }
    
    // Log what we got
    console.log('Overview data received:');
    console.log('  Name:', overview.Name || 'N/A');
    console.log('  Sector:', overview.Sector || 'N/A');
    console.log('  Industry:', overview.Industry || 'N/A');
    console.log('  MarketCap:', overview.MarketCapitalization || 'N/A');
    console.log('  PE Ratio:', overview.PERatio || 'N/A');
    console.log('  Description length:', overview.Description ? overview.Description.length : 0);
    console.log('  All keys:', Object.keys(overview).slice(0, 10).join(', '));
    
    // Set the data
    setResearchData({
      symbol: researchSymbol.toUpperCase(),
      price: parseFloat(priceData['05. price']),
      change: parseFloat(priceData['09. change']),
      changePercent: priceData['10. change percent'],
      volume: priceData['06. volume'],
      previousClose: parseFloat(priceData['08. previous close']),
      open: parseFloat(priceData['02. open']),
      high: parseFloat(priceData['03. high']),
      low: parseFloat(priceData['04. low']),
      // Company info
      name: overview.Name || researchSymbol.toUpperCase(),
      description: overview.Description || 'Company information not available.',
      sector: overview.Sector || 'N/A',
      industry: overview.Industry || 'N/A',
      marketCap: overview.MarketCapitalization || 'N/A',
      peRatio: overview.PERatio || 'N/A',
      dividendYield: overview.DividendYield || 'N/A',
      week52High: overview['52WeekHigh'] || 'N/A',
      week52Low: overview['52WeekLow'] || 'N/A'
    });
    
    console.log('✅ Research data set successfully');
    console.log('=== RESEARCH COMPLETE ===');
    
  } catch (error) {
    console.error('❌ EXCEPTION ERROR:', error);
    alert('Error loading stock data. Check console (F12) for details.');
    setResearchData(null);
  }
  
  setResearchLoading(false);
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

const calculateSavings = () => {
  const { initial, monthly, years, rate } = savings;
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  
  // Calculate future value with compound interest
  let futureValue = initial;
  
  // Add monthly contributions with compound interest
  for (let i = 0; i < months; i++) {
    futureValue = futureValue * (1 + monthlyRate) + monthly;
  }
  
  const totalContributions = initial + (monthly * months);
  const totalInterest = futureValue - totalContributions;
  
  return {
    futureValue: futureValue,
    totalContributions: totalContributions,
    totalInterest: totalInterest
  };
};

  // Save cash whenever it changes
  useEffect(() => {
    localStorage.setItem('cash', cash.toString());
  }, [cash]);

  // Save portfolio whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

useEffect(() => {
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}, [watchlist]);

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
  currentPrice: realPrice,
  notes: '',
  buyDate: new Date().toISOString()
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


  const addToWatchlist = async (symbol) => {
  if (!symbol) {
    alert('Please enter a stock symbol');
    return;
  }
  
  // Check if already in watchlist
  if (watchlist.find(item => item.symbol === symbol.toUpperCase())) {
    alert(`${symbol.toUpperCase()} is already in your watchlist!`);
    return;
  }
  
  // Fetch current price
setResearchLoading(true);
const price = await fetchStockPrice(symbol.toUpperCase());
setResearchLoading(false);
  
  if (price) {
    const newItem = {
      id: Date.now(),
      symbol: symbol.toUpperCase(),
      addedDate: new Date().toISOString(),
      addedPrice: price,
      currentPrice: price
    };
    
    setWatchlist([...watchlist, newItem]);
    alert(`✅ ${symbol.toUpperCase()} added to watchlist at $${price.toFixed(2)}`);
  }
};

const removeFromWatchlist = (id) => {
  if (window.confirm('Remove this stock from your watchlist?')) {
    setWatchlist(watchlist.filter(item => item.id !== id));
  }
};

const refreshWatchlistPrices = async () => {
  if (watchlist.length === 0) {
    alert('Your watchlist is empty!');
    return;
  }
  
  const confirmed = window.confirm(`Refresh prices for ${watchlist.length} stocks?\n\nThis will take about ${watchlist.length * 15} seconds.`);
  if (!confirmed) return;
  
  const updatedWatchlist = [];
  
  for (let i = 0; i < watchlist.length; i++) {
    const item = watchlist[i];
    console.log(`Refreshing ${i + 1}/${watchlist.length}: ${item.symbol}`);
    
    const newPrice = await fetchStockPrice(item.symbol);
    
    if (newPrice) {
      updatedWatchlist.push({
        ...item,
        currentPrice: newPrice
      });
      console.log(`✅ ${item.symbol}: $${newPrice}`);
    } else {
      updatedWatchlist.push(item);
      console.log(`❌ ${item.symbol}: Failed, keeping old price`);
    }
    
    // Wait 15 seconds before next call
    if (i < watchlist.length - 1) {
      console.log('⏰ Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  setWatchlist(updatedWatchlist);
  alert('✅ Watchlist prices updated!');
};


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
          {['portfolio', 'watchlist', 'research', 'add', 'savings', 'charts', 'learn'].map(tab => (
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
              {tab === 'watchlist' && '👁️ Watchlist'}
              {tab === 'research' && '🔍 Research'}
              {tab === 'add' && '➕ Buy Stock'}
              {tab === 'savings' && '💰 Savings'}
              {tab === 'charts' && '📈 Charts'}
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



{activeTab === 'watchlist' && (
  <div>
    {/* Add to Watchlist */}
    <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#F1F5F9' }}>
        👁️ Stock Watchlist
      </h2>
      <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
        Track stocks you're interested in before buying!
      </p>
      
      <div style={{ maxWidth: '500px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newStock.symbol}
            onChange={(e) => setNewStock({...newStock, symbol: e.target.value.toUpperCase()})}
            onKeyPress={(e) => e.key === 'Enter' && addToWatchlist(newStock.symbol)}
            placeholder="Enter stock symbol (e.g., AAPL)"
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #334155',
              borderRadius: '6px',
              backgroundColor: '#0F172A',
              color: '#F1F5F9'
            }}
          />
          <button
            onClick={() => addToWatchlist(newStock.symbol)}
            disabled={watchlistLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: watchlistLoading ? '#64748B' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: watchlistLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {watchlistLoading ? '⏳ Adding...' : '➕ Add to Watchlist'}
          </button>
        </div>
      </div>
      
      {watchlist.length > 0 && (
        <button
          onClick={refreshWatchlistPrices}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          🔄 Refresh All Prices
        </button>
      )}
      
      {/* Watchlist Items */}
      {watchlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
          <p style={{ fontSize: '18px' }}>Your watchlist is empty!</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Add stocks you're interested in to track their prices over time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {watchlist.map(item => {
            const priceChange = item.currentPrice - item.addedPrice;
            const priceChangePercent = ((priceChange / item.addedPrice) * 100).toFixed(2);
            const addedDate = new Date(item.addedDate).toLocaleDateString();
            
            return (
              <div key={item.id} style={{ backgroundColor: '#0F172A', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '5px' }}>
                    {item.symbol}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                    Added on {addedDate}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div>
                      <p style={{ color: '#94A3B8', marginBottom: '3px' }}>Added at</p>
                      <p style={{ color: '#F1F5F9', fontWeight: 'bold' }}>${item.addedPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ color: '#94A3B8', marginBottom: '3px' }}>Current</p>
                      <p style={{ color: '#F1F5F9', fontWeight: 'bold' }}>${item.currentPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ color: '#94A3B8', marginBottom: '3px' }}>Change</p>
                      <p style={{ 
                        color: priceChange >= 0 ? '#10B981' : '#EF4444', 
                        fontWeight: 'bold' 
                      }}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                  <button
                    onClick={() => {
                      setActiveTab('research');
                      setResearchSymbol(item.symbol);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🔍 Research
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(item.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    
    {/* Educational Info */}
    <div style={{ backgroundColor: '#1E3A8A', border: '1px solid #1E40AF', borderRadius: '8px', padding: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#DBEAFE', marginBottom: '10px' }}>
        💡 How to Use Your Watchlist
      </h3>
      <ul style={{ color: '#93C5FD', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
        <li>Add stocks you're interested in but not ready to buy yet</li>
        <li>Track how prices change over time before investing</li>
        <li>Compare the current price to when you added it</li>
        <li>Click "Research" to learn more about the company</li>
        <li>When you're ready, go to "Buy Stock" to purchase!</li>
      </ul>
    </div>
  </div>
)}




{activeTab === 'research' && (
  <div>
    <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '24px', color: '#F1F5F9' }}>🔍 Research a Stock</h2>
      <p style={{ color: '#94A3B8', marginBottom: '20px' }}>Look up any stock to learn more before investing!</p>
      
      <div style={{ maxWidth: '500px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={researchSymbol}
            onChange={(e) => setResearchSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && researchStock()}
            placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #334155',
              borderRadius: '6px',
              backgroundColor: '#0F172A',
              color: '#F1F5F9'
            }}
          />
          <button
            onClick={researchStock}
            disabled={researchLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: researchLoading ? '#64748B' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: researchLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {researchLoading ? '⏳ Loading...' : '🔍 Research'}
          </button>
        </div>
      </div>
      
      {researchData && (
        <div>
          {/* Company Header */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '5px' }}>
              {researchData.name}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '16px', marginBottom: '15px' }}>
              {researchData.symbol} • {researchData.sector} • {researchData.industry}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '10px' }}>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#10B981' }}>
                ${researchData.price.toFixed(2)}
              </p>
              <p style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: researchData.change >= 0 ? '#10B981' : '#EF4444' 
              }}>
                {researchData.change >= 0 ? '+' : ''}{researchData.change.toFixed(2)} 
                ({researchData.changePercent})
              </p>
            </div>
          </div>
          
          {/* What Does This Company Do? */}
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '10px' }}>
              🏢 What Does {researchData.symbol} Do?
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8' }}>
              {researchData.description}
            </p>
          </div>
          
          {/* Key Metrics */}
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '15px' }}>
              📊 Key Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>Market Cap</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  ${researchData.marketCap !== 'N/A' ? (parseFloat(researchData.marketCap) / 1000000000).toFixed(2) + 'B' : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>P/E Ratio</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  {researchData.peRatio !== 'N/A' ? parseFloat(researchData.peRatio).toFixed(2) : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>Dividend Yield</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  {researchData.dividendYield !== 'N/A' ? (parseFloat(researchData.dividendYield) * 100).toFixed(2) + '%' : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>52-Week High</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  ${researchData.week52High !== 'N/A' ? parseFloat(researchData.week52High).toFixed(2) : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>52-Week Low</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  ${researchData.week52Low !== 'N/A' ? parseFloat(researchData.week52Low).toFixed(2) : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '5px' }}>Today's Volume</p>
                <p style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 'bold' }}>
                  {researchData.volume ? (parseInt(researchData.volume) / 1000000).toFixed(2) + 'M' : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* What These Numbers Mean */}
          <div style={{ backgroundColor: '#1E3A8A', border: '1px solid #1E40AF', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#DBEAFE', marginBottom: '15px' }}>
              📚 What These Numbers Mean
            </h3>
            <div style={{ color: '#93C5FD', fontSize: '14px', lineHeight: '1.8' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#DBEAFE' }}>Market Cap:</strong> The total value of all the company's shares. Bigger = larger company.
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#DBEAFE' }}>P/E Ratio:</strong> Price-to-Earnings ratio. Shows if a stock is expensive or cheap compared to its profits. Lower can be better!
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#DBEAFE' }}>Dividend Yield:</strong> How much the company pays you each year just for owning the stock! Like earning interest.
              </p>
              <p>
                <strong style={{ color: '#DBEAFE' }}>52-Week High/Low:</strong> The highest and lowest prices this year. Shows how much the stock moves around.
              </p>
            </div>
          </div>
          
          {/* Questions to Ask */}
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '15px' }}>
              💭 Questions to Think About
            </h3>
            <ul style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
              <li>Do I understand what {researchData.symbol} does?</li>
              <li>Do I use their products or services?</li>
              <li>Is the company in an industry I believe in? ({researchData.industry})</li>
              <li>Am I comfortable if the price goes down temporarily?</li>
              <li>Would I be happy owning this for 5+ years?</li>
              <li>Does the P/E ratio seem reasonable compared to other companies?</li>
            </ul>
          </div>
        </div>
      )}
    </div>
    
    {/* Popular Stocks */}
    <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', border: '1px solid #334155' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '15px' }}>
        🌟 Popular Stocks to Research
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
        {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'DIS', 'NKE', 'WMT', 'JPM'].map(symbol => (
          <button
            key={symbol}
            onClick={() => {
              setResearchSymbol(symbol);
              researchStock();
            }}
            style={{
              padding: '12px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F1F5F9',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
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

{activeTab === 'savings' && (
  <div>
    <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#F1F5F9' }}>
        💰 Savings Calculator
      </h2>
      <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
        See how your money can grow over time with compound interest!
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Input Section */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>
            📝 Your Plan
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
              Starting Amount ($)
            </label>
            <input
              type="number"
              value={savings.initial}
              onChange={(e) => setSavings({...savings, initial: parseFloat(e.target.value) || 0})}
              style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #334155', borderRadius: '6px', backgroundColor: '#0F172A', color: '#F1F5F9' }}
            />
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px' }}>
              How much money do you have now?
            </p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
              Monthly Savings ($)
            </label>
            <input
              type="number"
              value={savings.monthly}
              onChange={(e) => setSavings({...savings, monthly: parseFloat(e.target.value) || 0})}
              style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #334155', borderRadius: '6px', backgroundColor: '#0F172A', color: '#F1F5F9' }}
            />
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px' }}>
              How much can you save each month?
            </p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
              Number of Years
            </label>
            <input
              type="number"
              value={savings.years}
              onChange={(e) => setSavings({...savings, years: parseFloat(e.target.value) || 0})}
              style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #334155', borderRadius: '6px', backgroundColor: '#0F172A', color: '#F1F5F9' }}
            />
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px' }}>
              How long will you save?
            </p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#F1F5F9' }}>
              Interest Rate (% per year)
            </label>
            <input
              type="number"
              step="0.1"
              value={savings.rate}
              onChange={(e) => setSavings({...savings, rate: parseFloat(e.target.value) || 0})}
              style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #334155', borderRadius: '6px', backgroundColor: '#0F172A', color: '#F1F5F9' }}
            />
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px' }}>
              Average stock market return is ~7-10% per year
            </p>
          </div>
        </div>
        
        {/* Results Section */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>
            🎯 Your Results
          </h3>
          
          {(() => {
            const results = calculateSavings();
            return (
              <>
                <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '10px', padding: '25px', marginBottom: '20px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '10px' }}>
                    Your Money Will Grow To:
                  </p>
                  <p style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', marginBottom: '0' }}>
                    ${results.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
                    <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>
                      💵 Total You Saved
                    </p>
                    <p style={{ color: '#F1F5F9', fontSize: '24px', fontWeight: 'bold' }}>
                      ${results.totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
                    <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>
                      ✨ Interest Earned (Free Money!)
                    </p>
                    <p style={{ color: '#10B981', fontSize: '24px', fontWeight: 'bold' }}>
                      ${results.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>
                      📊 Interest as % of Total
                    </p>
                    <p style={{ color: '#A78BFA', fontSize: '24px', fontWeight: 'bold' }}>
                      {((results.totalInterest / results.futureValue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#1E3A8A', border: '1px solid #1E40AF', borderRadius: '10px', padding: '15px', marginTop: '20px' }}>
                  <p style={{ color: '#93C5FD', fontSize: '14px', lineHeight: '1.6' }}>
                    💡 <strong style={{ color: '#DBEAFE' }}>What this means:</strong> If you start with ${savings.initial.toLocaleString()} and save ${savings.monthly.toLocaleString()} every month for {savings.years} years, you'll have <strong style={{ color: '#DBEAFE' }}>${results.futureValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>! That includes ${results.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })} in interest that you didn't have to work for!
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
    
    {/* Educational Section */}
    <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>
        🧠 Understanding Compound Interest
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ color: '#10B981', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            🌱 What is Compound Interest?
          </h4>
          <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
            It's when you earn interest on your interest! Your money grows faster and faster over time, like a snowball rolling down a hill.
          </p>
        </div>
        
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ color: '#3B82F6', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            ⏰ Why Start Early?
          </h4>
          <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
            The earlier you start, the more time your money has to grow. Starting at 10 vs 20 can mean TENS OF THOUSANDS more dollars!
          </p>
        </div>
        
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ color: '#A78BFA', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            🎯 The Secret to Wealth
          </h4>
          <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
            Save regularly + Give it time + Let compound interest work = Financial freedom! Even small amounts add up to big results.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'charts' && (
  <div>
    {portfolio.length === 0 ? (
      <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <p style={{ color: '#94A3B8', fontSize: '18px' }}>
          📊 No data to visualize yet!<br />
          Buy some stocks to see beautiful charts.
        </p>
      </div>
    ) : (
      <>
        {/* Asset Allocation Pie Chart */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#F1F5F9' }}>
            🥧 Portfolio Allocation
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
            See how your money is distributed across different stocks
          </p>
          
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={portfolio.map(stock => ({
                  name: stock.symbol,
                  value: stock.shares * stock.currentPrice
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {portfolio.map((entry, index) => {
                  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F1F5F9' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Legend 
                wrapperStyle={{ color: '#F1F5F9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Stock Performance Bar Chart */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#F1F5F9' }}>
            📊 Stock Performance
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
            Compare how each stock is performing
          </p>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={portfolio.map(stock => ({
              name: stock.symbol,
              'Total Value': stock.shares * stock.currentPrice,
              'Profit/Loss': stock.shares * (stock.currentPrice - stock.buyPrice),
              'Buy Cost': stock.shares * stock.buyPrice
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#F1F5F9' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ color: '#F1F5F9' }} />
              <Bar dataKey="Buy Cost" fill="#64748B" />
              <Bar dataKey="Total Value" fill="#3B82F6" />
              <Bar dataKey="Profit/Loss" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Statistics */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#F1F5F9' }}>
            📈 Portfolio Statistics
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>Total Stocks</p>
              <p style={{ color: '#F1F5F9', fontSize: '28px', fontWeight: 'bold' }}>{portfolio.length}</p>
            </div>
            
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>Total Shares</p>
              <p style={{ color: '#F1F5F9', fontSize: '28px', fontWeight: 'bold' }}>
                {portfolio.reduce((sum, stock) => sum + stock.shares, 0)}
              </p>
            </div>
            
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>Average Gain/Loss</p>
              <p style={{ color: totalGainLoss >= 0 ? '#10B981' : '#EF4444', fontSize: '28px', fontWeight: 'bold' }}>
                {((totalGainLoss / totalValue) * 100).toFixed(1)}%
              </p>
            </div>
            
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '5px' }}>Best Performer</p>
              <p style={{ color: '#10B981', fontSize: '28px', fontWeight: 'bold' }}>
                {portfolio.length > 0 ? 
                  portfolio.reduce((best, stock) => {
                    const gain = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
                    const bestGain = ((best.currentPrice - best.buyPrice) / best.buyPrice) * 100;
                    return gain > bestGain ? stock : best;
                  }).symbol 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </>
    )}
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