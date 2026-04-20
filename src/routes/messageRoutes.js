const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.all('/', messageController.getMessage);

module.exports = router;
