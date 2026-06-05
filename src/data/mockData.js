// Target and achievement values are in ₹ Crores

export const STATE_REGION_MAP = {
  'Uttar Pradesh': 'North',
  'Rajasthan': 'North',
  'Delhi': 'North',
  'Haryana': 'North',
  'Punjab': 'North',
  'Himachal Pradesh': 'North',
  'Uttarakhand': 'North',
  'Karnataka': 'South',
  'Tamil Nadu': 'South',
  'Kerala': 'South',
  'Andhra Pradesh': 'South',
  'Telangana': 'South',
  'Goa': 'South',
  'West Bengal': 'East',
  'Odisha': 'East',
  'Bihar': 'East',
  'Jharkhand': 'East',
  'Assam': 'East',
  'Chhattisgarh': 'East',
  'Maharashtra': 'West',
  'Gujarat': 'West',
  'Madhya Pradesh': 'West',
  'Daman & Diu': 'West',
  'Dadra & NH': 'West',
  'Chandigarh': 'West',
};

export const ALL_STATES = Object.keys(STATE_REGION_MAP);
export const ALL_REGIONS = ['North', 'South', 'East', 'West'];

export const MANAGERS = [
  'Rajesh Kumar', 'Sunita Sharma', 'Vikram Singh', 'Ankita Verma', 'Manish Gupta',
  'Priya Patel', 'Rohit Mehta', 'Arjun Nair', 'Deepa Krishnan', 'Srinivas Rao',
  'Kavya Reddy', 'Anand Subramanian', 'Rema Thomas', 'Abhijit Roy', 'Subhash Panda',
  'Rakesh Sinha', 'Deepak Bose', 'Priyanka Das', 'Satya Ranjan', 'Neha Joshi',
  'Suresh Shah', 'Anil Tripathi', 'Prashant Tiwari', 'Seema Desai', 'Rahul Patil',
];

export const REPORT_TYPES = ['Productivity Report'];

