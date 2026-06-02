import os
import logging
import asyncio
from datetime import datetime
import json
import httpx
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)

async def fetch_market_data():
    """
    Fetches raw market numbers: USD/IDR exchange rate and HRC Steel Prices (from Yahoo Finance).
    """
    logger.info("Fetching market data (USD/IDR and Steel Prices)...")
    market_data = {
        "usd_idr": 0,
        "steel_hrc": 0
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Fetch USD/IDR Exchange Rate
        try:
            er_resp = await client.get("https://open.er-api.com/v6/latest/USD")
            if er_resp.status_code == 200:
                data = er_resp.json()
                market_data["usd_idr"] = data.get("rates", {}).get("IDR", 0)
        except Exception as e:
            logger.error(f"Error fetching exchange rate: {e}")

        # 2. Fetch HRC Steel Futures (HRC=F) from Yahoo Finance
        try:
            # Yahoo finance requires a modern user agent
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            yf_resp = await client.get("https://query1.finance.yahoo.com/v8/finance/chart/HRC=F", headers=headers)
            if yf_resp.status_code == 200:
                data = yf_resp.json()
                market_data["steel_hrc"] = data['chart']['result'][0]['meta']['regularMarketPrice']
        except Exception as e:
            logger.error(f"Error fetching steel prices: {e}")

    return market_data

async def fetch_steel_news():
    """
    Scrapes steel manufacturing news with retry logic.
    """
    logger.info("Starting steel news scraper...")
    max_retries = 3
    
    for attempt in range(1, max_retries + 1):
        try:
            rss_url = "https://news.google.com/rss/search?q=HRC+steel+prices+OR+steel+manufacturing+industry+when:1d&hl=en-US&gl=US&ceid=US:en"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(rss_url, headers=headers)
                response.raise_for_status()
                
            root = ET.fromstring(response.text)
            news_items = []
            for item in root.findall('./channel/item')[:5]:  # Top 5 news
                title = item.find('title').text
                link = item.find('link').text
                pub_date = item.find('pubDate').text
                news_items.append({
                    "title": title,
                    "link": link,
                    "date": pub_date
                })
                
            return news_items
        except Exception as e:
            logger.warning(f"Steel news fetch attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)  # Exponential backoff: 2s, 4s
            else:
                logger.error(f"All {max_retries} attempts to fetch steel news failed")
                return []


def run_daily_scraper_sync():
    """Synchronous wrapper for the scheduler"""
    logger.info("Running daily scraper sync...")
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Run tasks concurrently
        news = loop.run_until_complete(fetch_steel_news())
        market_data = loop.run_until_complete(fetch_market_data())
        
        # Save payload to JSON for dashboard
        os.makedirs("/app/static", exist_ok=True)
        payload = {
            "updated_at": datetime.now().isoformat(), 
            "news": news,
            "market": market_data
        }
        with open("/app/static/latest_news.json", "w") as f:
            json.dump(payload, f)
            
        # Save into Knowledge Base for AI Retrieval
        from db import SessionLocal
        from models.knowledge import KnowledgeEntry
        from models.user import User  # Required for SQLAlchemy mapping
        
        db = SessionLocal()
        try:
            # Delete old daily news entries
            db.query(KnowledgeEntry).filter(KnowledgeEntry.source == "daily_news").delete()
            
            content = "DAILY MARKET INTELLIGENCE & NEWS:\n\n"
            content += f"**Market Data:**\n"
            content += f"- USD/IDR Exchange Rate: Rp {market_data['usd_idr']:,.2f}\n"
            content += f"- HRC Steel Price: ${market_data['steel_hrc']:,.2f} per short ton\n\n"
            content += "**News Headlines:**\n"
            
            if news:
                for n in news:
                    content += f"- {n['title']} ({n['date']})\n"
                
            entry = KnowledgeEntry(
                title=f"GYS Market Data & News - {datetime.now().strftime('%Y-%m-%d')}",
                content=content,
                department="Market Intelligence",
                category="News",
                source="daily_news",
            )
            db.add(entry)
            db.commit()
            logger.info("Saved daily market data and news to Knowledge Base.")
        except Exception as e:
            logger.error(f"Error saving to DB: {e}")
        finally:
            db.close()
            
    finally:
        loop.close()
