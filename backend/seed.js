require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Admin = require('./src/models/Admin');

const products = [
  {
    name: 'Heritage Teddy Bear Plush',
    description: 'Hand-knitted vintage teddy bear made with 100% fine wool yarn, stitched snout, and cozy jointed limbs.',
    price: 899,
    images: ['/products/crochet-teddy-bear.jpg'],
    category: 'Plush & Amigurumi',
    stock: 12,
  },
  {
    name: 'Blossom Atelier Flower Bouquet',
    description: 'Everlasting bouquet of crochet roses, tulips, and daisies tied with natural jute twine.',
    price: 799,
    images: ['/products/crochet-flower-bouquet.jpg', '/categories/crochet-flowers.jpg'],
    category: 'Flowers',
    stock: 18,
  },
  {
    name: 'Woven Daisy Raffia Handbag',
    description: 'Artisan structured tote featuring daisy needlework squares and reinforced bamboo-look handles.',
    price: 1249,
    images: ['/products/crochet-handbag.jpg'],
    category: 'Bags & Pouches',
    stock: 8,
  },
  {
    name: 'Whimsical Calico Cat Amigurumi',
    description: 'Charming desktop companion with hand-stitched whiskers, curled tail, and blushing cotton cheeks.',
    price: 549,
    images: ['/products/crochet-cat.jpg'],
    category: 'Plush & Amigurumi',
    stock: 15,
  },
  {
    name: 'Velvet-Eared Fluffy Bunny',
    description: 'Ultra-soft cream milk cotton bunny with long floppy ears and miniature crochet bow.',
    price: 649,
    images: ['/products/crochet-bunny.jpg'],
    category: 'Plush & Amigurumi',
    stock: 14,
  },
  {
    name: 'Woodland Forest Mushroom Duo',
    description: 'Charming forest mushroom pair with textured ivory gills and embroidered crimson cap.',
    price: 449,
    images: ['/products/crochet-mushroom.jpg'],
    category: 'Home Decor',
    stock: 22,
  },
  {
    name: 'Sun-Drenched Pocket Sunflower',
    description: 'Cheerful golden bloom featuring textured seed stitch center and flexible stem.',
    price: 349,
    images: ['/products/crochet-sunflower.jpg'],
    category: 'Flowers',
    stock: 25,
  },
  {
    name: 'Little Waddle Yellow Duckling',
    description: 'Adorable round duckling with soft saffron beak and cuddly palm-sized silhouette.',
    price: 399,
    images: ['/products/crochet-duck.jpg'],
    category: 'Plush & Amigurumi',
    stock: 16,
  },
  {
    name: 'Berry Sweet Garden Strawberry',
    description: 'Juicy textured strawberry charm with white seed embroidery and vibrant leaf calyx.',
    price: 249,
    images: ['/products/crochet-strawberry.jpg'],
    category: 'Keychains & Charms',
    stock: 30,
  },
  {
    name: 'Crimson Needlework Heart',
    description: 'Sculpted 3D crochet heart filled with hypoallergenic organic cotton wool.',
    price: 299,
    images: ['/products/crochet-heart.jpg'],
    category: 'Keychains & Charms',
    stock: 24,
  },
  {
    name: 'Starry Forest Frog Mascot',
    description: 'Quirky cottagecore frog mascot with curious eyes and a hand-knitted mini lavender scarf.',
    price: 499,
    images: ['/products/crochet-plush-character.jpg'],
    category: 'Plush & Amigurumi',
    stock: 11,
  },
  {
    name: 'Boho Mandala Coaster Set',
    description: 'Intricate concentric crochet mandala with scalloped border and natural wooden ring.',
    price: 599,
    images: ['/products/crochet-decorative-home.jpg'],
    category: 'Home Decor',
    stock: 14,
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