const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const MOCK_STATES = [
  // North (7)
  { id: 1, state: 'Uttar Pradesh', region: 'North', manager: 'Rajesh Kumar', target: 95.0, achievement: 97.2, achievementPct: 102.3, activeSKUs: 742, ordersCount: 14320, distributors: 182, lastUpdated: dayAgo(0) },
  { id: 2, state: 'Rajasthan', region: 'North', manager: 'Sunita Sharma', target: 62.0, achievement: 47.7, achievementPct: 77.0, activeSKUs: 510, ordersCount: 7840, distributors: 128, lastUpdated: dayAgo(1) },
  { id: 3, state: 'Delhi', region: 'North', manager: 'Vikram Singh', target: 78.0, achievement: 81.9, achievementPct: 105.0, activeSKUs: 623, ordersCount: 11200, distributors: 98, lastUpdated: dayAgo(0) },
  { id: 4, state: 'Haryana', region: 'North', manager: 'Ankita Verma', target: 45.0, achievement: 40.1, achievementPct: 89.1, activeSKUs: 398, ordersCount: 5960, distributors: 86, lastUpdated: dayAgo(2) },
  { id: 5, state: 'Punjab', region: 'North', manager: 'Manish Gupta', target: 38.0, achievement: 35.6, achievementPct: 93.8, activeSKUs: 344, ordersCount: 5280, distributors: 74, lastUpdated: dayAgo(1) },
  { id: 6, state: 'Himachal Pradesh', region: 'North', manager: 'Priya Patel', target: 14.0, achievement: 8.7, achievementPct: 62.1, activeSKUs: 142, ordersCount: 1240, distributors: 28, lastUpdated: dayAgo(3) },
  { id: 7, state: 'Uttarakhand', region: 'North', manager: 'Rohit Mehta', target: 18.0, achievement: 11.9, achievementPct: 66.1, activeSKUs: 168, ordersCount: 1680, distributors: 32, lastUpdated: dayAgo(2) },
  // South (6)
  { id: 8, state: 'Karnataka', region: 'South', manager: 'Arjun Nair', target: 88.0, achievement: 84.9, achievementPct: 96.5, activeSKUs: 680, ordersCount: 12840, distributors: 158, lastUpdated: dayAgo(0) },
  { id: 9, state: 'Tamil Nadu', region: 'South', manager: 'Deepa Krishnan', target: 82.0, achievement: 76.3, achievementPct: 93.0, activeSKUs: 636, ordersCount: 11460, distributors: 152, lastUpdated: dayAgo(1) },
  { id: 10, state: 'Kerala', region: 'South', manager: 'Srinivas Rao', target: 56.0, achievement: 44.2, achievementPct: 79.0, activeSKUs: 432, ordersCount: 6320, distributors: 94, lastUpdated: dayAgo(2) },
  { id: 11, state: 'Andhra Pradesh', region: 'South', manager: 'Kavya Reddy', target: 64.0, achievement: 57.7, achievementPct: 90.2, activeSKUs: 498, ordersCount: 8640, distributors: 118, lastUpdated: dayAgo(1) },
  { id: 12, state: 'Telangana', region: 'South', manager: 'Anand Subramanian', target: 71.0, achievement: 51.8, achievementPct: 73.0, activeSKUs: 548, ordersCount: 9120, distributors: 122, lastUpdated: dayAgo(0) },
  { id: 13, state: 'Goa', region: 'South', manager: 'Rema Thomas', target: 9.0, achievement: 5.9, achievementPct: 65.6, activeSKUs: 86, ordersCount: 760, distributors: 18, lastUpdated: dayAgo(4) },
  // East (6)
  { id: 14, state: 'West Bengal', region: 'East', manager: 'Abhijit Roy', target: 74.0, achievement: 62.9, achievementPct: 85.0, activeSKUs: 574, ordersCount: 9880, distributors: 136, lastUpdated: dayAgo(1) },
  { id: 15, state: 'Odisha', region: 'East', manager: 'Subhash Panda', target: 41.0, achievement: 28.3, achievementPct: 69.0, activeSKUs: 318, ordersCount: 4200, distributors: 72, lastUpdated: dayAgo(3) },
  { id: 16, state: 'Bihar', region: 'East', manager: 'Rakesh Sinha', target: 52.0, achievement: 30.2, achievementPct: 58.1, activeSKUs: 402, ordersCount: 5640, distributors: 98, lastUpdated: dayAgo(2) },
  { id: 17, state: 'Jharkhand', region: 'East', manager: 'Deepak Bose', target: 29.0, achievement: 19.9, achievementPct: 68.6, activeSKUs: 224, ordersCount: 2960, distributors: 52, lastUpdated: dayAgo(3) },
  { id: 18, state: 'Assam', region: 'East', manager: 'Priyanka Das', target: 35.0, achievement: 26.3, achievementPct: 75.1, activeSKUs: 272, ordersCount: 3680, distributors: 62, lastUpdated: dayAgo(2) },
  { id: 19, state: 'Chhattisgarh', region: 'East', manager: 'Satya Ranjan', target: 33.0, achievement: 24.8, achievementPct: 75.2, activeSKUs: 256, ordersCount: 3480, distributors: 58, lastUpdated: dayAgo(1) },
  // West (6)
  { id: 20, state: 'Maharashtra', region: 'West', manager: 'Neha Joshi', target: 118.0, achievement: 119.6, achievementPct: 101.4, activeSKUs: 848, ordersCount: 15680, distributors: 212, lastUpdated: dayAgo(0) },
  { id: 21, state: 'Gujarat', region: 'West', manager: 'Suresh Shah', target: 96.0, achievement: 100.2, achievementPct: 104.4, activeSKUs: 762, ordersCount: 13240, distributors: 186, lastUpdated: dayAgo(0) },
  { id: 22, state: 'Madhya Pradesh', region: 'West', manager: 'Anil Tripathi', target: 67.0, achievement: 59.7, achievementPct: 89.1, activeSKUs: 518, ordersCount: 7960, distributors: 114, lastUpdated: dayAgo(1) },
  { id: 23, state: 'Daman & Diu', region: 'West', manager: 'Prashant Tiwari', target: 6.0, achievement: 3.3, achievementPct: 55.0, activeSKUs: 48, ordersCount: 420, distributors: 12, lastUpdated: dayAgo(5) },
  { id: 24, state: 'Dadra & NH', region: 'West', manager: 'Seema Desai', target: 5.0, achievement: 3.8, achievementPct: 76.0, activeSKUs: 42, ordersCount: 360, distributors: 10, lastUpdated: dayAgo(4) },
  { id: 25, state: 'Chandigarh', region: 'West', manager: 'Rahul Patil', target: 11.0, achievement: 9.2, achievementPct: 83.6, activeSKUs: 104, ordersCount: 1240, distributors: 22, lastUpdated: dayAgo(2) },
];

function buildDailyTrend() {
  const rows = [];
  const base = 18.5;
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.58 : 1.0;
    const trend = 1 + ((59 - i) / 59) * 0.22;
    const wave = 1 + Math.sin(i * 0.41) * 0.12;
    const noise = 0.88 + ((i * 17 + 7) % 23) / 100;
    rows.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(base * weekendFactor * trend * wave * noise * 100) / 100,
    });
  }
  return rows;
}

export const DAILY_TREND = buildDailyTrend();
