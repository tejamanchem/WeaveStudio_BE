const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOrderNotification = async (order) => {
  try {
    const transporter = createTransporter();

    const itemRows = order.items
      .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td></tr>`)
      .join('');

    const html = `
      <h2>New Order Received - ${order.orderId}</h2>
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <h3>Order Items</h3>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <h3>Total: ₹${order.totalAmount}</h3>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: `New Order ${order.orderId} - WeaveStudio`,
      html,
    });

    console.log(`Order notification email sent for ${order.orderId}`);
  } catch (error) {
    console.error('Failed to send order email:', error.message);
    // Don't throw - email failure shouldn't block order creation
  }
};

module.exports = { sendOrderNotification };
