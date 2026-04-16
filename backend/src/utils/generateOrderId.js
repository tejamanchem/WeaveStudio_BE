const crypto = require('crypto');

const generateOrderId = () => {
  const num = crypto.randomInt(10000, 99999);
  return `ORD${num}`;
};

module.exports = generateOrderId;
