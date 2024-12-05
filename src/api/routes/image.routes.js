const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/image/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;