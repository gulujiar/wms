import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});
app.use(morgan('dev'));

// 数据库连接配置
const dbConfig = {
  host: '106.52.209.141',
  port: 3306,
  user: 'root',
  password: '14753abc....',
  database: 'wms_db'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 获取所有产品
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('获取产品列表失败:', err);
    res.status(500).json({ error: '获取产品列表失败', details: err.message });
  }
});

// 添加新产品
app.post('/api/products', async (req, res) => {
  const { name, note, image } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (id, name, note, image) VALUES (UUID(), ?, ?, ?)',
      [name, note, image]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 获取库存(包含产品信息)
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.id, i.quantity, i.created_at, p.id AS product_id, p.name, p.note 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id
      ORDER BY i.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('获取库存失败:', err);
    res.status(500).json({ error: '获取库存失败', details: err.message });
  }
});

// 添加库存
app.post('/api/inventory', async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    // 确保quantity是一个有效的正整数
    const validQuantity = Math.max(1, parseInt(quantity) || 1);
    
    // 检查是否存在相同产品的库存记录
    const [existingItems] = await pool.query(
      'SELECT id, quantity FROM inventory WHERE product_id = ?',
      [product_id]
    );

    if (existingItems.length > 0) {
      // 如果存在，更新数量
      const newQuantity = existingItems[0].quantity + validQuantity;
      await pool.query(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
      res.status(200).json({ id: existingItems[0].id });
    } else {
      // 如果不存在，创建新记录
      const [result] = await pool.query(
        'INSERT INTO inventory (id, product_id, quantity) VALUES (UUID(), ?, ?)',
        [product_id, validQuantity]
      );
      res.status(201).json({ id: result.insertId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 获取订单(包含产品信息)
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.name, o.address, o.note, o.status, o.created_at,
             op.quantity,
             p.id AS product_id, p.name AS product_name, p.note AS product_note
      FROM orders o
      LEFT JOIN order_products op ON o.id = op.order_id
      LEFT JOIN products p ON op.product_id = p.id
      ORDER BY o.created_at DESC
    `);
    
    // 重新组织数据结构
    const orders = rows.reduce((acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          name: row.name,
          address: row.address,
          note: row.note,
          status: row.status,
          created_at: row.created_at,
          products: []
        };
      }
      
      if (row.product_id) {
        acc[row.id].products.push({
          productId: row.product_id,
          name: row.product_name,
          quantity: row.quantity
        });
      }
      
      return acc;
    }, {});
    
    res.json(Object.values(orders));
  } catch (err) {
    console.error('获取订单失败:', err);
    res.status(500).json({ error: '获取订单失败', details: err.message });
  }
});

// 创建订单
app.post('/api/orders', async (req, res) => {
  const { name, address, note, products } = req.body;
  try {
    // 生成订单ID
    const orderId = await pool.query('SELECT UUID() as id').then(([rows]) => rows[0].id);
    
    // 创建订单主记录
    await pool.query(
      'INSERT INTO orders (id, name, address, note) VALUES (?, ?, ?, ?)',
      [orderId, name, address, note]
    );
    
    // 创建订单产品关联记录
    for (const product of products) {
      await pool.query(
        'INSERT INTO order_products (id, order_id, product_id, quantity) VALUES (UUID(), ?, ?, ?)',
        [orderId, product.productId, product.quantity]
      );
    }
    
    res.status(201).json({ id: orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 删除产品
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('删除产品失败:', err);
    res.status(500).json({ error: '删除产品失败', details: err.message });
  }
});

// 更新库存数量
// 批量更新库存接口
app.put('/api/inventory/bulk', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { updates } = req.body;

    // 预检查库存是否充足
    for (const update of updates) {
      const [item] = await connection.query(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [update.productId]
      );
      
      if (!item[0] || item[0].quantity + update.quantity < 0) {
        throw new Error(`产品 ${update.productId} 库存不足`);
      }
    }

    // 执行批量更新
    for (const update of updates) {
      await connection.query(
        'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
        [update.quantity, update.productId]
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error('批量更新库存失败:', err);
    res.status(400).json({ 
      error: err.message.includes('库存不足') ? err.message : '库存更新失败',
      details: err.message 
    });
  } finally {
    connection.release();
  }
});

// 单个库存更新接口
app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  // 验证quantity是否为有效正整数
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: '数量必须为正整数' });
  }
  
  try {
    await pool.query('UPDATE inventory SET quantity = ? WHERE id = ?', [quantity, id]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('更新库存数量失败:', err);
    res.status(500).json({ error: '更新库存数量失败', details: err.message });
  }
});

// 删除库存项
app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('删除库存项失败:', err);
    res.status(500).json({ error: '删除库存项失败', details: err.message });
  }
});

// 删除订单
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('删除订单失败:', err);
    res.status(500).json({ error: '删除订单失败', details: err.message });
  }
});

// 添加连接池事件监听
pool.on('connection', (connection) => {
  console.log('新的数据库连接建立');
});

pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});