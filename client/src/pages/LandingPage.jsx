import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, Check, RefreshCw, ShoppingCart, User, QrCode, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

const getCategoryBadgeStyles = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('herb')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (cat.includes('fruit')) return 'bg-amber-50 text-amber-900 border-amber-200';
  if (cat.includes('veg')) return 'bg-teal-50 text-teal-800 border-teal-200';
  if (cat.includes('grain')) return 'bg-orange-50 text-orange-950 border-orange-250';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export const LandingPage = () => {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [organic, setOrganic] = useState(false);
  const [gmoFree, setGmoFree] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Purchase/Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (category) params.category = category;
      if (qualityGrade) params.qualityGrade = qualityGrade;
      if (organic) params.organicCertified = 'true';
      if (gmoFree) params.gmoFree = 'true';
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await axios.get(`${API_URL}/products`, { params });
      setProducts(res.data.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch product listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, qualityGrade, organic, gmoFree]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategory('');
    setQualityGrade('');
    setOrganic(false);
    setGmoFree(false);
    setMinPrice('');
    setMaxPrice('');
    // Trigger fetch manually via timeout or rely on state effects
    setTimeout(fetchProducts, 50);
  };

  const handleOpenCheckout = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setCheckoutSuccess('');
    setCheckoutError('');
    // Pre-fill address if user profile has it
    if (user && user.profile?.address) {
      setStreet(user.profile.address.street || '');
      setCity(user.profile.address.city || '');
      setPostalCode(user.profile.address.postalCode || '');
      setCountry(user.profile.address.country || '');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (!token) {
      setCheckoutError('Please log in as a buyer to complete your purchase.');
      return;
    }

    if (user && user.role !== 'buyer') {
      setCheckoutError('Only registered buyers can place purchases.');
      return;
    }

    try {
      const orderPayload = {
        items: [
          {
            product: selectedProduct._id,
            quantity: Number(orderQuantity)
          }
        ],
        shippingAddress: { street, city, postalCode, country }
      };

      const res = await axios.post(`${API_URL}/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCheckoutSuccess(`Order placed successfully! Order Number: ${res.data.data.orderNumber}`);
        // Refresh product details/listings
        fetchProducts();
        setTimeout(() => setSelectedProduct(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.error || 'Failed to place order.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner with Stats */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 rounded-2xl p-8 md:p-12 text-white shadow-md mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <span className="bg-green-600/50 border border-green-400/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-4">
            <Star className="w-3.5 h-3.5 fill-current" /> Verified Farm-to-Buyer Marketplace
          </span>
          <h1 className="text-3xl md:text-5xl font-black mt-2 mb-4 leading-tight">Verified Crops Sourced Direct</h1>
          <p className="text-md md:text-lg text-primary-50 max-w-xl mb-8 leading-relaxed">
            Purchase certified organic and GMO-free agricultural products directly from verified farmers with scan-ready product traceability.
          </p>

          {/* Marketplace Stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6 max-w-lg mb-8">
            <div>
              <p className="text-2xl md:text-3xl font-black tracking-tight">45+</p>
              <p className="text-[10px] md:text-xs text-primary-100 font-medium uppercase tracking-wider mt-0.5">Verified Farmers</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black tracking-tight">180+</p>
              <p className="text-[10px] md:text-xs text-primary-100 font-medium uppercase tracking-wider mt-0.5">Active Listings</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black tracking-tight">2,400+</p>
              <p className="text-[10px] md:text-xs text-primary-100 font-medium uppercase tracking-wider mt-0.5">QR Verified Scans</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              href="#marketplace-section"
              className="bg-white hover:bg-slate-100 text-emerald-950 px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all duration-200"
            >
              Browse Products
            </a>
            <a
              href="#traceability-info-section"
              className="bg-green-700/40 hover:bg-green-750/50 border border-green-400/30 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-200"
            >
              How Verification Works
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="marketplace-section">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-slate-500" />
                <span>Filters</span>
              </h2>
              <button onClick={handleResetFilters} className="text-xs text-primary-600 hover:text-primary-800 font-semibold">
                Reset All
              </button>
            </div>

            <div className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Grains">Grains</option>
                </select>
              </div>

              {/* Quality Grade */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={e => setQualityGrade(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All Grades</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>

              {/* Price Limits */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Price Limit</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={fetchProducts}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 mt-2 py-1.5 rounded-lg text-xs font-medium"
                >
                  Apply Price
                </button>
              </div>

              {/* Verification Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-150">
                <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={organic}
                    onChange={e => setOrganic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-650 focus:ring-primary-500"
                  />
                  <span>Organic Certified</span>
                </label>

                <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gmoFree}
                    onChange={e => setGmoFree(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-650 focus:ring-primary-500"
                  />
                  <span>GMO-Free</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Display */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search crops by name, category, farmer name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors"
            >
              Search
            </button>
          </form>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mb-4" />
              <p>Fetching active marketplace listings...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">{error}</div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <p className="text-lg font-medium mb-1">No products match your search</p>
              <p className="text-sm">Try resetting filters or adjusting search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    {/* Image */}
                    <div className="h-44 bg-slate-100 relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2f622b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                          <Sprout className="w-10 h-10 text-primary-600/30 mb-1 relative z-10" />
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400/80 relative z-10">Crop Listing</span>
                        </div>
                      )}

                      {/* Quality Grade Label */}
                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-sm border ${
                        product.qualityGrade === 'A'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : product.qualityGrade === 'B'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-amber-600 text-white border-amber-500'
                      }`}>
                        Grade {product.qualityGrade}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadgeStyles(product.category)}`}>
                        {product.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg mt-3 mb-1.5 leading-snug">{product.name}</h3>

                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {product.farmer?.profile?.companyName || `${product.farmer?.profile?.firstName} ${product.farmer?.profile?.lastName}`}
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description}</p>

                      {/* Certification Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {product.organicCertified && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-600" /> Organic
                          </span>
                        )}
                        {product.gmoFree && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-150 flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-blue-600" /> GMO-Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="p-5 pt-0 border-t border-slate-55 flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Price per {product.unitOfMeasure}</p>
                      <p className="text-xl font-extrabold text-slate-900">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/trace/${product._id}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-center transition-colors"
                      >
                        Trace
                      </Link>
                      <button
                        onClick={() => handleOpenCheckout(product)}
                        disabled={product.stockQuantity === 0}
                        className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1 ${
                          product.stockQuantity === 0
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-primary-500 hover:bg-primary-600'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{product.stockQuantity === 0 ? 'Sold Out' : 'Buy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Complete Purchase</h3>

            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg mb-4">
              <div className="w-16 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={selectedProduct.images[0].startsWith('http') ? selectedProduct.images[0] : `http://localhost:5000${selectedProduct.images[0]}`}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{selectedProduct.name}</h4>
                <p className="text-xs text-slate-500">Grade {selectedProduct.qualityGrade} &bull; {selectedProduct.unitOfMeasure}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">${selectedProduct.price} / {selectedProduct.unitOfMeasure}</p>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stockQuantity}
                  value={orderQuantity}
                  onChange={e => setOrderQuantity(Math.min(selectedProduct.stockQuantity, Math.max(1, Number(e.target.value))))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400">Available: {selectedProduct.stockQuantity} {selectedProduct.unitOfMeasure}</span>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shipping Details</label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-900 font-bold mb-4">
                <span>Total Amount:</span>
                <span className="text-xl text-primary-600">${(selectedProduct.price * orderQuantity).toFixed(2)}</span>
              </div>

              {checkoutSuccess && <div className="bg-green-50 text-green-700 p-2.5 rounded-lg text-xs">{checkoutSuccess}</div>}
              {checkoutError && <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs">{checkoutError}</div>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* QR Traceability Highlight Section */}
      <div className="bg-slate-100 border-y border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 my-12 py-12 px-4 sm:px-6 lg:px-8" id="traceability-info-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-primary-600 font-bold text-xs uppercase tracking-widest block mb-2">Platform Differentiator</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">QR-Based Product Verification</h2>
            <p className="text-slate-500 text-sm mt-2">
              Every crop listing in the Veritas marketplace features a scan code. 
              Scan to view the exact production path directly from the farm source.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-start gap-4 hover:border-slate-350 transition-colors">
              <div className="bg-primary-50 text-primary-600 rounded-lg p-3 font-bold text-lg flex items-center justify-center w-12 h-12 flex-shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 text-sm mb-1">1. Scan the QR Code</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Every product listing includes a unique verify code that links to the supply chain records.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-start gap-4 hover:border-slate-350 transition-colors">
              <div className="bg-primary-50 text-primary-600 rounded-lg p-3 font-bold text-lg flex items-center justify-center w-12 h-12 flex-shrink-0">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 text-sm mb-1">2. View Product Timeline</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Track every stage recorded directly by the farmer: seed selection, cultivation, and harvesting.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-start gap-4 hover:border-slate-350 transition-colors">
              <div className="bg-primary-50 text-primary-600 rounded-lg p-3 font-bold text-lg flex items-center justify-center w-12 h-12 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 text-sm mb-1">3. Verify Crop Origin</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Verify approved certifications (Organic, GMO-free) and audit logs (scan history details).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
