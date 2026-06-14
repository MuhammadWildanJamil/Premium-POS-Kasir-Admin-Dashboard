import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: number;
  category_name: string | null;
  image?: string | null;
};

type Category = {
  id: number;
  name: string;
};

type User = {
  id: number;
  name: string;
  role: string;
  pin: string;
};

type TopProduct = {
  id: number;
  name: string;
  total_sold: number;
};

type Setting = {
  cafeName: string;
  cafeAddress: string;
  taxPercentage: number;
};

// Konstanta Konfigurasi (Clean Code: Mencegah Hardcode)
const API_BASE_URL = 'http://localhost:3000/api';
const ADMIN_PASSWORD = 'admin123'; // TODO: Pindahkan ke file .env saat Production

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'category' | 'user' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuth') === 'true';
  });
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  
  // State untuk Manajemen Menu
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, stock: 0, categoryId: 1, image: '' as string | null });

  // State untuk Manajemen Kategori
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  // State untuk Manajemen Pengguna
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ name: '', pin: '' });

  // State untuk Pengaturan
  const [settings, setSettings] = useState<Setting>({ cafeName: '', cafeAddress: '', taxPercentage: 0 });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Mengambil data seluruh transaksi
  useEffect(() => {
    document.title = "Wil's Back-Office - Dashboard Admin";
  }, []);

  // Mengambil data produk dan kategori saat tab aktif berubah
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchOrders();
      fetchTopProducts();
    } else if (activeTab === 'menu') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'category') {
      fetchCategories();
    } else if (activeTab === 'user') {
      fetchUsers();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  // Fungsi mengambil data Pesanan (Laporan)
  const fetchOrders = () => {
    fetch(`${API_BASE_URL}/orders`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setOrders(data.data); })
      .catch(err => console.error(err));
  };

  const fetchTopProducts = () => {
    fetch(`${API_BASE_URL}/top-products`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setTopProducts(data.data); })
      .catch(err => console.error(err));
  };

  const fetchProducts = () => {
    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setProducts(data.data); })
      .catch(err => console.error(err));
  };

  const fetchCategories = () => {
    fetch(`${API_BASE_URL}/categories`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setCategories(data.data); })
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setUsers(data.data); })
      .catch(err => console.error(err));
  };

  const fetchSettings = () => {
    fetch(`${API_BASE_URL}/settings`)
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setSettings(data.data); })
      .catch(err => console.error(err));
  };

  // Fungsi untuk menangani proses login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminAuth', 'true'); // Simpan sesi login di browser
    } else {
      alert('Password salah! Silakan coba lagi.');
    }
  };

  // Fungsi untuk keluar (Logout)
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminAuth');
  };

  // Fungsi untuk membuka form Tambah Produk
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: 0, stock: 100, categoryId: categories.length > 0 ? categories[0].id : 1, image: '' });
    setShowProductModal(true);
  };

  // Fungsi untuk membuka form Edit Produk
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description || '', price: product.price, stock: product.stock, categoryId: product.categoryId, image: product.image || '' });
    setShowProductModal(true);
  };

  // Fungsi untuk menyimpan (Tambah/Edit) Produk
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `${API_BASE_URL}/products/${editingProduct.id}` : `${API_BASE_URL}/products`;
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowProductModal(false);
        fetchProducts(); // Refresh tabel
      } else alert(data.message);
    } catch (err) { alert('Terjadi kesalahan jaringan.'); }
  };

  // Fungsi untuk konversi gambar ke Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi untuk menghapus Produk
  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (err) { alert('Gagal menghapus produk.'); }
  };

  // Fungsi untuk membuka form Tambah Kategori
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '' });
    setShowCategoryModal(true);
  };

  // Fungsi untuk membuka form Edit Kategori
  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setShowCategoryModal(true);
  };

  // Fungsi untuk menyimpan (Tambah/Edit) Kategori
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCategory ? `${API_BASE_URL}/categories/${editingCategory.id}` : `${API_BASE_URL}/categories`;
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryFormData) });
      const data = await res.json();
      if (data.status === 'success') { setShowCategoryModal(false); fetchCategories(); }
      else alert(data.message);
    } catch (err) { alert('Terjadi kesalahan jaringan.'); }
  };

  // Fungsi untuk menghapus Kategori
  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini? (Pastikan tidak ada menu yang memakai kategori ini)')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (err) { alert('Gagal menghapus kategori.'); }
  };

  // Fungsi untuk membuka form Tambah User
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({ name: '', pin: '' });
    setShowUserModal(true);
  };

  // Fungsi untuk membuka form Edit User
  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({ name: user.name, pin: String(user.pin || '123456') });
    setShowUserModal(true);
  };

  // Fungsi untuk menyimpan (Tambah/Edit) User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users`;
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userFormData) });
      const data = await res.json();
      if (data.status === 'success') { setShowUserModal(false); fetchUsers(); }
      else alert(data.message);
    } catch (err) { alert('Terjadi kesalahan jaringan.'); }
  };

  // Fungsi untuk menghapus User
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kasir ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) { alert('Gagal menghapus kasir.'); }
  };

  // Fungsi untuk menyimpan Pengaturan
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.status === 'success') alert('Pengaturan berhasil disimpan!');
    } catch (err) { alert('Gagal menyimpan pengaturan.'); }
    setIsSavingSettings(false);
  };

  // Filter Laporan Berdasarkan Waktu
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);

      if (reportFilter === 'today') {
        return orderDate.getDate() === now.getDate() && 
               orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      } else if (reportFilter === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo && orderDate <= now;
      } else if (reportFilter === 'month') {
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [orders, reportFilter]);

  // Menghitung total pendapatan dari pesanan yang sudah difilter
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  // Menghitung data grafik penjualan bulanan (Tahun Ini)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = new Array(12).fill(0);
    
    orders.forEach(order => {
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        if (date.getFullYear() === new Date().getFullYear()) {
          data[date.getMonth()] += Number(order.totalAmount || 0);
        }
      }
    });
    return months.map((month, index) => ({ name: month, total: data[index] }));
  }, [orders]);

  const maxMonthlySales = Math.max(...monthlyData.map(d => d.total), 1); // Hindari pembagian 0 jika data kosong

  // Fungsi untuk Export Data Laporan ke CSV
  const exportToCSV = () => {
    const headers = ['ID Pesanan', 'Waktu Transaksi', 'Nama Pelanggan', 'Tipe Pesanan', 'Metode Pembayaran', 'Total Tagihan'];
    const rows = filteredOrders.map(order => [
      `#INV-${order.id.toString().padStart(4, '0')}`,
      `"${order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}"`, // Kutip untuk mencegah koma terpotong
      `"${order.customerName || 'Guest'}"`,
      order.orderType || 'Dine In',
      order.paymentMethod || '-',
      order.totalAmount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Penjualan_${settings.cafeName.replace(/\s+/g, '_')}_${reportFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Jika belum login, tampilkan layar form Login
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-sm w-full mx-4 border border-white">
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Akses Admin</h2>
          <p className="text-sm text-slate-500 mb-8 text-center font-medium">Masukkan kata sandi untuk melanjutkan</p>
          
          <input type="password" placeholder="Kata Sandi (admin123)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none mb-6 transition-all" autoFocus required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 mb-4">Masuk Dashboard</button>
          <div className="text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 font-bold transition-colors">Kembali ke Kasir</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 print:h-auto print:bg-white">
      
      {/* Konfigurasi Ukuran Kertas Cetak Laporan (A4 Portrait) */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>
      
      {/* Sidebar Menu Admin */}
      <aside className="w-64 bg-[#0B1120] text-slate-300 flex flex-col shadow-2xl z-10 relative print:hidden">
        <div className="p-8 border-b border-slate-800/50">
          <h1 className="text-xl font-black tracking-tight text-white">Wil's Back-Office</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all tracking-wide ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            Laporan Penjualan
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all tracking-wide ${activeTab === 'menu' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            Manajemen Menu
          </button>
          <button 
            onClick={() => setActiveTab('category')}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all tracking-wide ${activeTab === 'category' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            Manajemen Kategori
          </button>
          <button 
            onClick={() => setActiveTab('user')}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all tracking-wide ${activeTab === 'user' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            Manajemen Pengguna
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all tracking-wide ${activeTab === 'settings' ? 'bg-blue-600/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            Pengaturan Kafe
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <Link to="/" className="block text-center w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-bold transition-all tracking-wide text-sm active:scale-95">
            Kembali ke Kasir
          </Link>
          <button onClick={handleLogout} className="mt-2 block text-center w-full text-slate-400 hover:text-red-400 hover:bg-slate-800/50 px-4 py-3 rounded-xl font-bold transition-colors tracking-wide text-sm">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center z-0 print:border-none print:px-0 print:pb-6">
          <h2 className="text-2xl font-bold text-slate-800 print:text-3xl">
            {activeTab === 'dashboard' ? 'Ringkasan Penjualan' : activeTab === 'menu' ? 'Manajemen Menu' : activeTab === 'category' ? 'Manajemen Kategori' : activeTab === 'user' ? 'Manajemen Pengguna' : 'Pengaturan Kafe'}
            {activeTab === 'dashboard' && <span className="hidden print:inline-block ml-2 text-slate-500 font-medium text-xl">({reportFilter === 'today' ? 'Hari Ini' : reportFilter === 'week' ? '7 Hari Terakhir' : reportFilter === 'month' ? 'Bulan Ini' : 'Semua Waktu'})</span>}
          </h2>
          
          <div className="flex items-center gap-4 print:hidden">
            {activeTab === 'dashboard' && (
              <button 
                onClick={exportToCSV}
                className="text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 shadow-sm"
              >
                📥 Export Excel / CSV
              </button>
            )}
            {activeTab === 'dashboard' && (
              <button 
                onClick={() => window.print()}
                className="text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
              >
            Cetak Laporan
              </button>
            )}
            {activeTab === 'dashboard' && (
              <select 
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as any)}
                className="text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
            )}
            <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 hidden md:block print:hidden">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>
        
        <div className="p-8 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          {activeTab === 'dashboard' && (
            <>
              {/* Widget Kartu Statistik */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 print:grid-cols-2 print:gap-4 print:mb-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
                  <p className="text-sm font-bold text-slate-500 mb-2 relative z-10">Total Pendapatan</p>
                  <h3 className="text-4xl font-black text-blue-600 tracking-tight relative z-10">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-indigo-200 transition-colors">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
                  <p className="text-sm font-bold text-slate-500 mb-2 relative z-10">Total Transaksi</p>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight relative z-10">{filteredOrders.length} <span className="text-xl text-slate-400 font-medium ml-1">pesanan</span></h3>
                </div>
              </div>

              {/* Grafik Penjualan Bulanan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 print:hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Grafik Penjualan ({new Date().getFullYear()})</h3>
                </div>
                <div className="h-64 flex items-end gap-2 md:gap-4 mt-8 print:h-48">
                  {monthlyData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex-1 flex items-end justify-center relative">
                        {/* Tooltip Nominal yang muncul saat di-hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded-lg transition-opacity whitespace-nowrap pointer-events-none z-10 font-bold shadow-lg">
                          Rp {data.total.toLocaleString('id-ID')}
                        </div>
                        {/* Batang Grafik */}
                        <div 
                          className={`w-full max-w-[3.5rem] rounded-t-xl transition-all duration-500 relative ${data.total > 0 ? 'bg-blue-100 group-hover:bg-blue-600 cursor-pointer print:bg-blue-200' : 'bg-slate-50'}`}
                          style={{ height: `${data.total > 0 ? (data.total / maxMonthlySales) * 100 : 0}%`, minHeight: data.total > 0 ? '8px' : '0' }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold transition-colors ${data.total > 0 ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-300'}`}>{data.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Tabel Transaksi & Produk Terlaris */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
                
                {/* Tabel Transaksi Terbaru */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden print:shadow-none print:border-slate-300">
                  <div className="p-6 px-8 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Transaksi Terbaru</h3>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-sm font-bold text-slate-500 border-b border-slate-200">
                          <th className="p-4 whitespace-nowrap">ID Pesanan</th>
                          <th className="p-4 whitespace-nowrap">Waktu</th>
                          <th className="p-4 whitespace-nowrap">Pelanggan</th>
                          <th className="p-4 whitespace-nowrap">Tipe</th>
                          <th className="p-4 whitespace-nowrap text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data transaksi.</td>
                          </tr>
                        ) : (
                          filteredOrders.map(order => (
                            <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 px-8 font-bold text-slate-800">#INV-{order.id.toString().padStart(4, '0')}</td>
                              <td className="p-4 px-8 text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}</td>
                              <td className="p-4 px-8 text-slate-700">{order.customerName}</td>
                              <td className="p-4 px-8">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${order.orderType === 'Take Away' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                  {order.orderType || 'Dine In'}
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold text-blue-600">Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Widget Produk Terlaris (Tidak ikut tercetak PDF) */}
                <div className="lg:col-span-1 print:hidden">
                  <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
                    <div className="p-6 px-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Menu Terlaris</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                      {topProducts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Belum ada data penjualan.</div>
                      ) : (
                        topProducts.map((tp, idx) => (
                          <div key={idx} className="flex justify-between items-center p-5 px-8 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-700">{tp.name}</span>
                            </div>
                            <span className="font-bold text-blue-600">{Number(tp.total_sold).toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-medium">porsi</span></span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'menu' && (
            <>
              {/* Tombol Tambah Menu */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Kelola daftar menu dan harga yang tampil di aplikasi kasir.</p>
                <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Tambah Menu
                </button>
              </div>
              
              {/* Tabel Menu */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-sm font-bold text-slate-500 border-b border-slate-200">
                        <th className="p-4 whitespace-nowrap">ID</th>
                        <th className="p-4 whitespace-nowrap w-16">Foto</th>
                        <th className="p-4 whitespace-nowrap">Nama Menu</th>
                        <th className="p-4 whitespace-nowrap">Kategori</th>
                        <th className="p-4 whitespace-nowrap">Harga</th>
                        <th className="p-4 whitespace-nowrap">Stok</th>
                        <th className="p-4 whitespace-nowrap text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-500">#{product.id}</td>
                          <td className="p-4">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs border border-slate-200">
                                🖼️
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-800">{product.name}</td>
                          <td className="p-4 text-slate-600">{product.category_name}</td>
                          <td className="p-4 font-bold text-blue-600">Rp {product.price.toLocaleString('id-ID')}</td>
                          <td className="p-4 text-slate-600">{product.stock}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => openEditModal(product)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-lg transition-colors text-xs">Edit</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 font-bold rounded-lg transition-colors text-xs">Hapus</button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">Belum ada data menu.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {activeTab === 'category' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Kelola daftar kategori menu.</p>
                <button onClick={openAddCategoryModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Tambah Kategori
                </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-sm font-bold text-slate-500 border-b border-slate-200">
                        <th className="p-4 whitespace-nowrap w-24">ID</th>
                        <th className="p-4 whitespace-nowrap">Nama Kategori</th>
                        <th className="p-4 whitespace-nowrap text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {categories.map(cat => (
                        <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-500">#{cat.id}</td>
                          <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => openEditCategoryModal(cat)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-lg transition-colors text-xs">Edit</button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 font-bold rounded-lg transition-colors text-xs">Hapus</button>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-500">Belum ada data kategori.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {activeTab === 'user' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Kelola daftar pegawai / kasir yang bisa menggunakan aplikasi.</p>
                <button onClick={openAddUserModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Tambah Kasir
                </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-sm font-bold text-slate-500 border-b border-slate-200">
                        <th className="p-4 whitespace-nowrap w-24">ID</th>
                        <th className="p-4 whitespace-nowrap">Nama Pegawai</th>
                        <th className="p-4 whitespace-nowrap">Role</th>
                        <th className="p-4 whitespace-nowrap">PIN Login</th>
                        <th className="p-4 whitespace-nowrap text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-500">#{user.id}</td>
                          <td className="p-4 font-bold text-slate-800">{user.name}</td>
                          <td className="p-4 text-slate-600">{user.role}</td>
                          <td className="p-4 text-slate-600 font-mono tracking-widest text-xs">
                            {user.pin || '123456'}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => openEditUserModal(user)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-lg transition-colors text-xs">Edit</button>
                            <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 font-bold rounded-lg transition-colors text-xs">Hapus</button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">Belum ada data kasir.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-3xl">
              <div className="mb-8 border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Informasi & Pengaturan Kafe</h3>
                <p className="text-slate-500 font-medium">Ubah identitas nama toko, alamat pada struk, dan perhitungan pajak aplikasi di sini.</p>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-8">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Kafe</label>
                    <input type="text" value={settings.cafeName} onChange={e => setSettings({...settings, cafeName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required placeholder="Contoh: Wil's Coffee Shop" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Lengkap Kafe (Tampil di Struk)</label>
                    <textarea value={settings.cafeAddress} onChange={e => setSettings({...settings, cafeAddress: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-24" required placeholder="Contoh: Jl. Kopi Nikmat No. 123..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Persentase Pajak (%)</label>
                    <div className="relative max-w-xs">
                      <input type="number" value={settings.taxPercentage} onChange={e => setSettings({...settings, taxPercentage: Number(e.target.value)})} step="0.01" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Contoh: Isi 10 untuk PPN 10%, atau isi 0 jika tidak menggunakan pajak.</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-2">
                    <button type="submit" disabled={isSavingSettings} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                      {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form Tambah/Edit Produk */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingProduct ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Menu</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Gambar Menu (Opsional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formData.image && <img src={formData.image} alt="Preview" className="h-20 mt-3 rounded-xl object-cover shadow-sm border border-slate-200" />}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Stok Awal</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required min="0" />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit Kategori */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input type="text" value={categoryFormData.name} onChange={e => setCategoryFormData({ name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="Contoh: Snack" />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Simpan Kategori</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingUser ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Pegawai</label>
                <input type="text" value={userFormData.name} onChange={e => setUserFormData({ name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="Contoh: Budi" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">PIN Login (Angka)</label>
                <input type="text" inputMode="numeric" value={userFormData.pin} onChange={e => setUserFormData({ ...userFormData, pin: e.target.value.replace(/\D/g, '') })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest" required placeholder="Contoh: 123456" />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Simpan Kasir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}