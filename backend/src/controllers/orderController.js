const Order = require('../models/Order');
const Product = require('../models/Product');
const { createOrder } = require('../services/orderService');

// POST /orders
exports.placeOrder = async (req, res, next) => {
  try {
    const { customerName, phone, email, address, items } = req.body;

    if (!customerName || !phone || !email || !address || !items?.length) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const order = await createOrder({ customerName, phone, email, address, items });
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /orders/track?orderId=xxx or ?phone=xxx
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId, phone } = req.query;

    if (!orderId && !phone) {
      return res.status(400).json({ message: 'Provide orderId or phone to track' });
    }

    const filter = {};
    if (orderId) filter.orderId = orderId.toUpperCase();
    if (phone) filter.phone = phone;

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found' });
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/orders/:id
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PLACED', 'SHIPPED', 'DELIVERED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/orders/:id
exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore product stock for each ordered item
    if (order.items && order.items.length > 0) {
      await Promise.all(
        order.items.map(async (item) => {
          if (item.productId && item.quantity) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity },
            });
          }
        })
      );
    }

    // Delete the order record
    await Order.findByIdAndDelete(id);

    res.json({
      message: 'Order and associated records deleted successfully',
      orderId: order.orderId,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
