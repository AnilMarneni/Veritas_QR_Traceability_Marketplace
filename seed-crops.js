const mongoose = require('./server/node_modules/mongoose');
const bcrypt = require('./server/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017/veritas';

// Create dummy files so they exist on local disk
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

fs.writeFileSync(path.join(uploadsDir, 'verification_doc.png'), 'dummy verification doc');
fs.writeFileSync(path.join(uploadsDir, 'usda_cert.pdf'), 'dummy usda cert');

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;

  // Clear existing collections to clean up duplicates
  console.log('Clearing old database records...');
  await db.collection('users').deleteMany({});
  await db.collection('products').deleteMany({});
  await db.collection('certifications').deleteMany({});
  await db.collection('tracerecords').deleteMany({});
  await db.collection('orders').deleteMany({});
  await db.collection('scanlogs').deleteMany({});

  console.log('Database cleared.');

  // Create Farmer
  const hashedPassword = await bcrypt.hash('password123', 10);
  const farmerEmail = 'farmer@example.com';
  
  const farmerResult = await db.collection('users').insertOne({
    email: farmerEmail,
    password: hashedPassword,
    role: 'farmer',
    farmerVerificationStatus: 'verified',
    verificationDocumentUrl: '/uploads/verification_doc.png',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      companyName: 'Doe Farms Inc',
      address: {
        street: '123 Farm Rd',
        city: 'Salinas',
        state: 'CA',
        postalCode: '93901',
        country: 'USA'
      }
    },
    createdAt: new Date()
  });

  const farmerId = farmerResult.insertedId;
  console.log('Verified Farmer created with ID:', farmerId);

  // Create Crop 1: Organic Turmeric
  const turmericResult = await db.collection('products').insertOne({
    farmer: farmerId,
    name: 'Organic Turmeric',
    description: 'Premium-grade raw organic turmeric roots, harvested fresh. Ideal for spices and herbal extracts.',
    category: 'Herbs',
    sku: 'PROD-TURMERIC1',
    price: 15.00,
    unitOfMeasure: 'kg',
    stockQuantity: 120,
    organicCertified: true,
    gmoFree: true,
    qualityGrade: 'A',
    harvestDate: new Date('2026-05-18'),
    images: ['/uploads/organic_turmeric.png'],
    status: 'active',
    createdAt: new Date()
  });

  const turmericId = turmericResult.insertedId;
  console.log('Organic Turmeric created with ID:', turmericId);

  // Create Crop 2: Organic Ginger
  const gingerResult = await db.collection('products').insertOne({
    farmer: farmerId,
    name: 'Organic Ginger',
    description: 'Premium organic ginger root. Strong spice aroma, cleaned and dried.',
    category: 'Herbs',
    sku: 'PROD-GINGER2',
    price: 12.50,
    unitOfMeasure: 'kg',
    stockQuantity: 200,
    organicCertified: true,
    gmoFree: true,
    qualityGrade: 'A',
    harvestDate: new Date('2026-05-19'),
    images: ['/uploads/organic_ginger.png'],
    status: 'active',
    createdAt: new Date()
  });

  const gingerId = gingerResult.insertedId;
  console.log('Organic Ginger created with ID:', gingerId);

  // Create Certification 1 for Turmeric
  await db.collection('certifications').insertOne({
    product: turmericId,
    farmer: farmerId,
    certificationType: 'Organic',
    certificateNumber: 'USDA-TURM-101',
    issuingAuthority: 'USDA Organic California',
    expiryDate: new Date('2028-12-31'),
    certificateFile: '/uploads/usda_cert.pdf',
    status: 'approved',
    reviewNotes: 'Verified USDA cert from seed script.',
    createdAt: new Date()
  });

  // Create Certification 2 for Ginger
  await db.collection('certifications').insertOne({
    product: gingerId,
    farmer: farmerId,
    certificationType: 'Organic',
    certificateNumber: 'USDA-GING-202',
    issuingAuthority: 'USDA Organic California',
    expiryDate: new Date('2028-12-31'),
    certificateFile: '/uploads/usda_cert.pdf',
    status: 'approved',
    reviewNotes: 'Verified USDA cert from seed script.',
    createdAt: new Date()
  });

  console.log('Approved Certifications created.');

  // Create Traceability Stage 1 for Turmeric
  await db.collection('tracerecords').insertOne({
    product: turmericId,
    batchNumber: 'BATCH-TURM-01',
    stage: 'harvest',
    locationDetails: 'Finca Doe, Salinas valley, CA',
    temperature: 24,
    humidity: 60,
    notes: 'Hand-picked organic turmeric root, washed and prepared.',
    recordedAt: new Date()
  });

  // Create Traceability Stage 1 for Ginger
  await db.collection('tracerecords').insertOne({
    product: gingerId,
    batchNumber: 'BATCH-GING-01',
    stage: 'harvest',
    locationDetails: 'Finca Doe, Salinas valley, CA',
    temperature: 23,
    humidity: 65,
    notes: 'Premium ginger roots harvested, washed and sorted.',
    recordedAt: new Date()
  });

  console.log('Traceability timeline stages created.');

  await mongoose.disconnect();
  console.log('MongoDB Seed Finished Successfully.');
}

seed().catch(err => {
  console.error('Seeding crashed:', err);
});
