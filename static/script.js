document.addEventListener('DOMContentLoaded', () => {
    // Get all DOM elements
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('ticker-search');
    const messageArea = document.getElementById('message-area');

    const dataElements = {
        headerInfo: document.getElementById('data-header-info'), headerPrice: document.getElementById('data-header-price'),
        marketCap: document.getElementById('data-quote-market-cap'), high: document.getElementById('data-quote-high'),
        low: document.getElementById('data-quote-low'), prevClose: document.getElementById('data-quote-prev-close'),
        pe: document.getElementById('data-metric-pe'), pb: document.getElementById('data-metric-pb'),
        risk: document.getElementById('data-metric-risk'), analystRating: document.getElementById('data-analyst-rating'),
        newsList: document.getElementById('data-news-list'), mainChart: document.getElementById('chart'),
        ownershipChart: document.getElementById('ownership-chart')
    };
    const placeholderElements = {
        headerInfo: document.getElementById('placeholder-header-info'), headerPrice: document.getElementById('placeholder-header-price'),
        marketCap: document.getElementById('placeholder-quote-market-cap'), high: document.getElementById('placeholder-quote-high'),
        low: document.getElementById('placeholder-quote-low'), prevClose: document.getElementById('placeholder-quote-prev-close'),
        pe: document.getElementById('placeholder-metric-pe'), pb: document.getElementById('placeholder-metric-pb'),
        risk: document.getElementById('placeholder-metric-risk'), analystRating: document.getElementById('placeholder-analyst-rating'),
        newsList: document.getElementById('placeholder-news-list'), mainChart: document.getElementById('placeholder-chart'),
        ownershipChart: document.getElementById('placeholder-ownership-chart')
    };

    let mainChart, ownershipChart;

    // Chart Configurations
    const mainChartOptions = { series: [{ name: 'Price', data: [] }], chart: { type: 'line', height: 450, background: 'transparent', toolbar: { show: true, tools: { download: false, pan: true, zoom: true } }, zoom: { type: 'x', enabled: true, autoScaleYaxis: true } }, dataLabels: { enabled: false }, stroke: { curve: 'smooth' }, theme: { mode: 'dark' }, title: { text: 'Stock Price Trend', align: 'left', style: { fontSize: '18px', color: '#e0e0e0' } }, xaxis: { type: 'datetime', labels: { style: { colors: '#888' } } }, yaxis: { tooltip: { enabled: true }, labels: { style: { colors: '#888' }, formatter: (val) => `₹${val !== undefined ? val.toFixed(2) : '0.00'}` } }, grid: { borderColor: '#555', strokeDashArray: 3 }, tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } } };
    const ownershipChartOptions = { series: [], chart: { type: 'pie', height: 300, background: 'transparent' }, labels: [], theme: { mode: 'dark' }, title: { text: 'Ownership Structure', align: 'left', style: { fontSize: '18px', color: '#e0e0e0' } }, legend: { position: 'bottom', labels: { colors: '#e0e0e0' } }, responsive: [{ breakpoint: 480, options: { chart: { width: 250 }, legend: { position: 'bottom' } } }] };

    // Initialize Charts
    mainChart = new ApexCharts(dataElements.mainChart, mainChartOptions);
    ownershipChart = new ApexCharts(dataElements.ownershipChart, ownershipChartOptions);
    mainChart.render();
    ownershipChart.render();

    // UI State Function
    const toggleElements = (state) => {
        const isDataState = state === 'data';
        Object.values(dataElements).forEach(el => el.classList.toggle('hidden', !isDataState));
        Object.values(placeholderElements).forEach(el => el.classList.toggle('hidden', isDataState));
    };

    toggleElements('placeholders'); // Set initial state

    // Event Listener
    searchBtn.addEventListener('click', () => {
        const ticker = searchInput.value.trim().toUpperCase();
        if (ticker) fetchStockData(ticker);
    });

    // Data Fetching and UI Update
    async function fetchStockData(ticker) {
        setMessage('Loading data...', 'text-cyan-400');
        toggleElements('placeholders');

        try {
            const response = await fetch(`/search/${ticker}`);
            if (!response.ok) throw new Error((await response.json()).error || 'Data not found');
            const data = await response.json();
            
            updateDashboardUI(data);
            toggleElements('data'); // This is the crucial fix
            setMessage('');
        } catch (error) {
            console.error('Error:', error);
            setMessage(error.message, 'text-red-400');
            toggleElements('placeholders'); // Revert to placeholders on error
        }
    }
    
    function updateDashboardUI(data) {
        // Header
        document.getElementById('data-company-logo').src = data.profile.logo || 'https://placehold.co/64x64/313b4e/7689ab?text=IN';
        document.getElementById('data-company-name').innerText = data.profile.name;
        document.getElementById('data-company-ticker').innerText = data.profile.ticker;
        updatePriceDisplay(document.getElementById('data-current-price'), data.quote.current, data.quote.prev_close);

        // Cards & Metrics
        dataElements.marketCap.innerText = data.quote.market_cap ? `₹${data.quote.market_cap} Cr` : 'N/A';
        dataElements.high.innerText = `₹${data.quote.high.toFixed(2)}`;
        dataElements.low.innerText = `₹${data.quote.low.toFixed(2)}`;
        dataElements.prevClose.innerText = `₹${data.quote.prev_close.toFixed(2)}`;
        dataElements.pe.innerText = data.metrics.pe;
        dataElements.pb.innerText = data.metrics.pb;
        dataElements.risk.innerText = data.metrics.risk;
        
        // Analyst Rating
        updateAnalystRating(data.analyst);

        // News
        dataElements.newsList.innerHTML = data.news.map(n => `<a href="${n.url}" target="_blank" class="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"><p class="font-semibold truncate">${n.headline}</p><p class="text-xs text-gray-400">${n.byline || 'Source'} - ${new Date(n.date).toLocaleDateString()}</p></a>`).join('');

        // Charts
        mainChart.updateSeries([{ data: data.chart }]);
        ownershipChart.updateOptions({ series: data.ownership.map(o => o.value), labels: data.ownership.map(o => o.name) });
    }

    // Helper functions (no changes)
    function updateAnalystRating(analyst) { const ratingMap = { 1: 'Strong Buy', 2: 'Buy', 3: 'Hold', 4: 'Sell', 5: 'Strong Sell' }; const colorMap = { 1: 'from-green-500 to-green-400', 2: 'from-emerald-500 to-emerald-400', 3: 'from-yellow-500 to-yellow-400', 4: 'from-red-500 to-red-400', 5: 'from-rose-500 to-rose-400'}; const mean = analyst.mean || 3; const ratingText = ratingMap[Math.round(mean)] || 'Hold'; const barWidth = ((5 - mean) / 4) * 100; document.getElementById('analyst-rating-text').innerText = ratingText; document.getElementById('analyst-rating-count').innerText = `Based on ${analyst.total} analysts`; const bar = document.getElementById('analyst-rating-bar'); bar.style.width = `${barWidth}%`; bar.className = `bg-gradient-to-r h-2.5 rounded-full ${colorMap[Math.round(mean)] || colorMap[3]}`; }
    function updatePriceDisplay(element, current, prevClose) { element.innerText=`₹${current.toFixed(2)}`; const pc=parseFloat(prevClose),c=parseFloat(current); if(c>pc)element.className='text-5xl font-bold text-green-400 transition-colors duration-300'; else if(c<pc)element.className='text-5xl font-bold text-red-400 transition-colors duration-300'; else element.className='text-5xl font-bold text-gray-400 transition-colors duration-300'; }
    function setMessage(message, colorClass = 'text-red-400') { messageArea.innerText=message; messageArea.className=`h-6 mt-2 text-sm ${colorClass}`; }
});