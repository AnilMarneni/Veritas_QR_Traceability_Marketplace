const fs = require('fs');
const path = require('path');

const PORT = 5000;
const API_URL = `http://localhost:${PORT}/api/v1`;

// Helper: Make HTTP request using standard fetch
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { error: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// Helper: Setup multipart form upload using fetch FormData
async function uploadFile(endpoint, filePath, fieldName, bodyFields = {}, token = '') {
  const FormData = global.FormData;
  const form = new FormData();

  // Read file as Blob
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  form.append(fieldName, blob, path.basename(filePath));

  // Add other body fields
  for (const [key, val] of Object.entries(bodyFields)) {
    form.append(key, val);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    body: form,
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do NOT set Content-Type header; fetch will set it automatically with boundary string
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { error: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function runTests() {
  console.log('🚀 Starting end-to-end verification of the Veritas MERN application...');
  let mongoose;

  // Create a dummy image for testing uploads
  const testImagePath = path.join(__dirname, 'test-doc.png');
  fs.writeFileSync(testImagePath, 'fake image content');

  try {
    // ----------------------------------------------------
    // 1. REGISTER USERS
    // ----------------------------------------------------
    console.log('\n--- 1. User Registration ---');
    
    const suffix = Math.random().toString(36).substr(2, 5);
    const farmerEmail = `farmer-${suffix}@example.com`;
    const buyerEmail = `buyer-${suffix}@example.com`;
    const adminEmail = `admin-${suffix}@example.com`;

    // A. Farmer
    const regFarmer = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: farmerEmail,
        password: 'password123',
        role: 'farmer',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        companyName: 'Doe Farms Inc',
        address: { street: '123 Farm Rd', city: 'Salinas', state: 'CA', postalCode: '93901', country: 'USA' }
      })
    });
    console.log(`Farmer Registered: ${regFarmer.ok ? '✅' : '❌'} (Status: ${regFarmer.status})`);
    if (!regFarmer.ok) throw new Error(`Farmer registration failed: ${JSON.stringify(regFarmer.data)}`);

    // B. Buyer
    const regBuyer = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: buyerEmail,
        password: 'password123',
        role: 'buyer',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        address: { street: '456 Market St', city: 'San Francisco', state: 'CA', postalCode: '94103', country: 'USA' }
      })
    });
    console.log(`Buyer Registered: ${regBuyer.ok ? '✅' : '❌'} (Status: ${regBuyer.status})`);

    // C. Admin (Admin is normally created via seeding or direct DB, but we allow user model role check or default)
    // Wait, let's verify if admin registration is allowed. In authController: "role && !['farmer', 'buyer'].includes(role) -> Invalid role".
    // So admin registration is not open to public API.
    // Let's create the admin by registering as a buyer, and then we will update the role in MongoDB directly if needed,
    // or register normal admin. Let's see if admin is already seeded or if we can make a bypass?
    // Wait, does server have a seed script or is there an admin user we can use? Let's check server database connection or User schema.
    // Let's register a user, then connect to mongodb and update their role to admin! This is robust and mimics a real admin seeding.
    const regAdmin = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: adminEmail,
        password: 'password123',
        role: 'buyer', // register as buyer first
        firstName: 'System',
        lastName: 'Admin',
        phone: '1112223333'
      })
    });
    console.log(`Admin User Registered: ${regAdmin.ok ? '✅' : '❌'}`);

    // Update the admin user's role to 'admin' directly in MongoDB
    mongoose = require('./server/node_modules/mongoose');
    await mongoose.connect('mongodb://localhost:27017/veritas');
    const User = require('./server/modules/users/User');
    await User.findByIdAndUpdate(regAdmin.data.user.id, { role: 'admin' });
    console.log('👑 Admin user role successfully seeded to "admin" in MongoDB.');

    // ----------------------------------------------------
    // 2. LOGIN
    // ----------------------------------------------------
    console.log('\n--- 2. User Logins ---');

    const farmerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: farmerEmail, password: 'password123' })
    });
    const farmerToken = farmerLogin.data.token;
    console.log(`Farmer Login: ${farmerLogin.ok ? '✅' : '❌'} token generated`);

    const buyerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: buyerEmail, password: 'password123' })
    });
    const buyerToken = buyerLogin.data.token;
    console.log(`Buyer Login: ${buyerLogin.ok ? '✅' : '❌'} token generated`);

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: 'password123' })
    });
    const adminToken = adminLogin.data.token;
    console.log(`Admin Login: ${adminLogin.ok ? '✅' : '❌'} token generated`);

    // ----------------------------------------------------
    // 3. UNVERIFIED FARMER PRODUCT RESTRICTION
    // ----------------------------------------------------
    console.log('\n--- 3. Unverified Farmer Restrictions ---');

    const draftProduct = await request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Organic Turmeric',
        description: 'Fresh organic turmeric harvest',
        category: 'Herbs',
        price: 15.00,
        unitOfMeasure: 'kg',
        stockQuantity: 10,
        qualityGrade: 'A'
      }),
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });
    console.log(`Create product before verification: (Status: ${draftProduct.status}) (Expected: 400 or 403)`);
    console.log(`Response message: "${draftProduct.data.error || 'Success?'}"`);

    // ----------------------------------------------------
    // 4. FARMER VERIFICATION PIPELINE
    // ----------------------------------------------------
    console.log('\n--- 4. Farmer Verification Upload & Approval ---');

    const uploadRes = await uploadFile('/users/verification', testImagePath, 'document', {}, farmerToken);
    console.log(`Farmer uploads verification document: ${uploadRes.ok ? '✅' : '❌'} (Status: ${uploadRes.status})`);
    if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadRes.data)}`);

    // Fetch pending verifications as Admin
    const pendingFarmers = await request('/admin/verification', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Admin fetches pending farmers: ${pendingFarmers.ok ? '✅' : '❌'} (${pendingFarmers.data.count} pending)`);

    // Approve the farmer
    const approveRes = await request(`/admin/verification/${regFarmer.data.user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'verified' }),
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Admin approves farmer verification: ${approveRes.ok ? '✅' : '❌'} (Status: ${approveRes.status})`);

    // Relogin farmer to refresh verification status
    const farmerLogin2 = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: farmerEmail, password: 'password123' })
    });
    const verifiedFarmerToken = farmerLogin2.data.token;
    console.log(`Farmer verification status: "${farmerLogin2.data.user.farmerVerificationStatus}"`);

    // ----------------------------------------------------
    // 5. PRODUCT & CERTIFICATION LIFECYCLE
    // ----------------------------------------------------
    console.log('\n--- 5. Product Creation & Certification ---');

    // Create product crop draft
    const createProd = await request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Organic Turmeric',
        description: 'Fresh organic turmeric harvest',
        category: 'Herbs',
        price: 15.00,
        unitOfMeasure: 'kg',
        stockQuantity: 10,
        qualityGrade: 'A'
      }),
      headers: { 'Authorization': `Bearer ${verifiedFarmerToken}` }
    });
    const productId = createProd.data.data._id;
    console.log(`Farmer creates product listing: ${createProd.ok ? '✅' : '❌'} (ID: ${productId}, Status: ${createProd.data.data.status})`);

    // Submit certification
    const certUpload = await uploadFile('/certifications', testImagePath, 'certificateFile', {
      product: productId,
      certificationType: 'Organic',
      certificateNumber: 'CERT-TURM-123',
      issuingAuthority: 'USDA California',
      expiryDate: '2028-12-31'
    }, verifiedFarmerToken);
    const certId = certUpload.data.data._id;
    console.log(`Farmer submits certification request: ${certUpload.ok ? '✅' : '❌'} (ID: ${certId})`);

    // Admin approves certification
    const approveCert = await request(`/admin/certifications/${certId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Admin approves certification: ${approveCert.ok ? '✅' : '❌'} (Status: ${approveCert.status})`);

    // Publish crop to active
    const publishProd = await request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
      headers: { 'Authorization': `Bearer ${verifiedFarmerToken}` }
    });
    console.log(`Farmer publishes product crop to active: ${publishProd.ok ? '✅' : '❌'} (Status: ${publishProd.data.data.status})`);

    // ----------------------------------------------------
    // 6. CONCURRENT ORDER CHECKOUT TESTING (Preventing Stock Inconsistencies)
    // ----------------------------------------------------
    console.log('\n--- 6. Concurrent Order Placement (Atomic Stocks) ---');

    console.log(`Initial Product Stock Level: 10 units`);

    // Buyer A places order for 6 units
    const orderPromise1 = request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ product: productId, quantity: 6 }],
        shippingAddress: { street: '100 Green Ave', city: 'Sacremento', postalCode: '95814', country: 'USA' }
      }),
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    // Buyer B concurrently places order for 6 units
    const orderPromise2 = request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ product: productId, quantity: 6 }],
        shippingAddress: { street: '200 Blue Blvd', city: 'Sacremento', postalCode: '95814', country: 'USA' }
      }),
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    // Run simultaneously
    const [res1, res2] = await Promise.all([orderPromise1, orderPromise2]);

    console.log(`Order A response: ${res1.ok ? '✅ SUCCESS' : '❌ FAILED'} (Status: ${res1.status}, Error: ${res1.data.error || 'none'})`);
    console.log(`Order B response: ${res2.ok ? '✅ SUCCESS' : '❌ FAILED'} (Status: ${res2.status}, Error: ${res2.data.error || 'none'})`);

    // Verify stock is not negative and exactly one request succeeded
    const checkProduct = await request(`/products/${productId}`);
    const remainingStock = checkProduct.data.data.stockQuantity;
    console.log(`Remaining stock level: ${remainingStock} units`);

    const totalOrdersPlaced = (res1.ok ? 1 : 0) + (res2.ok ? 1 : 0);
    if (totalOrdersPlaced === 1 && remainingStock === 4) {
      console.log('🎉 Concurrency check PASSED! Stock inconsistencies prevented during simultaneous checkouts.');
    } else {
      console.error('❌ Concurrency check FAILED! Overselling occurred or final stock did not match.');
    }

    // ----------------------------------------------------
    // 7. TRACEABILITY LEDGER & SCAN LOGGING
    // ----------------------------------------------------
    console.log('\n--- 7. Traceability Lifecycle & Scan History ---');

    // Add production stage log
    const traceRecord = await request('/traceability/record', {
      method: 'POST',
      body: JSON.stringify({
        product: productId,
        batchNumber: 'BATCH-TURM-01',
        stage: 'harvest',
        locationDetails: 'Finca Doe, Salinas valley, CA',
        temperature: 24,
        humidity: 62,
        notes: 'Hand-picked turmeric root, washed and prepared'
      }),
      headers: { 'Authorization': `Bearer ${verifiedFarmerToken}` }
    });
    console.log(`Farmer logs harvest lifecycle stage: ${traceRecord.ok ? '✅' : '❌'}`);

    // Verify page scanner verify endpoint (with location query)
    const scanLoc = '36.6777, -121.6555 (Mock Consumer GPS)';
    const scanVerify = await request(`/traceability/verify/${productId}?location=${encodeURIComponent(scanLoc)}`);
    console.log(`Consumer scans crop verify QR: ${scanVerify.ok ? '✅' : '❌'}`);
    console.log(`Verify timeline records count: ${scanVerify.data.data.history.length}`);
    console.log(`Verify approved certifications: ${scanVerify.data.data.certifications.length}`);

    // Fetch scan history as Farmer to verify audit registration
    const scanHistory = await request(`/traceability/scans/${productId}`, {
      headers: { 'Authorization': `Bearer ${verifiedFarmerToken}` }
    });
    console.log(`Farmer checks scan logs: ${scanHistory.ok ? '✅' : '❌'} (${scanHistory.data.count} scans logged)`);
    if (scanHistory.data.data && scanHistory.data.data.length > 0) {
      console.log(`Last logged scan location: "${scanHistory.data.data[0].locationDetails}"`);
    }

  } catch (err) {
    console.error('❌ Integration testing crashed:', err);
  } finally {
    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    if (mongoose) {
      await mongoose.disconnect();
    }
    console.log('\n🚪 E2E Verification script finished execution.');
  }
}

runTests();
