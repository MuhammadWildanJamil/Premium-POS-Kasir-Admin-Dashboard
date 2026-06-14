import { useState, useEffect } from 'react';
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

type CartItem = {
  productId: number;
  name: string;
  price: number;
  qty: number;
};

type User = {
  id: number;
  name: string;
  pin: string;
};

// Fungsi bantuan untuk memberi ikon berdasarkan kategori
const getCategoryIcon = (category: string) => {
  if (category === 'Coffee') return '☕';
  if (category === 'Matcha') return '🍵';
  if (category === 'Tea') return '🫖';
  if (category === 'Non Coffee') return '🥤';
  if (category === 'Light Meal') return '🍟';
  if (category === 'Meal') return '🍝';
  return '🍽️';
};

// Konstanta Base URL (Clean Code: Mencegah Magic Strings)
const API_BASE_URL = 'http://localhost:3000/api';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Kartu'>('Cash');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>(() => {
    return localStorage.getItem('cashierName') || 'Kasir';
  });
  const [printMode, setPrintMode] = useState<'Browser' | 'Tablet'>('Browser');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState({ cafeName: "Wil's Coffee Shop", cafeAddress: "Jl. Kopi Nikmat No. 123, Jakarta", taxPercentage: 5 });
  const [isCashierAuthenticated, setIsCashierAuthenticated] = useState(() => {
    return localStorage.getItem('isCashierAuth') === 'true';
  });
  const [pin, setPin] = useState('');

  // Ambil data inisial dari Backend secara paralel (Clean Code: Optimasi Performa / Hindari Waterfall)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodRes, userRes, setRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`).then(r => r.json()),
          fetch(`${API_BASE_URL}/users`).then(r => r.json()),
          fetch(`${API_BASE_URL}/settings`).then(r => r.json())
        ]);
        
        if (prodRes.status === 'success') setProducts(prodRes.data);
        if (userRes.status === 'success') setUsers(userRes.data);
        if (setRes.status === 'success') setSettings(setRes.data);
      } catch (err) {
        console.error('Gagal mengambil data inisial:', err);
      }
    };
    
    fetchInitialData();
  }, []);

  // Set nama tab browser agar terlihat rapi
  useEffect(() => {
    document.title = `${settings.cafeName} - Sistem Kasir`;
  }, [settings.cafeName]);

  // Deret kategori unik untuk menu filter
  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category_name || 'Lainnya')))];

  // Fungsi untuk menambah pesanan ke keranjang
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert('Maaf, stok produk ini sedang habis!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        // Cek jika penambahan qty melebihi stok yang ada
        if (existing.qty + 1 > product.stock) {
          alert(`Maksimal stok ${product.name} yang tersedia hanya ${product.stock} porsi.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  // Fungsi untuk mengubah jumlah (quantity) item (+ atau -)
  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.productId === productId) {
        // Ambil data stok produk asli
        const product = products.find(p => p.id === productId);
        const newQty = item.qty + delta;
        if (product && newQty > product.stock) {
          alert(`Maksimal stok ${product.name} yang tersedia hanya ${product.stock} porsi.`);
          return item; // Batalkan penambahan
        }
        return { ...item, qty: newQty > 0 ? newQty : 1 }; // Cegah qty di bawah 1
      }
      return item;
    }));
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Menghitung subtotal, diskon, pajak dinamis, dan total akhir
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = typeof discount === 'number' ? discount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalAfterDiscount * (settings.taxPercentage / 100);
  const total = Math.round(subtotalAfterDiscount + tax); // Pembulatan untuk menghindari error desimal

  // Fungsi untuk mengambil Riwayat Penjualan dari Backend
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const data = await res.json();
      if (data.status === 'success') {
        setOrderHistory(data.data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      alert('Gagal mengambil riwayat transaksi.');
    }
  };

  // Fungsi untuk cetak ulang struk (Print / Save as PDF)
  const handleReprint = async (id: number) => {
    // Buka tab/jendela baru lebih awal agar tidak diblokir oleh Pop-up Blocker browser
    let printWindow: Window | null = null;
    if (printMode === 'Browser') {
      printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) printWindow.document.write('Memuat struk...');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`);
      const data = await res.json();
      if (data.status === 'success') {
        const order = data.data;
        
        const orderSubtotal = order.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
        const taxRate = settings.taxPercentage / 100;
        const orderDiscount = Math.round(orderSubtotal - (Number(order.totalAmount) / (1 + taxRate)));
        const orderTax = Math.round((orderSubtotal - orderDiscount) * taxRate);
        
        if (printMode === 'Tablet') {
          let text = `[C]<b>${settings.cafeName}</b>\n`;
          text += `[C]${settings.cafeAddress.replace(/\n/g, ' ')}\n`;
          text += "--------------------------------\n";
          text += `Order : #INV-${order.id}\n`;
          text += `Waktu : ${new Date(order.createdAt).toLocaleString('id-ID')}\n`;
          text += `Pelang: ${order.customerName || 'Guest'}\n`;
          text += `Tipe  : ${order.orderType || 'Dine In'}\n`;
          if (order.note) {
            text += `Catatan: ${order.note}\n`;
          }
          text += "--------------------------------\n";
          order.items.forEach((item: any) => {
            text += `${item.product_name}\n`;
            text += `${item.quantity}x ${Number(item.subtotal/item.quantity).toLocaleString('id-ID')} = Rp ${Number(item.subtotal).toLocaleString('id-ID')}\n`;
          });
          text += "--------------------------------\n";
          text += `Subtotal: Rp ${orderSubtotal.toLocaleString('id-ID')}\n`;
          if (orderDiscount > 0) {
            text += `Diskon  : -Rp ${orderDiscount.toLocaleString('id-ID')}\n`;
          }
          text += `Pajak ${settings.taxPercentage}%: Rp ${orderTax.toLocaleString('id-ID')}\n`;
          text += `Total   : Rp ${Number(order.totalAmount).toLocaleString('id-ID')}\n`;
          text += `Metode  : ${order.paymentMethod}\n`;
          text += "C\n";
          text += "--------------------------------\n";
          text += "[C]Terima Kasih!\n\n\n";
          
          window.location.href = `intent:${encodeURIComponent(text)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
        } else if (printWindow) {
          // Format Struk PDF / Print Browser dengan CSS
          const html = `
            <html>
              <head>
                <title>Cetak Struk #INV-${order.id}</title>
                <style>
                  @page { size: 80mm auto; margin: 0; }
                  body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; font-size: 12px; }
                  .center { text-align: center; }
                  .bold { font-weight: bold; }
                  .border-bottom { border-bottom: 1px dashed #000; margin: 10px 0; padding-bottom: 10px; }
                  .flex { display: flex; justify-content: space-between; margin-bottom: 4px; }
                  .mt { margin-top: 10px; }
                </style>
              </head>
              <body>
                <div class="center bold border-bottom">
                  <h2 style="margin:0 0 4px 0; font-size: 16px;">${settings.cafeName}</h2>
                  <div>${settings.cafeAddress.replace(/\n/g, '<br/>')}</div>
                </div>
                <div class="border-bottom">
                  <div class="flex"><span>Order:</span> <span class="bold">#INV-${order.id}</span></div>
                  <div class="flex"><span>Waktu:</span> <span>${new Date(order.createdAt).toLocaleString('id-ID')}</span></div>
                  <div class="flex"><span>Pelanggan:</span> <span>${order.customerName || 'Guest'}</span></div>
                  <div class="flex"><span>Tipe:</span> <span>${order.orderType || 'Dine In'}</span></div>
                  ${order.note ? `<div class="flex"><span>Catatan:</span> <span>${order.note}</span></div>` : ''}
                </div>
                <div class="border-bottom">
                  ${order.items.map((item: any) => `
                    <div style="margin-bottom: 8px;">
                      <div class="bold">${item.product_name}</div>
                      <div class="flex">
                        <span>${item.quantity}x ${Number(item.subtotal/item.quantity).toLocaleString('id-ID')}</span>
                        <span class="bold">Rp ${Number(item.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="border-bottom">
                  <div class="flex" style="font-size: 14px;">
                    <span>Subtotal:</span>
                    <span>Rp ${orderSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  ${orderDiscount > 0 ? `
                  <div class="flex" style="font-size: 14px;">
                    <span>Diskon:</span>
                    <span>-Rp ${orderDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  ` : ''}
                  <div class="flex" style="font-size: 14px;">
                    <span>Pajak (${settings.taxPercentage}%):</span>
                    <span>Rp ${orderTax.toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex bold mt" style="font-size: 14px;">
                    <span>Total:</span>
                    <span>Rp ${Number(order.totalAmount).toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex mt">
                    <span>Metode:</span>
                    <span>${order.paymentMethod}</span>
                  </div>
                </div>
                <div class="center mt">
                  <div class="bold">Terima Kasih!</div>
                  <div style="font-size: 10px; margin-top: 4px;">(Cetak Ulang)</div>
                </div>
                <script>
                  window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                </script>
              </body>
            </html>
          `;
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
        }
      } else {
        if (printWindow) printWindow.close();
        alert('Gagal mengambil detail pesanan');
      }
    } catch (err) {
      if (printWindow) printWindow.close();
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Fungsi untuk memproses pesanan ke Backend (dipanggil dari pop-up)
  const processCheckout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || 'Guest',
          orderType: orderType,
          paymentMethod: paymentMethod, // Gunakan state yang dipilih kasir
          discount: discountAmount,
          note: note,
          items: cart.map(item => ({ productId: item.productId, quantity: item.qty }))
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setShowConfirmModal(false);
        setOrderId(result.data.orderId);
        setShowSuccessModal(true); // Tampilkan Pop-up Berhasil
        
        // Tunggu 2 detik untuk animasi, lalu otomatis print struk
        setTimeout(() => {
          setShowSuccessModal(false);
          
          if (printMode === 'Tablet') {
            // Format struk khusus untuk aplikasi RawBT di Tablet Android
            let text = `[C]<b>${settings.cafeName}</b>\n`;
            text += `[C]${settings.cafeAddress.replace(/\n/g, ' ')}\n`;
            text += "--------------------------------\n";
            text += `Order : #INV-${result.data.orderId}\n`;
            text += `Kasir : ${cashierName}\n`;
            text += `Pelang: ${customerName || 'Guest'}\n`;
            text += `Tipe  : ${orderType}\n`;
            if (note) {
              text += `Catatan: ${note}\n`;
            }
            text += "--------------------------------\n";
            cart.forEach(item => {
              text += `${item.name}\n`;
              text += `${item.qty}x ${item.price.toLocaleString('id-ID')} = Rp ${(item.qty * item.price).toLocaleString('id-ID')}\n`;
            });
            text += "--------------------------------\n";
            text += `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
            if (discountAmount > 0) {
              text += `Diskon  : -Rp ${discountAmount.toLocaleString('id-ID')}\n`;
            }
            text += `Pajak ${settings.taxPercentage}%: Rp ${tax.toLocaleString('id-ID')}\n`;
            text += `Total   : Rp ${total.toLocaleString('id-ID')}\n`;
            text += `Metode  : ${paymentMethod}\n`;
            if (paymentMethod === 'Cash' && typeof cashReceived === 'number') {
              text += `Tunai   : Rp ${cashReceived.toLocaleString('id-ID')}\n`;
              text += `Kembali : Rp ${(cashReceived - total).toLocaleString('id-ID')}\n`;
            }
            text += "--------------------------------\n";
            text += "[C]Terima Kasih!\n\n\n";
            
            // Kirim perintah cetak ke aplikasi RawBT menggunakan URL Intent Android
            window.location.href = `intent:${encodeURIComponent(text)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
          } else {
            window.print(); // Mode laptop/desktop
          }
          
          setCart([]);
          setCustomerName(''); // Kosongkan nama pelanggan untuk pesanan berikutnya
          setCashReceived(''); // Kosongkan uang diterima
          setDiscount(''); // Kosongkan diskon
          setNote(''); // Kosongkan catatan
          setOrderType('Dine In'); // Kembalikan ke default
        }, 2000);
      } else {
        alert(`Gagal memproses pesanan: ${result.message}`);
        setShowConfirmModal(false);
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan saat memproses pesanan.');
      setShowConfirmModal(false);
    }
  };

  // Filter produk berdasarkan kategori DAN pencarian nama menu
  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'Semua' || (p.category_name || 'Lainnya') === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Fungsi untuk menangani proses login kasir
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cek apakah PIN ada di database
    // Gunakan String() agar tipe data angka dari DB dan teks dari input bisa cocok
    const matchedUser = users.find(u => String(u.pin || '123456') === String(pin));
    
    if (matchedUser) {
      setIsCashierAuthenticated(true);
      setCashierName(matchedUser.name);
      localStorage.setItem('isCashierAuth', 'true');
      localStorage.setItem('cashierName', matchedUser.name);
    } else {
      alert('PIN salah atau tidak ditemukan! Silakan coba lagi.');
      setPin('');
    }
  };

  // Fungsi untuk keluar (logout) dari sesi kasir
  const handleLogout = () => {
    setIsCashierAuthenticated(false);
    localStorage.removeItem('isCashierAuth');
    localStorage.removeItem('cashierName');
    setPin('');
  };

  // Jika kasir belum login, tampilkan layar form Login (Keypad PIN)
  if (!isCashierAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-sm w-full mx-4 border border-white">
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Akses Kasir</h2>
          <p className="text-sm text-slate-500 mb-8 text-center font-medium">Masukkan PIN kasir untuk memulai</p>
          
          <input type="password" inputMode="numeric" placeholder="••••••" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-2xl font-black focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none mb-6 transition-all text-center tracking-[0.5em] text-slate-800" autoFocus required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 mb-4">Buka Kasir</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden print:block print:h-auto print:bg-white">
      
      {/* Konfigurasi Ukuran Kertas Printer Kasir (Thermal 80mm) */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
      
      {/* Bagian Kiri: Area Utama Menu */}
      <div className="flex-[7] flex flex-col h-full relative print:hidden">
        
        {/* Bagian Atas: Header & Kategori (Sticky) */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          {/* Header Area Kiri */}
          <header className="px-8 py-6 flex justify-between items-center gap-6">
            <div className="shrink-0 cursor-default">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{settings.cafeName}</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Pilih menu pesanan pelanggan</p>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <input 
                type="text" 
                placeholder="Cari nama menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 border border-transparent focus:bg-white focus:border-blue-500 rounded-full px-5 py-3 pl-11 text-sm font-medium outline-none transition-all shadow-sm placeholder:text-slate-400"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Area Kanan Header */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-blue-50/50 text-blue-700 px-5 py-2.5 rounded-full font-bold text-sm border border-blue-100 hidden xl:block">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {/* Tombol Riwayat */}
              <button 
                onClick={fetchHistory}
                className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 px-4 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <span>📋</span> Riwayat
              </button>
              {/* Tombol Admin */}
              <Link 
                to="/admin"
                className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <span>⚙️</span> Admin
              </Link>
              {/* Tombol Logout Kasir */}
              <button 
                onClick={handleLogout}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
              >
                Keluar
              </button>
              {/* Pilihan Mode Cetak */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-full shadow-sm">
                <span className="text-lg">🖨️</span>
                <select 
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value as 'Browser' | 'Tablet')}
                  className="border-none text-sm font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
                  title="Mode Cetak"
                >
                  <option value="Browser">PC / Browser</option>
                  <option value="Tablet">Tablet Android</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                <span className="text-lg">🧑‍🍳</span>
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap max-w-[100px] truncate" title={cashierName}>
                  {cashierName}
                </span>
              </div>
            </div>
          </header>

          {/* Kategori Menu (Scroll Horizontal) */}
          <div className="px-8 pb-4 pt-2 overflow-x-auto hide-scrollbar">
            <div className="flex gap-3">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all active:scale-95 ${
                    activeCategory === cat 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <main className="p-8 overflow-y-auto h-full pb-24">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                <span className="text-4xl mb-4 grayscale opacity-50">🔍</span>
                <p className="font-medium">Menu yang dicari tidak ditemukan.</p>
              </div>
            ) : (
              filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => p.stock > 0 && addToCart(p)}
                className={`group bg-white border border-slate-200 rounded-3xl p-4 transition-all duration-300 flex flex-col relative overflow-hidden ${p.stock === 0 ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-300 active:scale-[0.98]'}`}
              >
                {/* Badge Kategori */ }
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100 z-10">
                  {p.category_name || 'Lainnya'}
                </div>

                {/* Badge Status Stok */ }
                {p.stock === 0 ? (
                  <div className="absolute top-4 left-4 bg-red-500 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm z-10">
                    HABIS
                  </div>
                ) : p.stock <= 5 ? (
                  <div className="absolute top-4 left-4 bg-orange-500 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm z-10">
                    SISA {p.stock}
                  </div>
                ) : null}
                
                {/* Ikon/Gambar Placeholder */ }
                {p.image ? (
                  <div className="h-36 bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-slate-100">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl mb-4 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                    {getCategoryIcon(p.category_name || 'Lainnya')}
                  </div>
                )}
                
                <div className="flex flex-col flex-1 justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{p.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-black text-blue-600 text-lg">
                      Rp {p.price.toLocaleString('id-ID')}
                    </p>
                    {p.stock > 0 && (
                      <button 
                      aria-label={`Tambah ${p.name} ke keranjang`}
                      className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors font-bold text-xl leading-none pb-1 shadow-sm"
                    >
                      +
                    </button>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Bagian Kanan: Kasir / Struk Pesanan */}
      <div className="flex-[3] min-w-[350px] max-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-20 print:w-full print:min-w-0 print:max-w-none print:shadow-none print:border-none print:m-0 print:p-2">
        
        {/* Header Struk */}
        <div className="p-6 border-b border-slate-100 print:text-center print:border-b-2 print:border-black print:pb-4">
          <h2 className="text-2xl font-bold text-slate-900 hidden print:block">{settings.cafeName}</h2>
          <p className="text-sm text-slate-500 hidden print:block mb-4 whitespace-pre-wrap">{settings.cafeAddress}</p>
          <h2 className="text-2xl font-bold text-slate-900 print:text-lg print:mt-2">Pesanan Saat Ini</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium print:text-black">Order #INV-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>

          {/* Info Kasir & Pelanggan Khusus Print */}
          <div className="hidden print:flex justify-between items-center mt-4 pt-4 border-t border-dashed border-slate-300 text-sm">
            <div className="text-left">
              <p className="text-slate-500 mb-1">Kasir:</p>
              <p className="font-bold text-black">{cashierName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 mb-1">Pelanggan:</p>
              <p className="font-bold text-black">{customerName || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Area Scrollable Tengah (Daftar Item + Form Input) */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col print:bg-white print:overflow-visible print:p-0 print:my-4 hide-scrollbar">
          
          {/* Daftar Item Struk */}
          <div className="p-6 space-y-4 print:p-0 flex-1 min-h-min">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[200px]">
              <div className="text-6xl grayscale opacity-30 drop-shadow-sm">🛒</div>
              <p className="font-medium">Belum ada pesanan masuk</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all print:border-none print:shadow-none print:p-0 print:border-b print:border-dashed print:border-slate-300 print:rounded-none print:pb-2">
                <div className="flex justify-between items-start mb-3 print:mb-1">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{item.name}</h4>
                    <div className="text-sm font-bold text-blue-600 mt-2 print:text-black">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.productId)} 
                    className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 print:hidden"
                    title="Hapus Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-slate-50 print:pt-1 print:border-none">
                  <span className="text-xs text-slate-500 font-medium print:text-black">Rp {item.price.toLocaleString('id-ID')} / qty</span>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100 print:hidden">
                    <button 
                      aria-label={`Kurangi jumlah ${item.name}`} 
                      onClick={() => updateQty(item.productId, -1)} 
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 font-bold hover:bg-slate-200 active:scale-95 transition-all shadow-sm">-</button>
                    <span className="w-4 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                    <button 
                      aria-label={`Tambah jumlah ${item.name}`} 
                      onClick={() => updateQty(item.productId, 1)} 
                      className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm">+</button>
                  </div>
                  {/* Teks jumlah qty khusus untuk Print */}
                  <span className="hidden print:inline-block font-bold text-sm text-slate-800">x{item.qty}</span>
                </div>
              </div>
            ))
          )}
          </div>

          {/* Form Input Pembayaran (Dikembalikan ke area scroll) */}
          {cart.length > 0 && (
            <div className="px-6 pb-6 print:hidden">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                {/* Input Tipe Pesanan */}
                <p className="text-sm font-bold text-slate-700 mb-2">Tipe Pesanan</p>
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setOrderType('Dine In')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${orderType === 'Dine In' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >Makan di Tempat</button>
                  <button 
                    onClick={() => setOrderType('Take Away')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${orderType === 'Take Away' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}
                  >Bawa Pulang</button>
                </div>

                {/* Input Nama Pelanggan */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">Nama Pelanggan</p>
                  <input 
                    type="text" 
                    placeholder="Nama pelanggan..." 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Input Catatan Pesanan */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">Catatan (Opsional)</p>
                  <textarea 
                    placeholder="Contoh: Less ice..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-16"
                  />
                </div>

                {/* Metode Pembayaran */}
                <p className="text-sm font-bold text-slate-700 mb-2">Metode Pembayaran</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'Cash' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    Cash
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'QRIS' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    QRIS
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('Kartu')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'Kartu' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    Kartu EDC
                  </button>
                </div>

                {/* Input Uang Tunai Khusus Cash */}
                {paymentMethod === 'Cash' && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-slate-700">Uang Diterima</p>
                      <button 
                        onClick={() => setCashReceived(total)}
                        className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1 rounded-full transition-colors active:scale-95"
                      >
                        Uang Pas
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={cashReceived === '' ? '' : cashReceived.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          setCashReceived(rawValue === '' ? '' : Number(rawValue));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                    {typeof cashReceived === 'number' && cashReceived >= total && (
                      <div className="flex justify-between items-center mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <span className="text-sm font-bold text-green-700">Kembalian:</span>
                        <span className="text-lg font-black text-green-700">Rp {(cashReceived - total).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {typeof cashReceived === 'number' && cashReceived < total && cashReceived > 0 && (
                      <div className="mt-2 text-xs font-bold text-red-500">Uang diterima kurang!</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bagian Footer / Tombol Bayar */}
        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] print:shadow-none print:border-t-2 print:border-black print:p-0 print:pt-4">
          <div className="flex justify-between items-center mb-2 text-slate-500 print:text-black">
            <span className="font-medium text-sm">Subtotal</span>
            <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          
          {/* Input Diskon */}
          <div className="flex justify-between items-center mb-2 print:hidden">
            <span className="font-medium text-sm text-slate-500">Diskon (Rp)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-red-400 text-xs">Rp</span>
              <input 
                type="text" 
                inputMode="numeric"
                value={discount === '' ? '' : discount.toLocaleString('id-ID')}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  const val = rawValue === '' ? '' : Number(rawValue);
                  setDiscount(val === '' ? '' : (val > subtotal ? subtotal : val));
                }}
                className="w-32 bg-red-50 border border-red-100 rounded-lg pl-8 pr-3 py-1.5 text-right text-sm font-bold focus:ring-2 focus:ring-red-400 outline-none transition-all text-red-600 placeholder:text-red-300"
                placeholder="0"
              />
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="hidden print:flex justify-between items-center mb-2 text-slate-500 print:text-black">
              <span className="font-medium text-sm">Diskon</span>
              <span className="font-bold">-Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-5 text-slate-500 print:text-black">
            <span className="font-medium text-sm">Pajak ({settings.taxPercentage}%)</span>
            <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-end mb-6 print:mb-2">
            <span className="text-lg font-bold text-slate-800">Total</span>
            <span className="text-3xl font-black text-blue-600 print:text-xl print:text-black">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          {/* Info Cetak Tambahan Khusus Struk */}
          <div className="hidden print:block border-t border-dashed border-slate-300 pt-2 mt-2 mb-2">
            <div className="flex justify-between items-center text-slate-800 text-sm mb-1">
              <span>Metode:</span>
              <span className="font-bold">{paymentMethod}</span>
            </div>
            {paymentMethod === 'Cash' && typeof cashReceived === 'number' && (
              <>
                <div className="flex justify-between items-center text-slate-600 text-sm">
                  <span>Tunai:</span>
                  <span>Rp {cashReceived.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 text-sm font-bold mt-1">
                  <span>Kembalian:</span>
                  <span>Rp {(cashReceived - total).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          <button 
            disabled={cart.length === 0 || (paymentMethod === 'Cash' && (typeof cashReceived !== 'number' || cashReceived < total))}
            onClick={() => setShowConfirmModal(true)}
            className={`print:hidden w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              cart.length === 0 || (paymentMethod === 'Cash' && (typeof cashReceived !== 'number' || cashReceived < total))
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] active:scale-[0.98]'
            }`}
          >
            Bayar Sekarang
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          {/* Pesan Terima Kasih (Hanya muncul di kertas print) */}
          <div className="hidden print:block mt-8 text-center text-sm font-bold text-slate-600">
            Terima Kasih Telah Berkunjung!
          </div>
        </div>

      </div>

      {/* Modal Konfirmasi Pembayaran */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden transition-all duration-300 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full mx-auto shadow-2xl scale-100 transform transition-transform flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-slate-900 mb-4 shrink-0">Konfirmasi Pesanan</h3>
            
            {/* Rincian Pesanan (Bisa di-scroll jika panjang) */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 overflow-y-auto flex-1 border border-slate-100 hide-scrollbar">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 border-dashed">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Pelanggan</span>
                  <span className="font-bold text-slate-700">{customerName || 'Guest'}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 font-medium">Tipe</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md mt-0.5 ${orderType === 'Take Away' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{orderType}</span>
                </div>
              </div>
              
              <div className="space-y-3.5">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex gap-2.5">
                      <span className="font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{item.qty}x</span>
                      <span className="text-slate-900 font-bold text-base">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              
              {note && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block mb-1">Catatan:</span>
                  <span className="text-sm font-medium text-orange-600 italic bg-orange-50 px-3 py-1.5 rounded-lg block">{note}</span>
                </div>
              )}
            </div>

            {/* Bagian Bawah: Total & Tombol */}
            <div className="shrink-0">
              <div className="flex justify-between items-center mb-1 text-slate-500 text-sm font-medium">
                <span>Total Tagihan ({paymentMethod})</span>
                <span className="font-black text-blue-600 text-xl">Rp {total.toLocaleString('id-ID')}</span>
              </div>
              
              {paymentMethod === 'Cash' && typeof cashReceived === 'number' && (
                <div className="flex justify-between items-center text-sm font-medium mb-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Kembalian</span>
                  <span className="font-bold text-green-600">Rp {(cashReceived - total).toLocaleString('id-ID')}</span>
                </div>
              )}

              <p className="text-slate-500 mb-6 font-medium text-xs text-center mt-4">
                {paymentMethod === 'Cash' && `Pastikan uang tunai sebesar Rp ${typeof cashReceived === 'number' ? cashReceived.toLocaleString('id-ID') : '0'} sudah Anda terima.`}
                {paymentMethod === 'Kartu' && `Pastikan transaksi Kartu EDC sudah berhasil digesek.`}
                {paymentMethod === 'QRIS' && `Pastikan pembayaran QRIS sudah berhasil di-scan oleh pelanggan.`}
              </p>

              <div className="flex gap-3 justify-end w-full">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-3.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex-1"
                >
                  Cek Ulang
                </button>
                <button 
                  onClick={processCheckout}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex-1"
                >
                  Selesaikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses (Animasi Centang) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-green-100/50 border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">Berhasil!</h3>
            <p className="text-slate-500 font-medium">Pesanan #{orderId} telah disimpan.</p>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium animate-pulse">
              <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Menyiapkan struk...
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Penjualan di Layar Kasir */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Riwayat Penjualan Hari Ini</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {orderHistory.length === 0 ? (
                <div className="text-center text-slate-500 py-8">Belum ada transaksi.</div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">#INV-{order.id.toString().padStart(4, '0')}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">{order.paymentMethod}</span>
                        </div>
                        <div className="text-sm text-slate-500 flex gap-2">
                          <span>{order.customerName}</span> • 
                          <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span> • 
                          <span className={order.orderType === 'Take Away' ? 'text-orange-500 font-bold' : 'text-blue-500 font-bold'}>{order.orderType || 'Dine In'}</span>
                        </div>
                        {order.note && (
                          <div className="text-xs text-slate-400 mt-1 italic">
                            Catatan: {order.note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-slate-800 text-lg">
                          Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                        </div>
                        <button 
                          onClick={() => handleReprint(order.id)}
                          className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-1"
                        >
                          🖨️ Cetak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}