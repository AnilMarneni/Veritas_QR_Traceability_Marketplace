import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, RefreshCw, Truck, CheckCircle2, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/v1';

export const BuyerDashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyOrders();
    }
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Purchase Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Track shipping states and review crop receipt details.</p>
      </div>

      {/* Metrics Row */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Orders</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-600 rounded-xl p-2.5">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Completed Purchases</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 rounded-xl p-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Expenditure</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-primary-50 text-primary-650 rounded-xl p-2.5">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mb-4" />
          <p>Fetching purchase records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">{error}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium mb-1">No orders found</p>
          <p className="text-sm">Explore the Marketplace to purchase crop listings from verified farmers.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Number</span>
                  <p className="font-mono font-bold text-slate-900 text-lg leading-none mt-1">{order.orderNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Order Date</span>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 py-1.5 rounded-full text-[10px] font-bold uppercase border ${
                    order.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : order.status === 'processing'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : order.status === 'shipped'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-slate-100 text-slate-600 border-slate-250'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items details */}
              <div className="space-y-3 mb-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{item.product?.name || 'Unknown Crop Listing'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">SKU: {item.product?.sku || 'N/A'} &bull; Quantity: {item.quantity} units</p>
                    </div>
                    <span className="font-bold text-slate-900">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Shipping Address details */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider mb-2">Shipping Address</p>
                  <p className="text-slate-850 font-medium">{order.shippingAddress?.street}</p>
                  <p className="text-slate-600 mt-0.5">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                  </p>
                  <p className="text-slate-550">{order.shippingAddress?.country}</p>
                </div>
                <div className="flex flex-col justify-between items-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-slate-550 uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-slate-650 font-medium">Payment Status: <span className="font-semibold text-emerald-700 capitalize">{order.paymentStatus}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Total Purchase Price</p>
                    <p className="text-2xl font-black text-primary-650 mt-1">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Simple workflow progress timeline */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 font-bold text-primary-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Placed</span>
                </div>
                <div className={`flex items-center gap-1 font-bold ${
                  ['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-primary-650' : 'text-slate-350'
                }`}>
                  <RefreshCw className={`w-3.5 h-3.5 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
                  <span>Processing</span>
                </div>
                <div className={`flex items-center gap-1 font-bold ${
                  ['shipped', 'delivered'].includes(order.status) ? 'text-primary-650' : 'text-slate-350'
                }`}>
                  <Truck className="w-4 h-4" />
                  <span>Shipped</span>
                </div>
                <div className={`flex items-center gap-1 font-bold ${
                  order.status === 'delivered' ? 'text-emerald-600' : 'text-slate-350'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Delivered</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
