import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import db from './db.js'; // Membutuhkan ekstensi .js jika menggunakan NodeNext pada tsconfig
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper function untuk response error yang seragam (Clean Code: DRY)
const sendError = (res: Response, error: unknown, defaultMessage?: string) => {
  res.status(500).json({ status: 'error', message: defaultMessage || (error instanceof Error ? error.message : 'Unknown error') });
};

app.get('/', async (req: Request, res: Response) => {
  try {
    // Mengeksekusi raw query SQL langsung ke XAMPP
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    
    res.json({ 
      status: 'success', 
      message: 'Berhasil terhubung ke XAMPP MySQL murni tanpa Prisma!',
      data: rows
    });
  } catch (error) {
    sendError(res, error, 'Gagal terhubung ke database.');
  }
});

// ==========================================
// API PENGATURAN KAFE
// ==========================================

app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM Setting WHERE id = 1');
    const setting = (rows as any[])[0] || { cafeName: "Wil's Coffee Shop", cafeAddress: "Jl. Kopi Nikmat No. 123, Jakarta", taxPercentage: 5 };
    res.json({ status: 'success', data: setting });
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const { cafeName, cafeAddress, taxPercentage } = req.body;
    await db.query(
      'UPDATE Setting SET cafeName = ?, cafeAddress = ?, taxPercentage = ? WHERE id = 1',
      [cafeName, cafeAddress, taxPercentage]
    );
    res.json({ status: 'success', message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// API CRUD KATEGORI
// ==========================================

// 1. Read (Tampil Semua Kategori)
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM Category ORDER BY id DESC');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    sendError(res, error);
  }
});

