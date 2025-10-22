import os
import json
import requests
from flask import Flask, render_template, jsonify
from datetime import datetime, timedelta

app = Flask(__name__)

# --- IMPORTANT ---
# PASTE YOUR API KEY HERE
API_KEY = "sk-live-0qGBSVYjo8HZHwwxBBZSm3I26mhexFm9sDdIY0Sy"
# ---------------

API_URL = "https://stock.indianapi.in/stock"
HEADERS = {"x-api-key": API_KEY}
CACHE_FILE = "cache.json"

# --- Caching Functions ---
def read_cache():
    """Reads the JSON cache file."""
    try:
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def write_cache(cache_data):
    """Writes data to the JSON cache file."""
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache_data, f, indent=4)
# -------------------------


@app.route('/')
def landing():
    """Serves the new landing page."""
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    """Serves the main dashboard page."""
    return render_template('index.html')

@app.route('/about')
def about():
    """Serves the about page."""
    return render_template('about.html')

@app.route('/contact')
def contact():
    """Serves the contact page."""
    return render_template('contact.html')


@app.route('/search/<ticker>')
def search(ticker):
    """Fetches comprehensive data for a stock ticker, using a cache."""
    try_ticker = ticker.upper()
    cache = read_cache()

    # Check if ticker is in cache
    if try_ticker in cache:
        print(f"Cache hit for {try_ticker}")
        return jsonify(cache[try_ticker])
    
    print(f"Cache miss for {try_ticker}. Fetching from API...")
    
    try:
        response = requests.get(API_URL, headers=HEADERS, params={"name": try_ticker})
        response.raise_for_status()
        api_data = response.json()

        if not api_data or "companyName" not in api_data:
            return jsonify({"error": "Invalid ticker or no data available."}), 404

        # Parse and structure the data as before...
        details = api_data.get('stockDetailsReusableData', {})
        profile = api_data.get('companyProfile', {})
        peer_list = profile.get('peerCompanyList', [])
        main_company_peer = next((p for p in peer_list if p.get('companyName') == api_data.get('companyName')), {})

        chart_data = []
        technical_data = api_data.get('stockTechnicalData', [])
        today = datetime.now()
        chart_data.append({'x': int(today.timestamp() * 1000), 'y': float(details.get('price', 0))})
        for item in sorted(technical_data, key=lambda d: d['days']):
            past_date = today - timedelta(days=item['days'])
            chart_data.append({'x': int(past_date.timestamp() * 1000), 'y': float(item.get('nsePrice', 0))})
        chart_data.reverse()

        ownership_data = []
        for item in api_data.get('shareholding', []):
            if item.get('displayName') in ['Promoter', 'FII', 'MF']:
                latest_holding = item.get('categories', [{}])[0].get('percentage', '0')
                ownership_data.append({"name": item.get('displayName'), "value": float(latest_holding)})

        key_metrics = api_data.get('keyMetrics', {}).get('valuation', [])
        pe_ratio = next((m.get('value') for m in key_metrics if m.get('key') == 'pPerEBasicExcludingExtraordinaryItemsTTM'), 'N/A')
        pb_ratio = next((m.get('value') for m in key_metrics if m.get('key') == 'priceToBookMostRecentQuarter'), 'N/A')
        
        recent_news = api_data.get('recentNews', [])[:3]
        recos_bar = api_data.get('recosBar', {})

        # This is the final structured data
        data = {
            "profile": {"name": api_data.get('companyName'),"logo": main_company_peer.get('imageUrl'),"ticker": try_ticker},
            "chart": chart_data,
            "quote": {"market_cap": details.get('marketCap'),"high": float(details.get('high', 0)),"low": float(details.get('low', 0)),"prev_close": float(details.get('close', 0)),"current": float(details.get('price', 0))},
            "ownership": ownership_data,
            "metrics": {"pe": pe_ratio, "pb": pb_ratio, "risk": api_data.get('riskMeter', {}).get('categoryName', 'N/A')},
            "news": recent_news,
            "analyst": {"mean": recos_bar.get('meanValue'), "total": recos_bar.get('noOfRecommendations')}
        }
        
        # Save the new data to the cache before returning
        cache[try_ticker] = data
        write_cache(cache)
        
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        print(f"API Error fetching data for {ticker}: {e}")
        return jsonify({"error": "Failed to fetch data from API. The ticker may be invalid."}), 500
    except Exception as e:
        print(f"Server Error for {ticker}: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)