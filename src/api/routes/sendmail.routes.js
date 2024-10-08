const express = require('express');
const { sendmailHandler } = require('../controllers/sendmail.controller.js');

const router = express.Router();

router.post('/api/sendmail', sendmailHandler);

module.exports = router;