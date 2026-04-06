const supabase = require('../config/supabase');

const healthCheck = async (req, res) => {
  const healthInfo = {
    status: 'OK',
    message: 'API Testing Tool Backend is running',
    database: supabase ? 'Supabase Connected' : 'Local Storage Mode',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('history').select('count').limit(1);
      healthInfo.database = error ? 'Supabase Connection Issue' : 'Supabase Connected';
    } catch {
      healthInfo.database = 'Supabase Connection Failed';
    }
  }

  res.json(healthInfo);
};

module.exports = { healthCheck };
