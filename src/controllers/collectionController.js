const supabase = require('../config/supabase');

const getCollections = async (req, res) => {
  try {
    const { userId } = req.params;

    if (supabase) {
      try {
        const { data: collections, error } = await supabase
          .from('collections')
          .select(`
            *,
            collection_items(count)
          `)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error) {
          const collectionsWithCounts = collections.map(collection => ({
            id: collection.id,
            userId: collection.user_id,
            name: collection.name,
            description: collection.description,
            color: collection.color,
            itemCount: collection.collection_items[0]?.count || 0,
            createdAt: new Date(collection.created_at).getTime(),
            updatedAt: new Date(collection.updated_at).getTime()
          }));

          return res.json({
            success: true,
            data: collectionsWithCounts,
            message: 'Collections retrieved from database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase collections fetch failed:', supabaseError.message);
      }
    }

    res.json({
      success: true,
      data: [],
      message: 'Using client-side storage (database not configured)'
    });

  } catch (error) {
    console.error('Fetch collections error:', error);
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: error.message,
      success: false
    });
  }
};

const createCollection = async (req, res) => {
  try {
    const { userId, name, description, color } = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .insert({ user_id: userId, name, description, color })
          .select()
          .single();

        if (!error) {
          return res.json({
            success: true,
            data: {
              id: data.id,
              userId: data.user_id,
              name: data.name,
              description: data.description,
              color: data.color,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime()
            },
            message: 'Collection created in database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase collection creation failed:', supabaseError.message);
      }
    }

    res.json({
      success: true,
      data: {
        id: 'collection_' + Date.now(),
        userId,
        name,
        description,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      message: 'Collection created locally'
    });

  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({
      error: 'Failed to create collection',
      message: error.message,
      success: false
    });
  }
};

const addCollectionItem = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { userId, name, url, method, headers, params, body, description } = req.body;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collection_items')
          .insert({
            collection_id: collectionId,
            user_id: userId,
            name,
            url,
            method,
            headers: headers ? JSON.stringify(headers) : null,
            params: params ? JSON.stringify(params) : null,
            body: body || null,
            description: description || null
          })
          .select()
          .single();

        if (!error) {
          await supabase
            .from('collections')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', collectionId);

          return res.json({
            success: true,
            data: {
              id: data.id,
              collectionId: data.collection_id,
              userId: data.user_id,
              name: data.name,
              url: data.url,
              method: data.method,
              headers: data.headers,
              params: data.params,
              body: data.body,
              description: data.description,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime()
            },
            message: 'Item added to collection in database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase item addition failed:', supabaseError.message);
      }
    }

    res.json({
      success: true,
      data: {
        id: 'item_' + Date.now(),
        collectionId,
        userId,
        name,
        url,
        method,
        headers: headers ? JSON.stringify(headers) : null,
        params: params ? JSON.stringify(params) : null,
        body: body || null,
        description: description || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      message: 'Item added to collection locally'
    });

  } catch (error) {
    console.error('Add to collection error:', error);
    res.status(500).json({
      error: 'Failed to add item to collection',
      message: error.message,
      success: false
    });
  }
};

module.exports = { getCollections, createCollection, addCollectionItem };
