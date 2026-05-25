const TraceabilityRecord = require('./TraceabilityRecord');
const ScanHistory = require('./ScanHistory');
const Product = require('../products/Product');
const Certification = require('../certifications/Certification');
const { generateProductQRCode } = require('../../utils/qr');

// @desc    Record a new production lifecycle stage
// @route   POST /api/v1/traceability/record
// @access  Private (Farmer)
exports.recordStage = async (req, res, next) => {
  try {
    const { product, batchNumber, stage, locationDetails, temperature, humidity, notes, documents } = req.body;

    const productRecord = await Product.findById(product);
    if (!productRecord) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Ensure farmer owns the product listing
    if (productRecord.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to log traceability data for this product' });
    }

    const record = await TraceabilityRecord.create({
      product,
      batchNumber,
      stage,
      locationDetails,
      temperature,
      humidity,
      notes,
      documents: documents || [],
      recordedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a product by ID & log scan (QR landing endpoint)
// @route   GET /api/v1/traceability/verify/:productId
// @access  Public
exports.verifyProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // 1. Fetch product details
    const product = await Product.findById(productId).populate('farmer', 'profile.firstName profile.lastName profile.companyName profile.address');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product listing not found' });
    }

    // 2. Fetch approved certifications
    const certifications = await Certification.find({ product: productId, status: 'approved' });

    // 3. Fetch chronological traceability lifecycle records
    const history = await TraceabilityRecord.find({ product: productId })
      .sort({ timestamp: 1 })
      .populate('recordedBy', 'profile.firstName profile.lastName');

    // 4. Asynchronously log scan details to ScanHistory
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    // Asynchronously save scan history log (non-blocking)
    ScanHistory.create({
      product: productId,
      ipAddress,
      userAgent,
      locationDetails: req.query.location || 'Unknown Location'
    }).catch(err => console.error('❌ Failed to log scan history:', err));

    // Generate public QR code linking back to this verify page
    const hostUrl = req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3001';
    const qrCodeUrl = await generateProductQRCode(product._id, hostUrl);

    res.status(200).json({
      success: true,
      data: {
        product,
        certifications,
        history,
        qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get QR code for a product
// @route   GET /api/v1/traceability/qr/:productId
// @access  Private (Farmer)
exports.getQRCode = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Ensure farmer owns the product listing
    if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view this product QR code' });
    }

    // Derives client URL host dynamically from request headers (fallback to localhost:3000)
    const hostUrl = req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000';
    const qrDataUrl = await generateProductQRCode(product._id, hostUrl);

    res.status(200).json({
      success: true,
      qrCodeUrl: qrDataUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scan history for farmer dashboard
// @route   GET /api/v1/traceability/scans/:productId
// @access  Private (Farmer)
exports.getProductScans = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const scans = await ScanHistory.find({ product: req.params.productId }).sort({ scannedAt: -1 });

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    next(error);
  }
};
