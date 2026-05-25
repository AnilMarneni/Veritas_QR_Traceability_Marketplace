const Product = require('./Product');

// @desc    Create a new product listing (draft)
// @route   POST /api/v1/products
// @access  Private (Verified Farmer)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, unitOfMeasure, stockQuantity, organicCertified, gmoFree, qualityGrade, harvestDate } = req.body;

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(file.path || `/uploads/${file.filename}`);
      });
    }

    const product = await Product.create({
      farmer: req.user._id,
      name,
      description,
      category,
      price,
      unitOfMeasure,
      stockQuantity,
      organicCertified: organicCertified === 'true' || organicCertified === true,
      gmoFree: gmoFree === 'true' || gmoFree === true,
      qualityGrade,
      harvestDate,
      images,
      status: 'draft' // default is draft, requires active toggle
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active product listings with filters
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { query, category, minPrice, maxPrice, organicCertified, gmoFree, qualityGrade, farmer, status } = req.query;

    const filter = {};
    if (farmer) {
      filter.farmer = farmer;
    }
    if (status) {
      filter.status = status;
    } else if (!farmer) {
      // General public only sees active products
      filter.status = 'active';
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (organicCertified) {
      filter.organicCertified = organicCertified === 'true';
    }

    if (gmoFree) {
      filter.gmoFree = gmoFree === 'true';
    }

    if (qualityGrade) {
      filter.qualityGrade = qualityGrade;
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).populate('farmer', 'profile.firstName profile.lastName profile.companyName');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product details by ID
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'profile.firstName profile.lastName profile.companyName profile.address');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product listing not found' });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product listing (Owner Farmer only)
// @route   PUT /api/v1/products/:id
// @access  Private (Farmer)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product listing not found' });
    }

    // Ensure user is the owner farmer
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this product listing' });
    }

    const { name, description, category, price, unitOfMeasure, stockQuantity, organicCertified, gmoFree, qualityGrade, harvestDate, status } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (price) updates.price = price;
    if (unitOfMeasure) updates.unitOfMeasure = unitOfMeasure;
    if (stockQuantity !== undefined) updates.stockQuantity = stockQuantity;
    if (organicCertified !== undefined) updates.organicCertified = organicCertified === 'true' || organicCertified === true;
    if (gmoFree !== undefined) updates.gmoFree = gmoFree === 'true' || gmoFree === true;
    if (qualityGrade) updates.qualityGrade = qualityGrade;
    if (harvestDate) updates.harvestDate = harvestDate;
    if (status) updates.status = status;

    if (req.files && req.files.length > 0) {
      updates.images = [];
      req.files.forEach(file => {
        updates.images.push(file.path || `/uploads/${file.filename}`);
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product listing (Owner Farmer only)
// @route   DELETE /api/v1/products/:id
// @access  Private (Farmer)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product listing not found' });
    }

    // Ensure user is the owner farmer
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this product listing' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