// 2. Create (Tambah Kategori)
app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const [result] = await db.query('INSERT INTO Category (name) VALUES (?)', [name]);
    res.status(201).json({ status: 'success', message: 'Kategori berhasil ditambahkan', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 3. Update (Ubah Kategori)
app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const [result] = await db.query('UPDATE Category SET name = ? WHERE id = ?', [name, id]);
    res.json({ status: 'success', message: 'Kategori berhasil diubah', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 4. Delete (Hapus Kategori)
app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM Category WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Kategori berhasil dihapus', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// API CRUD USER (KASIR)
// ==========================================

// 1. Read (Tampil Semua Kasir)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM User ORDER BY id DESC');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    sendError(res, error);
  }
});

// 2. Create (Tambah Kasir)
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { name, pin } = req.body;
    const [result] = await db.query("INSERT INTO User (name, role, pin) VALUES (?, 'Kasir', ?)", [name, pin || '123456']);
    res.status(201).json({ status: 'success', message: 'Kasir berhasil ditambahkan', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 3. Update (Ubah Kasir)
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, pin } = req.body;
    const [result] = await db.query('UPDATE User SET name = ?, pin = ? WHERE id = ?', [name, pin, id]);
    res.json({ status: 'success', message: 'Kasir berhasil diubah', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 4. Delete (Hapus Kasir)
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM User WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Kasir berhasil dihapus', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// API CRUD PRODUK (MENU KOPI)
// ==========================================

// 1. Read (Tampil Semua Produk + Nama Kategori dengan JOIN)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT p.*, c.name AS category_name 
      FROM Product p 
      LEFT JOIN Category c ON p.categoryId = c.id 
      ORDER BY p.id DESC
    `;
    const [rows] = await db.query(query);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    sendError(res, error);
  }
});

// 2. Create (Tambah Produk Baru)
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, categoryId, image } = req.body;
    const query = 'INSERT INTO Product (name, description, price, stock, categoryId, image) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [name, description, price, stock, categoryId, image || null]);
    res.status(201).json({ status: 'success', message: 'Produk berhasil ditambahkan', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 3. Update (Ubah Data Produk)
app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId, image } = req.body;
    const query = 'UPDATE Product SET name = ?, description = ?, price = ?, stock = ?, categoryId = ?, image = ? WHERE id = ?';
    const [result] = await db.query(query, [name, description, price, stock, categoryId, image || null, id]);
    res.json({ status: 'success', message: 'Produk berhasil diubah', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// 4. Delete (Hapus Produk)
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM Product WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Produk berhasil dihapus', data: result });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================
// API FITUR KASIR (TRANSAKSI / ORDER)
// ==========================================

// 1. Create (Membuat Pesanan Baru)
app.post('/api/orders', async (req: Request, res: Response): Promise<any> => {
  const { customerName = 'Guest', orderType = 'Dine In', paymentMethod = 'Cash', discount = 0, note = '', items } = req.body;

  // Validasi input
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Item pesanan tidak boleh kosong' });
  }

  // Mengambil satu koneksi khusus dari pool untuk melakukan Transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    let subtotalAmount = 0;
    const orderDetailsData = [];

    // a. Hitung total harga & validasi stok produk
    for (const item of items) {
      const { productId, quantity } = item;
      const [productRows] = await connection.query('SELECT name, price, stock FROM Product WHERE id = ?', [productId]);
      const product = (productRows as any[])[0];

      if (!product) {
        throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
      }
      if (product.stock < quantity) {
        throw new Error(`Stok ${product.name} tidak mencukupi. Sisa stok: ${product.stock}`);
      }

      const subtotal = product.price * quantity;
      subtotalAmount += subtotal;

      orderDetailsData.push({ productId, quantity, subtotal });

      // Potong stok produk
      await connection.query('UPDATE Product SET stock = stock - ? WHERE id = ?', [quantity, productId]);
    }

    // b. Hitung pajak dinamis dari tabel Setting
    const [settingRows] = await connection.query('SELECT taxPercentage FROM Setting WHERE id = 1');
    const taxPercentage = (settingRows as any[])[0]?.taxPercentage || 0;

    const subtotalAfterDiscount = Math.max(0, subtotalAmount - discount);
    const tax = subtotalAfterDiscount * (taxPercentage / 100);
    const totalAmount = subtotalAfterDiscount + tax;

    // c. Simpan data ke tabel Order
    const [orderResult] = await connection.query(
      'INSERT INTO `Order` (customerName, orderType, totalAmount, paymentMethod, note) VALUES (?, ?, ?, ?, ?)',
      [customerName, orderType, totalAmount, paymentMethod, note]
    );
    const orderId = (orderResult as any).insertId;

    // d. Simpan data ke tabel OrderDetail
    for (const detail of orderDetailsData) {
      await connection.query(
        'INSERT INTO OrderDetail (orderId, productId, quantity, subtotal) VALUES (?, ?, ?, ?)',
        [orderId, detail.productId, detail.quantity, detail.subtotal]
      );
    }

    // e. Jika semua sukses, simpan permanen (Commit)
    await connection.commit();
    res.status(201).json({ status: 'success', message: 'Transaksi berhasil disimpan', data: { orderId, totalAmount } });
  } catch (error) {
    // Jika ada yang gagal/error (misal stok kurang), batalkan semua perubahan (Rollback)
    await connection.rollback();
    sendError(res, error);
  } finally {
    // Selalu kembalikan koneksi ke pool
    connection.release();
  }
});

// 2. Read (Tampil Semua Riwayat Pesanan)
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM `Order` ORDER BY id DESC');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    sendError(res, error);
  }
});

// 3. Read (Tampil Detail Pesanan Spesifik Berdasarkan ID)
app.get('/api/orders/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const [orderRows] = await db.query('SELECT * FROM `Order` WHERE id = ?', [id]);
    const order = (orderRows as any[])[0];

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan' });
    }

    // Ambil detail item yang dibeli, JOIN dengan tabel Product untuk mendapatkan nama kopinya
    const [detailRows] = await db.query(`
      SELECT od.id, p.name AS product_name, od.quantity, od.subtotal
      FROM OrderDetail od
      JOIN Product p ON od.productId = p.id
      WHERE od.orderId = ?
    `, [id]);

    order.items = detailRows; // Gabungkan detail ke dalam objek order
    res.json({ status: 'success', data: order });
  } catch (error) {
    sendError(res, error);
  }
});

// 4. Read (Tampil 5 Produk Terlaris)
app.get('/api/top-products', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT p.name, SUM(od.quantity) as total_sold
      FROM OrderDetail od
      JOIN Product p ON od.productId = p.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `;
    const [rows] = await db.query(query);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    sendError(res, error);
  }
});

app.listen(port, () => {
  console.log(`[Server]: Berjalan di http://localhost:${port}`);
});