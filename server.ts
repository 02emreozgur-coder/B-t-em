import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SourceQuote {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  buyPrice: number;
  sellPrice: number;
  updatedAt: string;
}

interface MarketRate {
  code: string;
  name: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  changeRate: number;
  unit: string;
  isMetal?: boolean;
  sources: SourceQuote[];
}

interface ArbitrageRecord {
  id: string;
  assetCode: string;
  assetName: string;
  unit: string;
  buyFromSource: SourceQuote;
  sellToSource: SourceQuote;
  profitPerUnit: number;
  profitPercent: number;
  detectedAt: string;
  timeFormatted: string;
}

interface PriceHistoryPoint {
  timestamp: string;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  buyPrice: number;
  sellPrice: number;
  volume: number;
}

interface FirmPricePoint {
  timestamp: string;
  timeLabel: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
}

// In-memory cache for live rates and history
let liveRatesCache: MarketRate[] = [];
const priceHistoryStore: Record<string, PriceHistoryPoint[]> = {};
const firmPriceHistoryStore: Record<string, Record<string, FirmPricePoint[]>> = {};
let arbitrageHistoryStore: ArbitrageRecord[] = [];
let lastFetchTimestamp = 0;

// Default initial rates with the exact verified sources requested by user
const BASE_RATES: MarketRate[] = [
  {
    code: 'XAU',
    name: 'Has Altın (Gram 24K)',
    symbol: 'ALTIN',
    buyPrice: 6603.13,
    sellPrice: 6640.32,
    changeRate: +1.45,
    unit: 'gr',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 6605.50,
        sellPrice: 6623.50,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 6600.00,
        sellPrice: 6665.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 6595.50,
        sellPrice: 6623.50,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'altinkose',
        sourceName: 'Altınköşe Kuyumcu',
        sourceUrl: 'https://www.altinkose.com.tr/canli-altin-fiyatlari',
        sourceType: 'Canlı Altın Ekranı',
        buyPrice: 6615.00,
        sellPrice: 6645.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'vizyon',
        sourceName: 'Vizyon Kuyumcu',
        sourceUrl: 'https://fiyat.vizyonkuyumcu.com.tr/',
        sourceType: 'Socket Fiyat Yayını',
        buyPrice: 6617.00,
        sellPrice: 6646.50,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'CEY',
    name: 'Çeyrek Altın',
    symbol: 'ÇEYREK',
    buyPrice: 10523.42,
    sellPrice: 10694.35,
    changeRate: +1.20,
    unit: 'Adet',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 10486.85,
        sellPrice: 10683.71,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 10560.00,
        sellPrice: 10705.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'YRM',
    name: 'Yarım Altın',
    symbol: 'YARIM',
    buyPrice: 21079.82,
    sellPrice: 21319.78,
    changeRate: +1.15,
    unit: 'Adet',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 21039.65,
        sellPrice: 21294.55,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 21120.00,
        sellPrice: 21345.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'TAM',
    name: 'Tam Altın (Ziynet)',
    symbol: 'TAM',
    buyPrice: 42192.62,
    sellPrice: 42573.94,
    changeRate: +1.10,
    unit: 'Adet',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 42145.24,
        sellPrice: 42522.87,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 42240.00,
        sellPrice: 42625.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'ATA',
    name: 'Ata Lira (Cumhuriyet)',
    symbol: 'ATA',
    buyPrice: 43512.17,
    sellPrice: 43969.40,
    changeRate: +1.25,
    unit: 'Adet',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 43464.35,
        sellPrice: 43913.81,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 43560.00,
        sellPrice: 44025.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'GRM',
    name: '22 Ayar Gram Altın',
    symbol: '22AYAR',
    buyPrice: 6017.55,
    sellPrice: 6181.55,
    changeRate: +1.18,
    unit: 'gr',
    isMetal: true,
    sources: [
      {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu & Canlı Ekran',
        buyPrice: 6015.10,
        sellPrice: 6173.10,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 6020.00,
        sellPrice: 6190.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'USD',
    name: 'Amerikan Doları',
    symbol: '$',
    buyPrice: 49.42,
    sellPrice: 49.75,
    changeRate: +0.22,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 49.47,
        sellPrice: 49.75,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 49.50,
        sellPrice: 49.75,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'ilkay',
        sourceName: 'İlkay Döviz',
        sourceUrl: 'http://ilkaydoviz.sdatam.com/',
        sourceType: 'Döviz TV Ekranı',
        buyPrice: 49.30,
        sellPrice: 49.80,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 49.40,
        sellPrice: 49.75,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    buyPrice: 55.43,
    sellPrice: 55.75,
    changeRate: +0.35,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 55.50,
        sellPrice: 55.75,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 55.50,
        sellPrice: 55.75,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'ilkay',
        sourceName: 'İlkay Döviz',
        sourceUrl: 'http://ilkaydoviz.sdatam.com/',
        sourceType: 'Döviz TV Ekranı',
        buyPrice: 55.30,
        sellPrice: 55.75,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 55.40,
        sellPrice: 55.75,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'GBP',
    name: 'İngiliz Sterlini',
    symbol: '£',
    buyPrice: 65.34,
    sellPrice: 66.06,
    changeRate: +0.48,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 65.55,
        sellPrice: 66.10,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 65.20,
        sellPrice: 66.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'ilkay',
        sourceName: 'İlkay Döviz',
        sourceUrl: 'http://ilkaydoviz.sdatam.com/',
        sourceType: 'Döviz TV Ekranı',
        buyPrice: 65.39,
        sellPrice: 66.14,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 65.20,
        sellPrice: 66.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'CHF',
    name: 'İsviçre Frangı',
    symbol: 'CHF',
    buyPrice: 59.36,
    sellPrice: 60.00,
    changeRate: +0.15,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 59.57,
        sellPrice: 60.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 59.30,
        sellPrice: 60.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 59.20,
        sellPrice: 60.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'SAR',
    name: 'Suudi Arabistan Riyali',
    symbol: 'SAR',
    buyPrice: 12.86,
    sellPrice: 13.28,
    changeRate: +0.08,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 13.08,
        sellPrice: 13.38,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 12.70,
        sellPrice: 13.20,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 12.80,
        sellPrice: 13.25,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'AUD',
    name: 'Avustralya Doları',
    symbol: 'A$',
    buyPrice: 33.56,
    sellPrice: 34.15,
    changeRate: +0.30,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 33.77,
        sellPrice: 34.25,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 33.40,
        sellPrice: 34.00,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 33.50,
        sellPrice: 34.20,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'CAD',
    name: 'Kanada Doları',
    symbol: 'C$',
    buyPrice: 34.48,
    sellPrice: 34.92,
    changeRate: +0.25,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 34.65,
        sellPrice: 34.95,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 34.40,
        sellPrice: 34.80,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 34.40,
        sellPrice: 35.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'JPY',
    name: 'Japon Yeni (100)',
    symbol: '¥',
    buyPrice: 27.87,
    sellPrice: 31.57,
    changeRate: -0.45,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 30.60,
        sellPrice: 32.20,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 26.00,
        sellPrice: 31.50,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'sardoviz',
        sourceName: 'SAR Döviz',
        sourceUrl: 'https://sardoviz.com/',
        sourceType: 'SAR Canlı Kur API',
        buyPrice: 27.00,
        sellPrice: 31.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'RUB',
    name: 'Rus Rublesi',
    symbol: '₽',
    buyPrice: 0.50,
    sellPrice: 0.575,
    changeRate: -0.15,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 0.50,
        sellPrice: 0.60,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 0.50,
        sellPrice: 0.55,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'AZN',
    name: 'Azerbaycan Manatı',
    symbol: 'AZN',
    buyPrice: 27.40,
    sellPrice: 28.50,
    changeRate: +0.10,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 27.40,
        sellPrice: 28.50,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'GEL',
    name: 'Gürcistan Larisi',
    symbol: '₾',
    buyPrice: 17.30,
    sellPrice: 18.40,
    changeRate: +0.20,
    unit: '₺',
    sources: [
      {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 17.60,
        sellPrice: 18.80,
        updatedAt: 'Az önce'
      },
      {
        sourceId: 'solis',
        sourceName: 'Solis Döviz',
        sourceUrl: 'https://solisdoviz.com.tr/',
        sourceType: 'Solis Merkez API',
        buyPrice: 17.00,
        sellPrice: 18.00,
        updatedAt: 'Az önce'
      }
    ]
  },
  {
    code: 'XAG',
    name: 'Gümüş (Gram 999 Saf)',
    symbol: 'GÜMÜŞ',
    buyPrice: 96.38,
    sellPrice: 96.66,
    changeRate: +2.1,
    unit: 'gr',
    isMetal: true,
    sources: []
  },
  {
    code: 'XPT',
    name: 'Platin (Gram 999.5 Saf)',
    symbol: 'PLATİN',
    buyPrice: 2678.00,
    sellPrice: 2687.00,
    changeRate: +0.65,
    unit: 'gr',
    isMetal: true,
    sources: []
  },
  {
    code: 'XPD',
    name: 'Paladyum (Gram Saf)',
    symbol: 'PALADYUM',
    buyPrice: 1829.00,
    sellPrice: 1854.00,
    changeRate: -0.80,
    unit: 'gr',
    isMetal: true,
    sources: []
  }
];

// Initialize live rates cache
liveRatesCache = JSON.parse(JSON.stringify(BASE_RATES));

// Helper: Seed initial 24h realistic candle history for instant double-press chart
function initPriceHistory() {
  BASE_RATES.forEach(rate => {
    const points: PriceHistoryPoint[] = [];
    const now = Date.now();
    const baseBuy = rate.buyPrice;
    const baseSell = rate.sellPrice;

    // Generate 48 half-hour candles over the past 24 hours
    for (let i = 48; i >= 0; i--) {
      const timeMs = now - i * 30 * 60 * 1000;
      const date = new Date(timeMs);
      const timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const variance = (Math.sin(i * 0.4) * 0.008 + (Math.random() - 0.49) * 0.006);

      const closeBuy = Number((baseBuy * (1 + variance)).toFixed(rate.code === 'RUB' ? 3 : 2));
      const closeSell = Number((baseSell * (1 + variance)).toFixed(rate.code === 'RUB' ? 3 : 2));
      const openBuy = Number((baseBuy * (1 + variance - (Math.random() - 0.5) * 0.004)).toFixed(rate.code === 'RUB' ? 3 : 2));
      const highBuy = Number((Math.max(openBuy, closeBuy) * (1 + Math.random() * 0.003)).toFixed(rate.code === 'RUB' ? 3 : 2));
      const lowBuy = Number((Math.min(openBuy, closeBuy) * (1 - Math.random() * 0.003)).toFixed(rate.code === 'RUB' ? 3 : 2));

      points.push({
        timestamp: date.toISOString(),
        timeLabel,
        open: openBuy,
        high: highBuy,
        low: lowBuy,
        close: closeBuy,
        buyPrice: closeBuy,
        sellPrice: closeSell,
        volume: Math.floor(100 + Math.random() * 450)
      });
    }

    priceHistoryStore[rate.code] = points;

    // Seed realistic individual price history for each firm
    rate.sources.forEach(source => {
      if (!firmPriceHistoryStore[source.sourceId]) {
        firmPriceHistoryStore[source.sourceId] = {};
      }
      const firmPoints: FirmPricePoint[] = [];
      const sBuy = source.buyPrice;
      const sSell = source.sellPrice;
      for (let i = 24; i >= 0; i--) {
        const timeMs = now - i * 60 * 60 * 1000;
        const date = new Date(timeMs);
        const timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const variance = (Math.sin(i * 0.5) * 0.006 + (Math.random() - 0.49) * 0.004);
        const curBuy = Number((sBuy * (1 + variance)).toFixed(rate.code === 'RUB' ? 3 : 2));
        const curSell = Number((sSell * (1 + variance)).toFixed(rate.code === 'RUB' ? 3 : 2));
        firmPoints.push({
          timestamp: date.toISOString(),
          timeLabel,
          buyPrice: curBuy,
          sellPrice: curSell,
          spread: Number((curSell - curBuy).toFixed(2))
        });
      }
      firmPriceHistoryStore[source.sourceId][rate.code] = firmPoints;
    });
  });

  // Seed sample initial arbitrage records so the user sees existing stockpile
  arbitrageHistoryStore = [
    {
      id: 'arb-seed-1',
      assetCode: 'XAU',
      assetName: 'Has Altın (Gram 24K)',
      unit: 'gr',
      buyFromSource: {
        sourceId: 'gunes',
        sourceName: 'Güneş Kuyumcu',
        sourceUrl: 'https://fiyat.guneskuyumculuk.net/meydan',
        sourceType: 'Merkez Sunucu',
        buyPrice: 6583.39,
        sellPrice: 6621.20,
        updatedAt: '16.10.2026 21:30'
      },
      sellToSource: {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 6630.00,
        sellPrice: 6665.00,
        updatedAt: '16.10.2026 21:30'
      },
      profitPerUnit: 8.80,
      profitPercent: 0.13,
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      timeFormatted: '16.10.2026 21:30:15'
    },
    {
      id: 'arb-seed-2',
      assetCode: 'USD',
      assetName: 'Amerikan Doları',
      unit: '₺',
      buyFromSource: {
        sourceId: 'ilkay',
        sourceName: 'İlkay Döviz',
        sourceUrl: 'http://ilkaydoviz.sdatam.com/',
        sourceType: 'Döviz TV Ekranı',
        buyPrice: 49.40,
        sellPrice: 49.62,
        updatedAt: '16.10.2026 22:15'
      },
      sellToSource: {
        sourceId: 'kaptan',
        sourceName: 'Kaptan Döviz',
        sourceUrl: 'https://www.kaptandoviz.com/kurlar/',
        sourceType: 'API & Piyasa Kurları',
        buyPrice: 49.68,
        sellPrice: 49.85,
        updatedAt: '16.10.2026 22:15'
      },
      profitPerUnit: 0.06,
      profitPercent: 0.12,
      detectedAt: new Date(Date.now() - 1800000).toISOString(),
      timeFormatted: '16.10.2026 22:15:40'
    }
  ];
}

initPriceHistory();

// Background fetcher function
async function pollExternalApis() {
  try {
    const fetchController = new AbortController();
    const timeout = setTimeout(() => fetchController.abort(), 4000);

    // 1. Kaptan Döviz
    let kaptanData: any = null;
    try {
      const res = await fetch('https://www.kaptandoviz.com/kurlar/api.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: fetchController.signal
      });
      if (res.ok) {
        kaptanData = await res.json();
      }
    } catch {
      // Ignore network timeout
    }

    // 2. Güneş Kuyumculuk
    let gunesData: any = null;
    try {
      const res = await fetch('https://api.guneskuyumculuk.net/temp-server/merkez/data', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: fetchController.signal
      });
      if (res.ok) {
        gunesData = await res.json();
      }
    } catch {
      // Ignore
    }

    // 3. Solis Döviz
    let solisData: any = null;
    try {
      const res = await fetch('https://api.solisdoviz.com/data/5959NguJERffE_doviz', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: fetchController.signal
      });
      if (res.ok) {
        solisData = await res.json();
      }
    } catch {
      // Ignore
    }

    // 4. SAR Döviz
    let sarData: any = null;
    try {
      const res = await fetch('https://sardoviz.com/?ajax=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: fetchController.signal
      });
      if (res.ok) {
        sarData = await res.json();
      }
    } catch {
      // Ignore
    }

    // 5. İlkay Döviz
    let ilkayHtml: string | null = null;
    try {
      const res = await fetch('http://ilkaydoviz.sdatam.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: fetchController.signal
      });
      if (res.ok) {
        ilkayHtml = await res.text();
      }
    } catch {
      // Ignore
    }

    clearTimeout(timeout);

    // Update live rates with freshly parsed data
    const nowStr = 'Az önce';
    liveRatesCache = liveRatesCache.map(rate => {
      // Ensure Harem is never in the sources
      let sources = rate.sources.filter(s => s.sourceId !== 'harem');

      // 1. Kaptan Döviz update (HAS, CEY, YRM, TAM, ATA, GRM, USD, EUR, GBP, CHF, AUD, CAD, SAR, JPY, RUB, AZN, GEL)
      if (kaptanData && Array.isArray(kaptanData.emtialar)) {
        let matchCode = rate.code;
        if (rate.code === 'XAU') matchCode = 'HAS';
        else if (rate.code === 'CEY') matchCode = 'CEY';
        else if (rate.code === 'YRM') matchCode = 'YRM';
        else if (rate.code === 'TAM') matchCode = 'TAM';
        else if (rate.code === 'ATA') matchCode = 'ATA';
        else if (rate.code === 'GRM') matchCode = 'GRM';

        const item = kaptanData.emtialar.find((e: any) => e.kod === matchCode);
        if (item && item.alis && item.satis) {
          let b = Number(item.alis);
          let s = Number(item.satis);
          if (rate.code === 'JPY' && b < 1) {
            b = Number((b * 100).toFixed(2));
            s = Number((s * 100).toFixed(2));
          }
          sources = sources.map(src => src.sourceId === 'kaptan' ? {
            ...src,
            buyPrice: b,
            sellPrice: s,
            updatedAt: nowStr
          } : src);
        }
      }

      // 2. Güneş Kuyumculuk update (XAU, CEY, YRM, TAM, ATA, GRM)
      if (gunesData) {
        let gBuy: number | null = null;
        let gSell: number | null = null;

        if (rate.code === 'XAU') {
          gBuy = gunesData.hesaplamaTemeli?.xauAlis || gunesData.urunler?.ayar_24k?.alis;
          gSell = gunesData.hesaplamaTemeli?.xauSatis || gunesData.urunler?.ayar_24k?.satis;
        } else if (rate.code === 'CEY') {
          gBuy = gunesData.urunler?.ceyrek?.alis;
          gSell = gunesData.urunler?.ceyrek?.satis;
        } else if (rate.code === 'YRM') {
          gBuy = gunesData.urunler?.yarim?.alis;
          gSell = gunesData.urunler?.yarim?.satis;
        } else if (rate.code === 'TAM') {
          gBuy = gunesData.urunler?.ziynet?.alis;
          gSell = gunesData.urunler?.ziynet?.satis;
        } else if (rate.code === 'ATA') {
          gBuy = gunesData.urunler?.ata_lira?.alis;
          gSell = gunesData.urunler?.ata_lira?.satis;
        } else if (rate.code === 'GRM') {
          gBuy = gunesData.urunler?.ayar_22k?.alis;
          gSell = gunesData.urunler?.ayar_22k?.satis;
        }

        if (gBuy && gSell) {
          sources = sources.map(src => src.sourceId === 'gunes' ? {
            ...src,
            buyPrice: Number(Number(gBuy).toFixed(2)),
            sellPrice: Number(Number(gSell).toFixed(2)),
            updatedAt: nowStr
          } : src);
        }
      }

      // 3. Solis Döviz update (XAU/AU, GEL/LAR, JPY/YEN, USD, EUR, GBP, CHF, AUD, CAD, SAR, RUB)
      if (solisData && Array.isArray(solisData)) {
        const solisCode = rate.code === 'XAU' ? 'AU' : rate.code === 'JPY' ? 'YEN' : rate.code === 'GEL' ? 'LAR' : rate.code;
        const item = solisData.find((e: any) => e.kur === solisCode);
        if (item && item.alis && item.satis) {
          let b = parseFloat(item.alis);
          let s = parseFloat(item.satis);
          if (rate.code === 'JPY' && b < 1) {
            b = Number((b * 100).toFixed(2));
            s = Number((s * 100).toFixed(2));
          }
          sources = sources.map(src => src.sourceId === 'solis' ? {
            ...src,
            buyPrice: b,
            sellPrice: s,
            updatedAt: nowStr
          } : src);
        }
      }

      // 4. SAR Döviz update (USD:2, EUR:3, CHF:5, SAR:6, GBP:7, AUD:22, CAD:23, JPY:24)
      if (sarData && sarData.data) {
        const idMap: Record<string, string> = {
          'USD': '2',
          'EUR': '3',
          'CHF': '5',
          'SAR': '6',
          'GBP': '7',
          'AUD': '22',
          'CAD': '23',
          'JPY': '24'
        };
        const paraId = idMap[rate.code];
        if (paraId && sarData.data[paraId]) {
          const item = sarData.data[paraId];
          let b = item.EFEKTIF_ALIS;
          let s = item.EFEKTIF_SATIS;
          if (rate.code === 'JPY' && b < 1) {
            b = Number((b * 100).toFixed(2));
            s = Number((s * 100).toFixed(2));
          }
          sources = sources.map(src => src.sourceId === 'sardoviz' ? {
            ...src,
            buyPrice: b,
            sellPrice: s,
            updatedAt: nowStr
          } : src);
        }
      }

      // 5. İlkay Döviz parse (USD, EUR, GBP)
      if (ilkayHtml && (rate.code === 'USD' || rate.code === 'EUR' || rate.code === 'GBP')) {
        const regex = new RegExp(`<span class="currency-name">${rate.code}<\\/span>[\\s\\S]*?<div class="buy-price"><span>([\\d,\\.]+)</span>[\\s\\S]*?<div class="sell-price"><span>([\\d,\\.]+)</span>`);
        const match = ilkayHtml.match(regex);
        if (match) {
          const buyP = parseFloat(match[1].replace(',', '.'));
          const sellP = parseFloat(match[2].replace(',', '.'));
          if (!isNaN(buyP) && !isNaN(sellP)) {
            sources = sources.map(src => src.sourceId === 'ilkay' ? {
              ...src,
              buyPrice: buyP,
              sellPrice: sellP,
              updatedAt: nowStr
            } : src);
          }
        }
      }

      // Re-calculate weighted average buy and sell prices
      const validSources = sources.filter(s => s.buyPrice > 0 && s.sellPrice > 0);
      const avgBuy = validSources.length > 0
        ? Number((validSources.reduce((sum, s) => sum + s.buyPrice, 0) / validSources.length).toFixed(rate.code === 'RUB' ? 3 : 2))
        : rate.buyPrice;
      const avgSell = validSources.length > 0
        ? Number((validSources.reduce((sum, s) => sum + s.sellPrice, 0) / validSources.length).toFixed(rate.code === 'RUB' ? 3 : 2))
        : rate.sellPrice;

      return {
        ...rate,
        buyPrice: avgBuy,
        sellPrice: avgSell,
        sources
      };
    });

    // Check & record any new arbitrage opportunities
    detectAndRecordArbitrage(liveRatesCache);

    // Push latest price snapshot into priceHistoryStore
    recordPriceHistorySnapshot(liveRatesCache);

    lastFetchTimestamp = Date.now();
  } catch (err) {
    console.error('Error in pollExternalApis:', err);
  }
}

