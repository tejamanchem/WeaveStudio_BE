const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { login } = require('../controllers/adminController');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getAllOrders, updateOrderStatus, deleteOrder } = require('../controllers/orderController');

// Auth
router.post('/login', login);

// Protected routes
router.use(auth);

// Products
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Image upload (Cloudinary)
router.post('/upload', upload.array('images', 5), (req, res) => {
  const urls = req.files.map(f => f.path);
  res.json({ urls });
});

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

module.exports = router;
