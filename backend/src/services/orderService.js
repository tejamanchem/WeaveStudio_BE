const Order = require('../models/Order');
const Product = require('../models/Product');
const generateOrderId = require('../utils/generateOrderId');
const { sendOrderNotification } = require('./emailService');

const createOrder = async ({ customerName, phone, email, address, items }) => {
  // Validate and enrich items with current prices
  const enrichedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
    }

    enrichedItems.push({
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
    });

    totalAmount += product.price * item.quantity;

    // Decrement stock
    product.stock -= item.quantity;
    await product.save();
  }

  // Generate unique order ID
  let orderId;
  let exists = true;
  while (exists) {
    orderId = generateOrderId();
    exists = await Order.findOne({ orderId });
  }

  const order = await Order.create({
    orderId,
    customerName,
    phone,
    email,
    address,
    items: enrichedItems,
    totalAmount,
    status: 'PLACED',
  });

  // Send email notification (non-blocking)
  sendOrderNotification(order);

  return order;
};

module.exports = { createOrder };
