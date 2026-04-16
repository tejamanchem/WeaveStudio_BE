const express = require('express');
const router = express.Router();
const { placeOrder, trackOrder } = require('../controllers/orderController');

router.post('/', placeOrder);
router.get('/track', trackOrder);

module.exports = router;