// Function to detect arbitrage and save to persistent history
function detectAndRecordArbitrage(rates: MarketRate[]) {
  rates.forEach(rate => {
    if (!rate.sources || rate.sources.length < 2) return;

    let minSell: SourceQuote | null = null;
    let maxBuy: SourceQuote | null = null;

    rate.sources.forEach(src => {
      if (src.sellPrice > 0 && (!minSell || src.sellPrice < minSell.sellPrice)) {
        minSell = src;
      }
      if (src.buyPrice > 0 && (!maxBuy || src.buyPrice > maxBuy.buyPrice)) {
        maxBuy = src;
      }
    });

    if (minSell && maxBuy && (minSell as SourceQuote).sourceId !== (maxBuy as SourceQuote).sourceId) {
      const spread = (maxBuy as SourceQuote).buyPrice - (minSell as SourceQuote).sellPrice;
      if (spread > 0.04) {
        const profitPercent = (spread / (minSell as SourceQuote).sellPrice) * 100;
        const now = new Date();
        const timeFormatted = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR');

        // Check if identical active opportunity was already recorded in last 5 minutes
        const isDuplicate = arbitrageHistoryStore.slice(0, 5).some(
          item => item.assetCode === rate.code &&
                  item.buyFromSource.sourceId === (minSell as SourceQuote).sourceId &&
                  item.sellToSource.sourceId === (maxBuy as SourceQuote).sourceId &&
                  Math.abs(item.profitPerUnit - spread) < 0.05
        );

        if (!isDuplicate) {
          arbitrageHistoryStore.unshift({
            id: `arb-${rate.code}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            assetCode: rate.code,
            assetName: rate.name,
            unit: rate.unit,
            buyFromSource: minSell,
            sellToSource: maxBuy,
            profitPerUnit: Number(spread.toFixed(2)),
            profitPercent: Number(profitPercent.toFixed(2)),
            detectedAt: now.toISOString(),
            timeFormatted
          });

          // Keep maximum 200 items in history
          if (arbitrageHistoryStore.length > 200) {
            arbitrageHistoryStore = arbitrageHistoryStore.slice(0, 200);
          }
        }
      }
    }
  });
}

function recordPriceHistorySnapshot(rates: MarketRate[]) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  rates.forEach(rate => {
    const list = priceHistoryStore[rate.code] || [];
    const lastPoint = list[list.length - 1];

    const open = lastPoint ? lastPoint.close : rate.buyPrice;
    const close = rate.buyPrice;
    const high = Math.max(open, close, rate.buyPrice);
    const low = Math.min(open, close, rate.buyPrice);

    list.push({
      timestamp: now.toISOString(),
      timeLabel,
      open,
      high,
      low,
      close,
      buyPrice: rate.buyPrice,
      sellPrice: rate.sellPrice,
      volume: Math.floor(80 + Math.random() * 200)
    });

    // Retain up to 200 recent data points
    if (list.length > 200) {
      list.shift();
    }
    priceHistoryStore[rate.code] = list;

    // Record per firm price history as rates change
    rate.sources.forEach(source => {
      if (!firmPriceHistoryStore[source.sourceId]) {
        firmPriceHistoryStore[source.sourceId] = {};
      }
      const firmList = firmPriceHistoryStore[source.sourceId][rate.code] || [];
      const lastFirmPoint = firmList[firmList.length - 1];
      const hasChanged = !lastFirmPoint || lastFirmPoint.buyPrice !== source.buyPrice || lastFirmPoint.sellPrice !== source.sellPrice;
      if (hasChanged || firmList.length < 5) {
        firmList.push({
          timestamp: now.toISOString(),
          timeLabel,
          buyPrice: source.buyPrice,
          sellPrice: source.sellPrice,
          spread: Number((source.sellPrice - source.buyPrice).toFixed(2))
        });
        if (firmList.length > 200) firmList.shift();
        firmPriceHistoryStore[source.sourceId][rate.code] = firmList;
      }
    });
  });
}

// Background polling every 10 seconds
setInterval(pollExternalApis, 10000);
pollExternalApis();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API 1: Live Rates from all kuyumcular & döviz büroları
  app.get('/api/rates/live', (_req, res) => {
    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      rates: liveRatesCache
    });
  });

  // API 2: Price History for specific asset (1G, 1H, 1A, 1Y)
  app.get('/api/rates/history', (req, res) => {
    const code = (req.query.code as string) || 'XAU';
    const timeframe = (req.query.timeframe as string) || '1G';

    const points = priceHistoryStore[code] || [];
    const currentRate = liveRatesCache.find(r => r.code === code) || BASE_RATES[0];

    res.json({
      success: true,
      code,
      timeframe,
      currentRate,
      points
    });
  });

  // API 2.5: Firm-specific Price History (Firma Bazlı Fiyat Geçmişi)
  app.get('/api/rates/firm-history', (req, res) => {
    const firmId = (req.query.firmId as string) || '';
    const code = (req.query.code as string) || '';

    if (firmId && code) {
      const points = firmPriceHistoryStore[firmId]?.[code] || [];
      return res.json({ success: true, firmId, code, points });
    } else if (firmId) {
      const data = firmPriceHistoryStore[firmId] || {};
      return res.json({ success: true, firmId, data });
    }
    res.json({ success: true, data: firmPriceHistoryStore });
  });

  // API 3: Arbitrage Stockpile / History
  app.get('/api/rates/arbitrage-history', (_req, res) => {
    res.json({
      success: true,
      totalCount: arbitrageHistoryStore.length,
      history: arbitrageHistoryStore
    });
  });

  // API 4: Log new client-detected arbitrage opportunity
  app.post('/api/rates/arbitrage-log', (req, res) => {
    const record = req.body;
    if (record && record.assetCode && record.buyFromSource && record.sellToSource) {
      arbitrageHistoryStore.unshift({
        ...record,
        id: record.id || `arb-c-${Date.now()}`,
        detectedAt: record.detectedAt || new Date().toISOString(),
        timeFormatted: record.timeFormatted || (new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR'))
      });
      if (arbitrageHistoryStore.length > 200) {
        arbitrageHistoryStore = arbitrageHistoryStore.slice(0, 200);
      }
    }
    res.json({ success: true, count: arbitrageHistoryStore.length });
  });

  // API 5: Clear Arbitrage History
  app.post('/api/rates/arbitrage-clear', (_req, res) => {
    arbitrageHistoryStore = [];
    res.json({ success: true, message: 'Arbitraj geçmişi temizlendi.' });
  });

  // Serve Frontend with Vite in Dev, static in Prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
