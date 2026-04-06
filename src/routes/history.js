const express = require('express');
const router = express.Router();
const { saveHistory, getHistory } = require('../controllers/historyController');

router.post('/save', saveHistory);
router.get('/:userId', getHistory);

module.exports = router;
