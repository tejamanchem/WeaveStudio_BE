require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Admin = require('./src/models/Admin');

const products = [
  {
    name: 'Crochet Flower Garland — Red, White & Yellow',
    description: 'Handcrafted crochet flower garland in vibrant red, white, and yellow with pearl bead tassels. Perfect for festivals, weddings, home pooja, and all celebrations. Each garland is made with love using premium yarn.',
    price: 799,
    images: ['https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=500'],
    category: 'Garlands',
    stock: 15,
  },
  {
    name: 'Pink Crochet Rose — Decorative Flower',
    description: 'Beautiful handcrafted pink crochet rose with green leaves and pearl bead center. Made with soft premium yarn using a 4.0mm crochet hook. Perfect as a decorative piece, gift topper, or accessory base.',
    price: 199,
    images: ['https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=500'],
    category: 'Flowers',
    stock: 30,
  },
  {
    name: 'Crochet Sunflower Hair Clip',
    description: 'Adorable handmade crochet sunflower hair clip with a brown center and yellow petals. A cheerful, nature-inspired hair accessory perfect for everyday wear and special occasions.',
    price: 349,
    images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500'],
    category: 'Hair Accessories',
    stock: 20,
  },
  {
    name: 'Red Rose Pearl Drop Brooch',
    description: 'Stunning handcrafted red crochet rose brooch with green leaf base and elegant pearl bead dangles. A statement piece for sarees, dupattas, blazers, or bags.',
    price: 399,
    images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500'],
    category: 'Brooches',
    stock: 18,
  },
  {
    name: 'Adorned Traditions — Crochet Pooja Garland',
    description: 'Exquisite everlasting crochet garland in traditional red, green, and white. Handcrafted for festivals, weddings, home pooja, and celebrations. Each garland is made with love — never wilts, lasts forever.',
    price: 899,
    images: ['https://images.unsplash.com/photo-1464699908537-0954e50791ee?w=500'],
    category: 'Garlands',
    stock: 10,
  },
  {
    name: 'Burgundy Rose Hair Clip — Rose Gold',
    description: 'Elegant handmade burgundy/maroon crochet rose hair clip mounted on a premium rose gold alligator clip. Features green crochet leaves and a golden pearl bead center. A bestseller!',
    price: 349,
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
    category: 'Hair Accessories',
    stock: 25,
  },
  {
    name: 'Pink Rose Hair Clip — Best Seller',
    description: 'Our best-selling handcrafted pink crochet rose hair clip on a rose gold alligator clip with golden pearl bead center and green leaf base. Handcrafted, unique, and sustainable.',
    price: 349,
    images: ['https://images.unsplash.com/photo-1596568362805-4e4dbc2e69a7?w=500'],
    category: 'Hair Accessories',
    stock: 25,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weavestudio');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Admin.deleteMany({});
    console.log('Cleared existing data');

    // Seed products
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);

    // Create admin user
    await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@weavestudio.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    });
    console.log('Created admin user');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
