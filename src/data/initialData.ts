import { Account, MarketRate, Transaction, Category, UpcomingPayment, Contact, AppNotification, BudgetPlan } from '../types';

export const INITIAL_MARKET_RATES: MarketRate[] = [
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
    changeRate: +2.10,
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

export const INITIAL_ACCOUNTS: Account[] = [
  // NAKİT
  {
    id: 'nakit-1',
    name: '1-Nakit',
    type: 'nakit',
    balance: 104.50,
    currency: 'TRY',
    unitLabel: '₺',
    category: 'Nakit Cüzdan',
    color: '#10b981',
    icon: 'Wallet'
  },
  {
    id: 'nakit-2',
    name: '2-Nakit',
    type: 'nakit',
    balance: 5.00,
    currency: 'EUR',
    unitLabel: '€',
    category: 'Döviz Nakit',
    color: '#0ea5e9',
    icon: 'Banknote',
    note: '275,71 ₺ karşılığı'
  },
  {
    id: 'nakit-dengeleme',
    name: 'Dengeleme Hesabı 🧑‍💼',
    type: 'nakit',
    balance: -2076752.06,
    currency: 'TRY',
    unitLabel: '₺',
    category: 'Dengeleme',
    color: '#64748b',
    icon: 'Scale'
  },

  // BANKA
  {
    id: 'banka-akbank',
    name: 'Akbank Vadesiz',
    type: 'banka',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 250000,
    bankName: 'Akbank',
    note: '₺250.000 +para hazır limit',
    color: '#dc2626',
    icon: 'Building2'
  },
  {
    id: 'banka-enpara',
    name: 'ENPARA',
    type: 'banka',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 120000,
    bankName: 'Enpara',
    note: '₺120.000 +para',
    color: '#8b5cf6',
    icon: 'Building2'
  },
  {
    id: 'banka-ing',
    name: 'ING',
    type: 'banka',
    balance: 101528.91,
    currency: 'TRY',
    unitLabel: '₺',
    bankName: 'ING Bank',
    color: '#ea580c',
    icon: 'Landmark'
  },
  {
    id: 'banka-maas',
    name: 'Maaş Hesabı',
    type: 'banka',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 250000,
    bankName: 'Garanti BBVA',
    note: 'Garanti ₺250.000 +para',
    color: '#059669',
    icon: 'Briefcase'
  },
  {
    id: 'banka-qnb',
    name: 'QNB Finansbank',
    type: 'banka',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 200000,
    bankName: 'QNB Finansbank',
    note: '₺200.000 +para',
    color: '#0284c7',
    icon: 'Building2'
  },

  // KREDİ KARTI
  {
    id: 'kk-akbank-avans',
    name: 'Akbank Avans Hesap 🏦',
    type: 'kredi_karti',
    balance: -25646.25,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 674800,
    color: '#ef4444',
    icon: 'CreditCard'
  },
  {
    id: 'kk-akbank-free',
    name: 'AKBANK FREE',
    type: 'kredi_karti',
    balance: -61784.10,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 674800,
    color: '#ef4444',
    icon: 'CreditCard',
    note: '₺674.800 çatı limit'
  },
  {
    id: 'kk-akbank-free-ek',
    name: 'Akbank Free Ek Kart',
    type: 'kredi_karti',
    balance: -1337.00,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 50000,
    color: '#f87171',
    icon: 'CreditCard',
    isSupplementary: true,
    parentAccountId: 'kk-akbank-free',
    supplementaryCardHolder: 'Seda Özgür',
    cardLast4: '8821',
    cardCutoffDay: 15,
    note: 'AKBANK FREE bağlı ek kart (Seda Özgür)'
  },
  {
    id: 'kk-akbank-ihtiyac',
    name: 'Akbank İhtiyaç Kredisi 🏦',
    type: 'kredi_karti',
    balance: -18093.57,
    currency: 'TRY',
    unitLabel: '₺',
    color: '#b91c1c',
    icon: 'FileText'
  },
  {
    id: 'kk-dunya-katilim',
    name: 'Dünya Katılım B. KK',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 10000,
    color: '#14b8a6',
    icon: 'CreditCard'
  },
  {
    id: 'kk-enpara',
    name: 'Enpara Kredi Kartı',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 350000,
    color: '#a855f7',
    icon: 'CreditCard'
  },
  {
    id: 'kk-garanti-bonus',
    name: 'Garanti Bonus',
    type: 'kredi_karti',
    balance: -27867.94,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 150000,
    color: '#16a34a',
    icon: 'CreditCard'
  },
  {
    id: 'kk-kuveytturk',
    name: 'KuveytTürk KK',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 50000,
    color: '#0d9488',
    icon: 'CreditCard'
  },
  {
    id: 'kk-qnb',
    name: 'QNB KK',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 195000,
    color: '#0369a1',
    icon: 'CreditCard'
  },
  {
    id: 'kk-teb',
    name: 'TEB KK',
    type: 'kredi_karti',
    balance: -30000.00,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 300000,
    color: '#047857',
    icon: 'CreditCard'
  },
  {
    id: 'kk-tombank',
    name: 'Tombank KK',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 50000,
    color: '#f59e0b',
    icon: 'CreditCard'
  },
  {
    id: 'kk-vakifbank',
    name: 'Vakıfbank KK',
    type: 'kredi_karti',
    balance: -5000.00,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 400000,
    color: '#ca8a04',
    icon: 'CreditCard'
  },
  {
    id: 'kk-ziraat',
    name: 'Ziraat B. KK',
    type: 'kredi_karti',
    balance: 0,
    currency: 'TRY',
    unitLabel: '₺',
    limit: 362000,
    color: '#b91c1c',
    icon: 'CreditCard'
  },

  // BİRİKİM & YATIRIM (Metals, FX, Gold, Silver, Platinum, Palladium)
  {
    id: 'birikim-asil',
    name: 'Asil Yatırım (xau-xag) 🥇🥈',
    type: 'birikim',
    balance: 15929.89,
    currency: 'TRY',
    unitLabel: 'gr',
    gramWeight: 2.4,
    metalPurity: 'Altın/Gümüş Karma',
    color: '#eab308',
    icon: 'Coins',
    note: '2,4 gr (15.929,89 ₺)'
  },
  {
    id: 'birikim-dunya-altin',
    name: 'Dünya Katılım Altın 💰🏧',
    type: 'birikim',
    balance: 99561.79,
    currency: 'XAU',
    unitLabel: 'gr',
    gramWeight: 15.75,
    metalPurity: 'Has Altın 24K',
    color: '#f59e0b',
    icon: 'Gem',
    note: '15,75 gr (99.561,79 ₺)'
  },
  {
    id: 'birikim-dunya-gumus',
    name: 'Dünya Katılım Gümüş 🥈🏧',
    type: 'birikim',
    balance: 146488.59,
    currency: 'XAG',
    unitLabel: 'gr',
    gramWeight: 22.07,
    metalPurity: '999 Saf Gümüş',
    color: '#94a3b8',
    icon: 'CircleDot',
    note: '22,07 gr (146.488,59 ₺)'
  },
  {
    id: 'birikim-has-hesabi',
    name: 'Has Hesabı 🥇',
    type: 'birikim',
    balance: 524358.78,
    currency: 'XAU',
    unitLabel: 'gr',
    gramWeight: 79.00,
    metalPurity: 'Has Altın',
    color: '#d97706',
    icon: 'Award',
    note: '79 gr (524.358,78 ₺)'
  },
  {
    id: 'birikim-xag-gumus',
    name: 'XAG Gümüş Hesabı 🥈',
    type: 'birikim',
    balance: -15067.02,
    currency: 'XAG',
    unitLabel: 'gr',
    gramWeight: -2.27,
    metalPurity: '999 Gümüş',
    color: '#64748b',
    icon: 'CircleDot',
    note: '-2,27 gr (-15.067,02 ₺)'
  },
  {
    id: 'birikim-platin',
    name: 'Fiziki Platin Kasası ⚙️',
    type: 'birikim',
    balance: 10920.00,
    currency: 'XPT',
    unitLabel: 'gr',
    gramWeight: 10.00,
    metalPurity: '999.5 Saf Platin',
    color: '#0284c7',
    icon: 'Layers',
    note: '10,00 gr (10.920,00 ₺)'
  },
  {
    id: 'birikim-paladyum',
    name: 'Paladyum Yatırım Hesabı 💎',
    type: 'birikim',
    balance: 5775.00,
    currency: 'XPD',
    unitLabel: 'gr',
    gramWeight: 5.00,
    metalPurity: 'Saf Paladyum',
    color: '#6366f1',
    icon: 'Sparkles',
    note: '5,00 gr (5.775,00 ₺)'
  },
  {
    id: 'birikim-dolar-hesabi',
    name: 'Döviz Mevduat (USD) 💵',
    type: 'birikim',
    balance: 51375.00,
    currency: 'USD',
    unitLabel: '$',
    color: '#10b981',
    icon: 'DollarSign',
    note: '1.500,00 $ (51.375,00 ₺)'
  },

  // BORÇ / ALACAK
  {
    id: 'borc-has-altin-mevduat',
    name: 'Ödediğim Mevduatların Has Altın Karşılıkları',
    type: 'borc_alacak',
    balance: 4527273.87,
    currency: 'TRY',
    unitLabel: '₺',
    debtDirection: 'alacak',
    institutionType: 'ozel',
    institutionName: 'Mevduat Karşılığı Altın Alacağı',
    color: '#059669',
    icon: 'CheckCircle2',
    includeInGeneralStatus: true
  },
  {
    id: 'borc-gizem-kyk',
    name: 'GİZEM KYK',
    type: 'borc_alacak',
    balance: -3900.00,
    currency: 'TRY',
    unitLabel: '₺',
    debtDirection: 'borc',
    institutionType: 'resmi',
    institutionName: 'KYK Kredi ve Yurtlar Genel Müdürlüğü (GİB)',
    dueDate: '2026-10-23',
    totalInstallments: 36,
    remainingInstallments: 8,
    color: '#ef4444',
    icon: 'GraduationCap',
    note: '07-09-2023 425 TL, 10-23 09-2024 470 TL',
    includeInGeneralStatus: true
  },
  {
    id: 'borc-is-bankasi-kredi',
    name: 'İş Bankası EV KREDİSİ',
    type: 'borc_alacak',
    balance: -1144228.29,
    currency: 'TRY',
    unitLabel: '₺',
    debtDirection: 'borc',
    institutionType: 'ozel',
    institutionName: 'Türkiye İş Bankası A.Ş. (Konut Kredisi)',
    dueDate: '2026-11-05',
    totalInstallments: 120,
    remainingInstallments: 31,
    color: '#dc2626',
    icon: 'Home',
    note: 'Kalan 31 Ay · Aylık 36.910,59 ₺',
    includeInGeneralStatus: true
  },
  {
    id: 'borc-yakup-koroglu',
    name: 'Yakup Köroğlu',
    type: 'borc_alacak',
    balance: -1327490.58,
    currency: 'XAU',
    unitLabel: 'gr',
    gramWeight: -200,
    debtDirection: 'borc',
    institutionType: 'sahis',
    institutionName: 'Bireysel Şahıs (Fiziki Altın Borcu)',
    contactPhone: '05334567890',
    dueDate: '2026-12-15',
    color: '#991b1b',
    icon: 'UserMinus',
    note: '-200 gr Altın borcu',
    includeInGeneralStatus: true
  },
  {
    id: 'borc-ihtiyac-kredisi',
    name: 'İhtiyaç Kredisi',
    type: 'borc_alacak',
    balance: -18093.57,
    currency: 'TRY',
    unitLabel: '₺',
    debtDirection: 'borc',
    institutionType: 'ozel',
    institutionName: 'İş Bankası',
    dueDate: "Her Ayın 6'sı",
    totalInstallments: 12,
    remainingInstallments: 2,
    installmentAmount: 9046.80,
    color: '#b91c1c',
    icon: 'Landmark',
    note: '12 Taksitli İhtiyaç Kredisi (Kalan: 2 Ay · Taksit: ₺9.046,80)',
    includeInGeneralStatus: true
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    accountId: 'nakit-1',
    accountName: '1-Nakit',
    type: 'gelir',
    amount: 5212.00,
    currency: 'TRY',
    category: 'A A YATIRIM',
    categoryIcon: 'TrendingUp',
    description: '58.800 x 0,50 RUB + 710 GEL + 574 AZN Kaptana verildi toplam ₺57.482 / ₺5.212 kâr',
    date: '2026-10-10 12:43'
  },
  {
    id: 'tx-2',
    accountId: 'nakit-1',
    accountName: '1-Nakit',
    toAccountId: 'banka-enpara',
    toAccountName: 'ENPARA',
    type: 'transfer',
    amount: -57480.00,
    currency: 'TRY',
    category: 'Transfer',
    categoryIcon: 'ArrowRightLeft',
    description: 'ENPARA hesabına aktarıldı',
    date: '2026-10-10 12:44'
  },
  {
    id: 'tx-3',
    accountId: 'kk-akbank-free',
    accountName: 'AKBANK FREE',
    type: 'gider',
    amount: -150.00,
    currency: 'TRY',
    category: 'Yemek / Market',
    categoryIcon: 'UtensilsCrossed',
    description: 'Fırın alışverişi',
    date: '2026-10-11 11:25'
  },
  {
    id: 'tx-4',
    accountId: 'kk-akbank-free',
    accountName: 'AKBANK FREE',
    type: 'gider',
    amount: -303.77,
    currency: 'TRY',
    category: 'Araç Yakıt',
    categoryIcon: 'Fuel',
    description: 'Benzin istasyonu',
    date: '2026-10-10 21:57'
  },
  {
    id: 'tx-5',
    accountId: 'kk-akbank-free',
    accountName: 'AKBANK FREE',
    type: 'gider',
    amount: -279.30,
    currency: 'TRY',
    category: 'Yemek / Market',
    categoryIcon: 'ShoppingBag',
    description: 'Şok Market',
    date: '2026-10-10 19:54'
  },
  {
    id: 'tx-6',
    accountId: 'kk-akbank-free',
    accountName: 'AKBANK FREE',
    type: 'gider',
    amount: -940.00,
    currency: 'TRY',
    category: 'Giyim',
    categoryIcon: 'Shirt',
    description: 'Arma giyim',
    date: '2026-10-10 19:08'
  },
  {
    id: 'tx-7',
    accountId: 'kk-akbank-free',
    accountName: 'AKBANK FREE',
    type: 'gider',
    amount: -500.00,
    currency: 'TRY',
    category: 'Giyim',
    categoryIcon: 'Shirt',
    description: 'Zula Giyim',
    date: '2026-10-10 19:08'
  },
  {
    id: 'tx-8',
    accountId: 'nakit-1',
    accountName: '1-Nakit',
    type: 'transfer',
    amount: 52270.00,
    currency: 'TRY',
    category: 'Transfer',
    categoryIcon: 'ArrowRightLeft',
    description: '58.800 x 0,42 RUB, 710 GEL, 574 AZN',
    date: '2026-10-09 18:17'
  },
  {
    id: 'tx-9',
    accountId: 'nakit-1',
    accountName: '1-Nakit',
    toAccountId: 'banka-ing',
    toAccountName: 'ING',
    type: 'transfer',
    amount: -96000.00,
    currency: 'TRY',
    category: 'Transfer',
    categoryIcon: 'ArrowRightLeft',
    description: 'ING Bank transfer',
    date: '2026-10-08 14:55'
  },
  {
    id: 'tx-10',
    accountId: 'nakit-1',
    accountName: '1-Nakit',
    type: 'gelir',
    amount: 15000.00,
    currency: 'TRY',
    category: 'A A YATIRIM',
    categoryIcon: 'TrendingUp',
    description: '300.000 RUBLE x 0,53 alış / 300.000 RUBLE x 0,58 satış -> ₺15.000 kâr',
    date: '2026-10-08 14:20'
  },
  {
    id: 'tx-11',
    accountId: 'birikim-dunya-altin',
    accountName: 'Dünya Katılım Altın 💰🏧',
    type: 'tahsilat',
    amount: 0.75,
    currency: 'XAU',
    category: 'Altın Tahsilat',
    categoryIcon: 'Coins',
    description: 'Vakıfbank KK 5.000,00 ₺ -> 0,75 gr Altın alımı',
    date: '2026-10-11 12:43',
    metalGram: 0.75
  },
  {
    id: 'tx-12',
    accountId: 'borc-is-bankasi-kredi',
    accountName: 'İş Bankası EV KREDİSİ',
    type: 'odeme',
    amount: 36910.59,
    currency: 'TRY',
    category: 'Ev Kredisi',
    categoryIcon: 'Home',
    description: '29. Taksit ödendi · Kalan 31 AY (Has kur: ₺6.800 x 5,43 gr has)',
    date: '2026-10-01 07:53'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Yemek / Market', icon: 'UtensilsCrossed', color: '#ef4444', type: 'gider', budgetLimit: 12000 },
  { id: 'cat-2', name: 'Giyim', icon: 'Shirt', color: '#f59e0b', type: 'gider', budgetLimit: 7500 },
  { id: 'cat-3', name: 'Alışveriş', icon: 'ShoppingBag', color: '#3b82f6', type: 'gider', budgetLimit: 5000 },
  { id: 'cat-4', name: 'Kişisel Bakım', icon: 'Sparkles', color: '#ec4899', type: 'gider', budgetLimit: 2000 },
  { id: 'cat-5', name: 'Araç Yakıt', icon: 'Fuel', color: '#dc2626', type: 'gider', budgetLimit: 4000 },
  { id: 'cat-6', name: 'Araç Bakım ve Onarım', icon: 'Wrench', color: '#10b981', type: 'gider', budgetLimit: 3000 },
  { id: 'cat-7', name: 'Ev Giderleri', icon: 'Home', color: '#8b5cf6', type: 'gider', budgetLimit: 3500 },
  { id: 'cat-8', name: 'Faiz & İşlem Ücreti', icon: 'Percent', color: '#6b7280', type: 'gider', budgetLimit: 1500 },
  { id: 'cat-9', name: 'Ulaşım / Araba', icon: 'Car', color: '#06b6d4', type: 'gider', budgetLimit: 2500 },
  { id: 'cat-10', name: 'Maaş', icon: 'Briefcase', color: '#10b981', type: 'gelir' },
  { id: 'cat-11', name: 'Prim', icon: 'Award', color: '#059669', type: 'gelir' },
  { id: 'cat-12', name: 'A A Yatırım', icon: 'TrendingUp', color: '#0284c7', type: 'gelir' },
  { id: 'cat-13', name: 'Faiz Geliri', icon: 'Coins', color: '#d97706', type: 'gelir' },
  { id: 'cat-14', name: 'Kira Geliri', icon: 'Building', color: '#84cc16', type: 'gelir' },
];

export const INITIAL_UPCOMING_PAYMENTS: UpcomingPayment[] = [
  {
    id: 'up-1',
    title: 'İş Bankası Ev Kredisi 30. Taksit',
    amount: 36910.59,
    currency: 'TRY',
    dueDate: '2026-11-01',
    type: 'gider',
    category: 'Ev Kredisi',
    accountName: 'ING Hesabı',
    status: 'pending',
    period: 'monthly'
  },
  {
    id: 'up-2',
    title: 'Akbank Free KK Son Ödeme Tarihi',
    amount: 61784.10,
    currency: 'TRY',
    dueDate: '2026-10-24',
    type: 'gider',
    category: 'Kredi Kartı',
    accountName: 'AKBANK FREE',
    status: 'pending',
    period: 'monthly'
  },
  {
    id: 'up-3',
    title: 'Aylık Şirket Maaş Yatışı',
    amount: 55000.00,
    currency: 'TRY',
    dueDate: '2026-11-01',
    type: 'gelir',
    category: 'Maaş',
    accountName: 'Maaş Hesabı (Garanti)',
    status: 'pending',
    period: 'monthly'
  },
  {
    id: 'up-4',
    title: 'Gizem KYK Taksiti',
    amount: 470.00,
    currency: 'TRY',
    dueDate: '2026-10-23',
    type: 'gider',
    category: 'Eğitim / KYK',
    accountName: '1-Nakit',
    status: 'pending',
    period: 'monthly'
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'c-1', name: 'Ahmet Aktürk', phone: '05317365347', type: 'kisi', balance: 0 },
  { id: 'c-2', name: 'Ali Katlan AltınBarkod', phone: '+90 507 276 30 08', type: 'isletme', balance: 14500 },
  { id: 'c-3', name: 'Altundal Abi (Altundal Jewellery)', phone: '05412717576', type: 'isletme', balance: -25000 },
  { id: 'c-4', name: 'Altundal Ersin', phone: '05469516723', type: 'kisi', balance: 0 },
  { id: 'c-5', name: 'Altundal Salih Kayaoğlu', phone: '05320288562', type: 'kisi', balance: 5000 },
  { id: 'c-6', name: 'Gizem (KYK Borçlusu)', phone: '05559871234', type: 'kisi', balance: -3900 },
  { id: 'c-7', name: 'Yakup Köroğlu (Altın Borcu)', phone: '05334567890', type: 'kisi', balance: -1327490.58 }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Altın Fiyatı Yükselişte! 🥇',
    message: 'Has Altın gram fiyatı ₺3.426 seviyesine yükseldi (+%1.45 günlük artış). Toplam altın portföyünüzün değeri ₺639.850 oldu.',
    timestamp: '10 dk önce',
    isRead: false,
    type: 'price'
  },
  {
    id: 'notif-2',
    title: 'Ödeme Hatırlatması ⏰',
    message: 'İş Bankası Ev Kredisi 30. taksiti (₺36.910,59) için son 19 gün kaldı.',
    timestamp: '2 saat önce',
    isRead: false,
    type: 'alert'
  },
  {
    id: 'notif-3',
    title: 'Bütçe Limiti Uyarısı ⚠️',
    message: 'Yemek / Market kategorisinde aylık limitinizin %63 üne ulaştınız (₺7.541 / ₺12.000).',
    timestamp: 'Dün, 18:40',
    isRead: false,
    type: 'budget'
  },
  {
    id: 'notif-4',
    title: 'Bulut Yedekleme Tamamlandı ☁️',
    message: 'Tüm hesap hareketleriniz, metal varlıklarınız ve bütçe planlarınız şifrelenerek buluta yedeklendi.',
    timestamp: 'Dün, 09:15',
    isRead: false,
    type: 'system'
  }
];

export const INITIAL_BUDGET_PLANS: BudgetPlan[] = [
  { categoryId: 'cat-1', categoryName: 'Yemek / Market', monthlyLimit: 12000, spent: 7541.32, color: '#ef4444' },
  { categoryId: 'cat-2', categoryName: 'Giyim', monthlyLimit: 7500, spent: 5352.32, color: '#f59e0b' },
  { categoryId: 'cat-3', categoryName: 'Alışveriş', monthlyLimit: 5000, spent: 2194.55, color: '#3b82f6' },
  { categoryId: 'cat-4', categoryName: 'Kişisel Bakım', monthlyLimit: 2000, spent: 900.00, color: '#ec4899' },
  { categoryId: 'cat-5', categoryName: 'Araç Yakıt', monthlyLimit: 4000, spent: 682.19, color: '#dc2626' },
  { categoryId: 'cat-8', categoryName: 'Faiz & İşlem Ücreti', monthlyLimit: 1500, spent: 650.00, color: '#6b7280' },
  { categoryId: 'cat-7', categoryName: 'Ev Giderleri', monthlyLimit: 3500, spent: 300.00, color: '#8b5cf6' },
  { categoryId: 'cat-9', categoryName: 'Ulaşım / Araba', monthlyLimit: 2500, spent: 135.00, color: '#06b6d4' },
];
