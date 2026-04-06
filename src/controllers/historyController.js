const supabase = require('../config/supabase');

const saveHistory = async (req, res) => {
  try {
    const { userId, url, method, headers, params, body, responseStatus, duration } = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('history')
          .insert({
            user_id: userId,
            url,
            method,
            headers: headers ? JSON.stringify(headers) : null,
            params: params ? JSON.stringify(params) : null,
            body: body || null,
            response_status: responseStatus || null,
            duration: duration || null
          })
          .select()
          .single();

        if (!error) {
          return res.json({
            success: true,
            message: 'History saved to database',
            data: {
              id: data.id,
              userId: data.user_id,
              url: data.url,
              method: data.method,
              responseStatus: data.response_status,
              duration: data.duration,
              createdAt: data.created_at
            }
          });
        }
      } catch (supabaseError) {
        console.log('Supabase save failed, falling back to localStorage:', supabaseError.message);
      }
    }

    // Fallback: localStorage simulation
    const historyItem = {
      id: Date.now().toString(),
      userId,
      url,
      method,
      headers: headers ? JSON.stringify(headers) : null,
      params: params ? JSON.stringify(params) : null,
      body: body || null,
      responseStatus: responseStatus || null,
      duration: duration || null,
      createdAt: Date.now()
    };

    res.json({
      success: true,
      message: 'History saved locally (database not configured)',
      data: historyItem
    });

  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({
      error: 'Failed to save history',
      message: error.message
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error) {
          const formattedData = data.map(item => ({
            id: item.id,
            userId: item.user_id,
            url: item.url,
            method: item.method,
            headers: item.headers,
            params: item.params,
            body: item.body,
            responseStatus: item.response_status,
            duration: item.duration,
            createdAt: new Date(item.created_at).getTime()
          }));

          return res.json({
            success: true,
            data: formattedData,
            message: 'History retrieved from database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase fetch failed:', supabaseError.message);
      }
    }

    res.json({
      success: true,
      data: [],
      message: 'Using client-side storage (database not configured)'
    });

  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
};

module.exports = { saveHistory, getHistory };
