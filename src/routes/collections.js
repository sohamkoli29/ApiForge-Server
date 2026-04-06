const express = require('express');
const router = express.Router();
const { getCollections, createCollection, addCollectionItem } = require('../controllers/collectionController');

router.get('/:userId', getCollections);
router.post('/', createCollection);
router.post('/:collectionId/items', addCollectionItem);

module.exports = router;
