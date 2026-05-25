import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, FileCheck, CheckCircle2, XCircle, RefreshCw, FileText, ToggleLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/v1';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('farmers');

  // Pending Farmers state
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [farmerMsg, setFarmerMsg] = useState('');

  // Pending Certifications state
  const [pendingCerts, setPendingCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certMsg, setCertMsg] = useState('');

  const fetchPendingFarmers = async () => {
    setFarmersLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/verification`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingFarmers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFarmersLoading(false);
    }
  };

  const fetchPendingCertifications = async () => {
    setCertsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/certifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCerts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCertsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingFarmers();
      fetchPendingCertifications();
    }
  }, [token]);

  const handleVerifyFarmer = async (userId, action) => {
    // action is 'verified' or 'rejected'
    setFarmerMsg('');
    try {
      await axios.put(
        `${API_URL}/admin/verification/${userId}`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFarmerMsg(`Farmer status successfully updated to ${action}`);
      fetchPendingFarmers();
    } catch (err) {
      console.error(err);
      setFarmerMsg('Failed to update verification status.');
    }
  };

  const handleVerifyCert = async (certId, action) => {
    // action is 'approved' or 'rejected'
    setCertMsg('');
    try {
      await axios.put(
        `${API_URL}/admin/certifications/${certId}`,
        { status: action, reviewNotes: `Reviewed and ${action} by Admin` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCertMsg(`Certification successfully ${action}`);
      fetchPendingCertifications();
    } catch (err) {
      console.error(err);
      setCertMsg('Failed to verify crop certificate.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-slate-500 mt-1">Review farmer credentials, verify organic/non-gmo certifications, and regulate listing visibility.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pending Farmers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingFarmers.length}</p>
          </div>
          <div className="bg-amber-50 text-amber-600 rounded-xl p-2.5">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pending Certifications</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingCerts.length}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 rounded-xl p-2.5">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('farmers')}
          className={`pb-4 border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'farmers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Farmer Verification ({pendingFarmers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`pb-4 border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'certifications' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Product Certifications ({pendingCerts.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'farmers' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Farmer Verifications</h2>
            
            {farmerMsg && <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-semibold mb-4">{farmerMsg}</div>}

            {farmersLoading ? (
              <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
                <span>Fetching pending requests...</span>
              </div>
            ) : pendingFarmers.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No pending farmer verification requests.</p>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-550 border-b border-slate-200">
                    <th className="py-3 px-4 rounded-l-lg">Farmer Name</th>
                    <th className="py-3 px-3">Farm / Company</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Uploaded Document</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Approve / Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFarmers.map(farmer => (
                    <tr key={farmer._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {farmer.profile?.firstName} {farmer.profile?.lastName}
                      </td>
                      <td className="py-4 px-3 text-slate-700 font-medium">{farmer.profile?.companyName || 'N/A'}</td>
                      <td className="py-4 px-3 font-mono text-slate-605 text-xs">{farmer.email}</td>
                      <td className="py-4 px-3">
                        {farmer.verificationDocumentUrl ? (
                          <a
                            href={farmer.verificationDocumentUrl.startsWith('http') ? farmer.verificationDocumentUrl : `http://localhost:5000${farmer.verificationDocumentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1 text-xs"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View File</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">No Document</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerifyFarmer(farmer._id, 'verified')}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors border border-transparent"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerifyFarmer(farmer._id, 'rejected')}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors border border-red-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Crop Certifications</h2>
            
            {certMsg && <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-semibold mb-4">{certMsg}</div>}

            {certsLoading ? (
              <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
                <span>Fetching certifications...</span>
              </div>
            ) : pendingCerts.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No pending product certifications.</p>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-550 border-b border-slate-200">
                    <th className="py-3 px-4 rounded-l-lg">Crop Listing</th>
                    <th className="py-3 px-3">Farmer</th>
                    <th className="py-3 px-3">Type / Authority</th>
                    <th className="py-3 px-3">Certificate URL</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Approve / Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map(cert => (
                    <tr key={cert._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <p>{cert.product?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {cert.product?.sku}</p>
                      </td>
                      <td className="py-4 px-3 text-slate-700 font-medium">
                        {cert.farmer?.profile?.companyName || `${cert.farmer?.profile?.firstName} ${cert.farmer?.profile?.lastName}`}
                      </td>
                      <td className="py-4 px-3 text-xs">
                        <p className="font-bold text-slate-800">{cert.certificationType}</p>
                        <p className="text-slate-400 font-mono mt-0.5">No: {cert.certificateNumber} &bull; Auth: {cert.issuingAuthority}</p>
                      </td>
                      <td className="py-4 px-3">
                        {cert.certificateUrl ? (
                          <a
                            href={cert.certificateUrl.startsWith('http') ? cert.certificateUrl : `http://localhost:5000${cert.certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1 text-xs"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Document</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">No File</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerifyCert(cert._id, 'approved')}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors border border-transparent"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerifyCert(cert._id, 'rejected')}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-750 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors border border-red-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
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
  );
};
