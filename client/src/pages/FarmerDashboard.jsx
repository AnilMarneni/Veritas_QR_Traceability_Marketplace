import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sprout, FileCheck, Shield, Clipboard, Plus, RefreshCw, BarChart2, CheckCircle2, Download } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/v1';

export const FarmerDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('verification');

  // Verification Upload State
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState('');

  // Products state
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New Product form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Herbs');
  const [price, setPrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('kg');
  const [stockQuantity, setStockQuantity] = useState('');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [harvestDate, setHarvestDate] = useState('');
  const [organic, setOrganic] = useState(false);
  const [gmoFree, setGmoFree] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [newProductMsg, setNewProductMsg] = useState('');
  const [newProductLoading, setNewProductLoading] = useState(false);

  // QR Code state
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Traceability Record state
  const [traceProduct, setTraceProduct] = useState('');
  const [traceBatch, setTraceBatch] = useState('');
  const [traceStage, setTraceStage] = useState('seed');
  const [traceLocation, setTraceLocation] = useState('');
  const [traceTemp, setTraceTemp] = useState('');
  const [traceHumidity, setTraceHumidity] = useState('');
  const [traceNotes, setTraceNotes] = useState('');
  const [traceMsg, setTraceMsg] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);

  // Certification state
  const [certProduct, setCertProduct] = useState('');
  const [certType, setCertType] = useState('Organic');
  const [certNumber, setCertNumber] = useState('');
  const [certAuthority, setCertAuthority] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [certMsg, setCertMsg] = useState('');
  const [certLoading, setCertLoading] = useState(false);

  // Received Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Stats / Scans state
  const [scanStats, setScanStats] = useState([]);
  const [statsProduct, setStatsProduct] = useState('');

  const fetchMyProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`);
      // Filter products belonging to this farmer
      const filtered = res.data.data.filter(p => p.farmer && p.farmer._id === user.id);
      setMyProducts(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchReceivedOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchMyProducts();
      fetchReceivedOrders();
    }
  }, [token, user]);

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationFile) return;

    setVerificationLoading(true);
    setVerificationMsg('');
    try {
      const formData = new FormData();
      formData.append('document', verificationFile);

      const res = await axios.post(`${API_URL}/users/verification`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setVerificationMsg('Verification document uploaded successfully.');
      await refreshUser();
    } catch (err) {
      console.error(err);
      setVerificationMsg(err.response?.data?.error || 'Upload failed.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setNewProductLoading(true);
    setNewProductMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('unitOfMeasure', unitOfMeasure);
      formData.append('stockQuantity', stockQuantity);
      formData.append('qualityGrade', qualityGrade);
      formData.append('harvestDate', harvestDate);
      formData.append('organicCertified', organic);
      formData.append('gmoFree', gmoFree);

      for (let i = 0; i < productImages.length; i++) {
        formData.append('images', productImages[i]);
      }

      await axios.post(`${API_URL}/products`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setNewProductMsg('Product crop created as draft listing.');
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setStockQuantity('');
      setHarvestDate('');
      setProductImages([]);
      fetchMyProducts();
    } catch (err) {
      console.error(err);
      setNewProductMsg(err.response?.data?.error || 'Failed to list product.');
    } finally {
      setNewProductLoading(false);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === 'draft' || currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await axios.put(
        `${API_URL}/products/${productId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMyProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to update product visibility status.');
    }
  };

  const handleFetchQR = async (productId) => {
    setQrLoading(true);
    setQrCodeData(null);
    try {
      const res = await axios.get(`${API_URL}/traceability/qr/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodeData(res.data.qrCodeUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to generate product QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleTraceabilitySubmit = async (e) => {
    e.preventDefault();
    if (!traceProduct) {
      setTraceMsg('Please select a product crop listing');
      return;
    }
    setTraceLoading(true);
    setTraceMsg('');

    try {
      const payload = {
        product: traceProduct,
        batchNumber: traceBatch,
        stage: traceStage,
        locationDetails: traceLocation,
        temperature: traceTemp ? Number(traceTemp) : undefined,
        humidity: traceHumidity ? Number(traceHumidity) : undefined,
        notes: traceNotes
      };

      await axios.post(`${API_URL}/traceability/record`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTraceMsg('Lifecycle tracking stage logged successfully!');
      // Reset
      setTraceBatch('');
      setTraceLocation('');
      setTraceTemp('');
      setTraceHumidity('');
      setTraceNotes('');
    } catch (err) {
      console.error(err);
      setTraceMsg(err.response?.data?.error || 'Failed to record stage.');
    } finally {
      setTraceLoading(false);
    }
  };

  const handleCertSubmit = async (e) => {
    e.preventDefault();
    if (!certProduct) {
      setCertMsg('Please select a product');
      return;
    }
    if (!certFile) {
      setCertMsg('Please upload a certificate document');
      return;
    }
    setCertLoading(true);
    setCertMsg('');

    try {
      const formData = new FormData();
      formData.append('product', certProduct);
      formData.append('certificationType', certType);
      formData.append('certificateNumber', certNumber);
      formData.append('issuingAuthority', certAuthority);
      formData.append('expiryDate', certExpiry);
      formData.append('certificateFile', certFile);

      await axios.post(`${API_URL}/certifications`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setCertMsg('Certification submitted to administrator review.');
      setCertNumber('');
      setCertAuthority('');
      setCertExpiry('');
      setCertFile(null);
    } catch (err) {
      console.error(err);
      setCertMsg(err.response?.data?.error || 'Failed to submit certification.');
    } finally {
      setCertLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReceivedOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    }
  };

  const handleFetchScanStats = async (productId) => {
    setStatsProduct(productId);
    try {
      const res = await axios.get(`${API_URL}/traceability/scans/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Farmer Dashboard</h1>
          <p className="text-sm text-slate-555 mt-1">Manage crop listings, certificates, log timelines, and track buyer orders.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          {user.farmerVerificationStatus === 'verified' ? (
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Farmer
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 capitalize">
              Verification: {user.farmerVerificationStatus || 'none'}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      {user.farmerVerificationStatus === 'verified' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Crops</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{myProducts.length}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 rounded-xl p-2.5">
              <Sprout className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Listings</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {myProducts.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-600 rounded-xl p-2.5">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Received Orders</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-purple-50 text-purple-600 rounded-xl p-2.5">
              <Clipboard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Farm Revenue</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-amber-50 text-amber-600 rounded-xl p-2.5">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 shadow-sm lg:sticky lg:top-20">
            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'verification'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Farmer Verification</span>
            </button>
            
            {user.farmerVerificationStatus === 'verified' && (
              <>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'products'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sprout className="w-4 h-4" />
                  <span>My Crops</span>
                </button>
                <button
                  onClick={() => setActiveTab('traceability')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'traceability'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Traceability Stages</span>
                </button>
                <button
                  onClick={() => setActiveTab('certifications')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'certifications'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Certifications</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTab === 'orders'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Received Orders</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1">
          {activeTab === 'verification' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Farmer Verification Status</h2>
              <p className="text-sm text-slate-500 mb-6">
                To keep buyer trust, Veritas requires farmers to upload documentation (e.g. land ownership certificates, business registration, or government ID) before listing crops.
              </p>

              {user.farmerVerificationStatus === 'verified' && (
                <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
                  <p className="font-bold text-sm">Your profile is fully verified!</p>
                  <p className="text-xs mt-1">You are authorized to publish active crop listings on the public marketplace.</p>
                </div>
              )}

              {user.farmerVerificationStatus === 'pending' && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
                  <p className="font-bold text-sm">Verification request is pending administrator review.</p>
                  <p className="text-xs mt-1">Our moderation team is reviewing your uploaded documents. Check back soon.</p>
                </div>
              )}

              {(user.farmerVerificationStatus === 'none' || user.farmerVerificationStatus === 'rejected') && (
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  {user.farmerVerificationStatus === 'rejected' && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-4">
                      <p className="font-bold text-sm">Previous request rejected.</p>
                      <p className="text-xs mt-1">Please upload a valid verification document to retry.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Verification Document (ID, Land Deed, License)</label>
                    <input
                      type="file"
                      onChange={e => setVerificationFile(e.target.files[0])}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none"
                      required
                    />
                  </div>

                  {verificationMsg && <div className="text-xs font-semibold text-slate-700">{verificationMsg}</div>}

                  <button
                    type="submit"
                    disabled={verificationLoading}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
                  >
                    {verificationLoading ? 'Uploading...' : 'Submit Documents'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              {/* Product Listing Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Register a New Crop Product</h2>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Organic Turmeric"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      >
                        <option value="Herbs">Herbs</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Grains">Grains</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Add harvesting methods, crop grades, and packaging details..."
                      rows="3"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="25.00"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unit of Measure</label>
                      <input
                        type="text"
                        required
                        value={unitOfMeasure}
                        onChange={e => setUnitOfMeasure(e.target.value)}
                        placeholder="kg, lbs, ton"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        required
                        value={stockQuantity}
                        onChange={e => setStockQuantity(e.target.value)}
                        placeholder="500"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quality Grade</label>
                      <select
                        value={qualityGrade}
                        onChange={e => setQualityGrade(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      >
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Harvest Date</label>
                      <input
                        type="date"
                        value={harvestDate}
                        onChange={e => setHarvestDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Crop Images (Max 5)</label>
                      <input
                        type="file"
                        multiple
                        onChange={e => setProductImages(e.target.files)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={organic}
                        onChange={e => setOrganic(e.target.checked)}
                        className="h-4 w-4 rounded text-primary-600 border-slate-300"
                      />
                      <span>Organic Certified</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gmoFree}
                        onChange={e => setGmoFree(e.target.checked)}
                        className="h-4 w-4 rounded text-primary-600 border-slate-300"
                      />
                      <span>GMO-Free</span>
                    </label>
                  </div>

                  {newProductMsg && <div className="text-xs font-semibold text-slate-700">{newProductMsg}</div>}

                  <button
                    type="submit"
                    disabled={newProductLoading}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
                  >
                    {newProductLoading ? 'Saving...' : 'Add Product'}
                  </button>
                </form>
              </div>

              {/* Products Table list */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
                <h2 className="text-xl font-bold text-slate-900 mb-4">My Crop Listings</h2>
                {productsLoading ? (
                  <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
                    <span>Loading products...</span>
                  </div>
                ) : myProducts.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">You have not listed any products yet.</p>
                ) : (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-550 border-b border-slate-200">
                        <th className="py-3 px-4 rounded-l-lg">Crop Name</th>
                        <th className="py-3 px-3">Price</th>
                        <th className="py-3 px-3">Stock</th>
                        <th className="py-3 px-3">Quality Grade</th>
                        <th className="py-3 px-3">Visibility</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myProducts.map(p => (
                        <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-4 px-3 text-slate-700 font-medium">${p.price.toFixed(2)} / {p.unitOfMeasure}</td>
                          <td className="py-4 px-3 text-slate-600">{p.stockQuantity} {p.unitOfMeasure}</td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              p.qualityGrade === 'A'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : p.qualityGrade === 'B'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              Grade {p.qualityGrade}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              p.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-705 border-emerald-250' 
                                : 'bg-slate-105 text-slate-600 border-slate-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(p._id, p.status)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                  p.status === 'active' 
                                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' 
                                    : 'bg-primary-500 hover:bg-primary-600 text-white border-transparent'
                                }`}
                              >
                                {p.status === 'active' ? 'Deactivate' : 'Publish'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  handleFetchQR(p._id);
                                  handleFetchScanStats(p._id);
                                }}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                              >
                                QR Verify
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'traceability' && (
            <div className="space-y-8">
              {/* Add Traceability Record form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Log Product Lifecycle Stage</h2>
                <p className="text-xs text-slate-500 mb-6">Log chronological crop events so buyers can trace the product journey.</p>

                <form onSubmit={handleTraceabilitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Crop Product</label>
                      <select
                        value={traceProduct}
                        onChange={e => setTraceProduct(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                        required
                      >
                        <option value="">Select Crop...</option>
                        {myProducts.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Batch Number</label>
                      <input
                        type="text"
                        required
                        value={traceBatch}
                        onChange={e => setTraceBatch(e.target.value)}
                        placeholder="e.g. BATCH-2026-X1"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Production Stage</label>
                      <select
                        value={traceStage}
                        onChange={e => setTraceStage(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      >
                        <option value="seed">Seed Sourcing</option>
                        <option value="planting">Planting</option>
                        <option value="growing">Growing / Cultivation</option>
                        <option value="harvest">Harvesting</option>
                        <option value="processing">Processing</option>
                        <option value="packaging">Packaging</option>
                        <option value="shipping">Shipping</option>
                        <option value="retail">Retail Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location Details</label>
                      <input
                        type="text"
                        required
                        value={traceLocation}
                        onChange={e => setTraceLocation(e.target.value)}
                        placeholder="e.g. Plot 4, Green Valley Farm, CA"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Temperature (&deg;C) - Optional</label>
                      <input
                        type="number"
                        value={traceTemp}
                        onChange={e => setTraceTemp(e.target.value)}
                        placeholder="22"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Humidity (%) - Optional</label>
                      <input
                        type="number"
                        value={traceHumidity}
                        onChange={e => setTraceHumidity(e.target.value)}
                        placeholder="65"
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Logs</label>
                    <textarea
                      value={traceNotes}
                      onChange={e => setTraceNotes(e.target.value)}
                      placeholder="Add fertilizer logs, soil parameters, or packaging observations..."
                      rows="2"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>

                  {traceMsg && <div className="text-xs font-semibold text-slate-700">{traceMsg}</div>}

                  <button
                    type="submit"
                    disabled={traceLoading}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
                  >
                    {traceLoading ? 'Recording...' : 'Log Lifecycle Stage'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Register Crop Certifications</h2>
              <p className="text-xs text-slate-500 mb-6">Upload credentials issued by certifying bodies (like USDA Organic) for admin verification.</p>

              <form onSubmit={handleCertSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Crop Product</label>
                    <select
                      value={certProduct}
                      onChange={e => setCertProduct(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                      required
                    >
                      <option value="">Select Crop...</option>
                      {myProducts.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Certification Type</label>
                    <select
                      value={certType}
                      onChange={e => setCertType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    >
                      <option value="Organic">Organic Certificate</option>
                      <option value="Non-GMO">Non-GMO Verification</option>
                      <option value="Fair-Trade">Fair Trade Certificate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Certificate Number</label>
                    <input
                      type="text"
                      required
                      value={certNumber}
                      onChange={e => setCertNumber(e.target.value)}
                      placeholder="e.g. CERT-993-X"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Issuing Authority</label>
                    <input
                      type="text"
                      required
                      value={certAuthority}
                      onChange={e => setCertAuthority(e.target.value)}
                      placeholder="e.g. USDA Board"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={certExpiry}
                      onChange={e => setCertExpiry(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Certificate Document (PDF / Image)</label>
                  <input
                    type="file"
                    onChange={e => setCertFile(e.target.files[0])}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                    required
                  />
                </div>

                {certMsg && <div className="text-xs font-semibold text-slate-700">{certMsg}</div>}

                <button
                  type="submit"
                  disabled={certLoading}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
                >
                  {certLoading ? 'Submitting...' : 'Submit Certification'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Received Marketplace Orders</h2>
              {ordersLoading ? (
                <div className="text-center py-6 text-slate-505 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
                  <span>Loading orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">You have not received any orders yet.</p>
              ) : (
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-550 border-b border-slate-200">
                      <th className="py-3 px-4 rounded-l-lg">Order Number</th>
                      <th className="py-3 px-3">Buyer</th>
                      <th className="py-3 px-3">Crop Details</th>
                      <th className="py-3 px-3">Total Price</th>
                      <th className="py-3 px-3">Order Status</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                        <td className="py-4 px-3">
                          <p className="font-bold text-slate-800">{order.buyer?.profile?.firstName} {order.buyer?.profile?.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{order.buyer?.email}</p>
                        </td>
                        <td className="py-4 px-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-650">
                              <span className="font-semibold text-slate-800">{item.product?.name}</span> ({item.quantity} units)
                            </div>
                          ))}
                        </td>
                        <td className="py-4 px-3 font-bold text-slate-900">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'shipped'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'processing')}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg border border-transparent transition-colors shadow-xs"
                              >
                                Accept
                              </button>
                            )}
                            {order.status === 'processing' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'shipped')}
                                className="text-xs bg-purple-600 hover:bg-purple-750 text-white font-bold px-3 py-1.5 rounded-lg border border-transparent transition-colors shadow-xs"
                              >
                                Ship Order
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                                className="text-xs bg-emerald-655 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg border border-transparent transition-colors shadow-xs"
                              >
                                Deliver
                              </button>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Details / Statistics Slide-out or Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">QR Traceability Details: {selectedProduct.name}</h3>
            <p className="text-xs text-slate-400 mb-6">Download verification QR code or view scan audit logs.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Panel */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-lg border border-slate-200/50">
                {qrLoading ? (
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                ) : qrCodeData ? (
                  <>
                    <img src={qrCodeData} alt="QR Code" className="w-44 h-44 shadow-sm border border-slate-200 rounded p-1 bg-white mb-4" />
                    <a
                      href={qrCodeData}
                      download={`veritas-qr-${selectedProduct.sku}.png`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR PNG</span>
                    </a>
                  </>
                ) : (
                  <button
                    onClick={() => handleFetchQR(selectedProduct._id)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                  >
                    Generate Verify QR Code
                  </button>
                )}
              </div>

              {/* Stats Panel */}
              <div className="flex flex-col justify-between">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Scan Count</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1">{scanStats.length}</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-primary-500" />
                </div>

                <div className="flex-1 overflow-y-auto max-h-48 border border-slate-200 rounded-lg bg-white p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">Scan Log History</p>
                  {scanStats.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">No scan logged yet.</p>
                  ) : (
                    scanStats.slice(0, 10).map((scan, idx) => (
                      <div key={idx} className="text-[11px] border-b border-slate-50 pb-1.5 last:border-b-0">
                        <p className="font-semibold text-slate-700">Date: {new Date(scan.scannedAt).toLocaleString()}</p>
                        <p className="text-slate-400">IP: {scan.ipAddress} &bull; {scan.locationDetails}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setQrCodeData(null);
                  setScanStats([]);
                }}
                className="border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close Panel
              </button>
              {selectedProduct && selectedProduct._id !== statsProduct && (
                <button
                  onClick={() => handleFetchScanStats(selectedProduct._id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Reload Stats
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
