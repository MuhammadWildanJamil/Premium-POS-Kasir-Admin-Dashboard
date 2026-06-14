import db from './db.js';

const categories = [
  { id: 1, name: 'Coffee' },
  { id: 2, name: 'Matcha' },
  { id: 3, name: 'Tea' },
  { id: 4, name: 'Non Coffee' },
  { id: 5, name: 'Light Meal' },
  { id: 6, name: 'Meal' }
];

const products = [
  { id: 1, name: 'Cafe Latte', price: 25000, stock: 50, categoryId: 1 },
  { id: 2, name: 'Cappuccino', price: 25000, stock: 50, categoryId: 1 },
  { id: 3, name: 'Americano', price: 20000, stock: 50, categoryId: 1 },
  { id: 4, name: 'Matcha Latte', price: 28000, stock: 50, categoryId: 2 },
  { id: 5, name: 'Matcha Frappe', price: 30000, stock: 50, categoryId: 2 },
  { id: 6, name: 'Lychee Tea', price: 22000, stock: 50, categoryId: 3 },
  { id: 7, name: 'Earl Grey Tea', price: 22000, stock: 50, categoryId: 3 },
  { id: 8, name: 'Red Velvet', price: 26000, stock: 50, categoryId: 4 },
  { id: 9, name: 'Taro Latte', price: 26000, stock: 50, categoryId: 4 },
  { id: 10, name: 'French Fries', price: 15000, stock: 50, categoryId: 5 },
  { id: 11, name: 'Mix Platter', price: 25000, stock: 50, categoryId: 5 },
  { id: 12, name: 'Chicken Katsu Rice', price: 35000, stock: 50, categoryId: 6 },
  { id: 13, name: 'Spaghetti Carbonara', price: 40000, stock: 50, categoryId: 6 },
];

async function seed() {
  console.log('Mulai menyemai (seeding) database...');
  const connection = await db.getConnection();

  try {
    // Hapus data lama agar tidak terjadi duplikat jika dijalankan ulang
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE `Product`;');
    await connection.query('TRUNCATE TABLE `Category`;');

    // Masukkan Kategori
    for (const cat of categories) {
      await connection.query(
        'INSERT INTO `Category` (`id`, `name`, `createdAt`, `updatedAt`) VALUES (?, ?, NOW(), NOW())',
        [cat.id, cat.name]
      );
    }
    console.log(`Berhasil menambahkan ${categories.length} kategori.`);

    // Masukkan Produk
    for (const prod of products) {
      await connection.query(
        'INSERT INTO `Product` (`id`, `name`, `price`, `stock`, `categoryId`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [prod.id, prod.name, prod.price, prod.stock, prod.categoryId]
      );
    }
    console.log(`Berhasil menambahkan ${products.length} produk.`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Seeding selesai!');
  } catch (error) {
    console.error('Terjadi kesalahan saat seeding:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();