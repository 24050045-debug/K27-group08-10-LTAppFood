const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// KẾT NỐI DATABASE LARAGON
// ============================================================
const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'datamobile'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Lỗi kết nối database:', err.message);
        return;
    }
    console.log('✅ Đã kết nối thành công vào database: ' + process.env.DB_DATABASE);
});

// ============================================================
// MIDDLEWARE: Kiểm tra kết nối database trước mỗi request
// ============================================================
app.use((req, res, next) => {
    if (db.state === 'disconnected') {
        return res.status(503).json({ error: 'Database đang ngắt kết nối. Vui lòng thử lại!' });
    }
    next();
});

// ============================================================
// API TEST - Kiểm tra server còn sống không
// ============================================================
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: '🏍️ Server đang chạy ngon lành!', time: new Date().toISOString() });
});

// ============================================================
// API AUTH: ĐĂNG KÝ
// POST /api/auth/register
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    console.log('📥 Register request body:', JSON.stringify(req.body));
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone || !password) {
        console.log('❌ Missing fields:', { name: !!name, email: !!email, phone: !!phone, password: !!password });
        return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin.' });
    }

    try {
        // Kiểm tra email hoặc sđt đã tồn tại
        db.query('SELECT * FROM customers WHERE email = ? OR phone = ?', [email, phone], async (err, results) => {
            if (err) return res.status(500).json({ success: false, error: 'Lỗi server' });
            if (results.length > 0) {
                const existingUser = results[0];
                if (existingUser.email === email) {
                    return res.status(400).json({ success: false, error: 'Email đã được đăng ký.' });
                }
                if (existingUser.phone === phone) {
                    return res.status(400).json({ success: false, error: 'Số điện thoại đã được đăng ký.' });
                }
                return res.status(400).json({ success: false, error: 'Email hoặc số điện thoại đã được đăng ký.' });
            }

            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Thêm customer mới
            db.query(
                'INSERT INTO customers (full_name, email, phone, password, status) VALUES (?, ?, ?, ?, ?)',
                [name, email, phone, hashedPassword, 'active'],
                (err, insertRes) => {
                    if (err) {
                        console.error('❌ INSERT error:', err.message);
                        return res.status(500).json({ success: false, error: 'Lỗi khi tạo tài khoản: ' + err.message });
                    }

                    res.status(201).json({
                        success: true,
                        user: { id: insertRes.insertId, name, email, phone, linkedBank: false }
                    });
                }
            );
        });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
    }
});

// ============================================================
// API AUTH: ĐĂNG NHẬP
// POST /api/auth/login
// ============================================================
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu.' });
    }

    // 1. Kiểm tra bảng admins TRƯỚC (ưu tiên cao nhất)
    db.query('SELECT * FROM admins WHERE email = ?', [email], (err, adminResults) => {
        if (err) return res.status(500).json({ success: false, error: 'Lỗi server' });

        if (adminResults.length > 0) {
            const admin = adminResults[0];
            if (admin.password !== password) {
                return res.status(400).json({ success: false, error: 'Mật khẩu không đúng.' });
            }
            return res.json({
                success: true,
                user: { id: admin.admin_id, name: admin.full_name, email: admin.email, role: 'admin' }
            });
        }

        // 2. Kiểm tra bảng restaurants (ưu tiên thứ 2)
        db.query('SELECT * FROM restaurants WHERE email = ?', [email], (err, restResults) => {
            if (err) return res.status(500).json({ success: false, error: 'Lỗi server' });

            if (restResults.length > 0) {
                const rest = restResults[0];
                if (rest.password !== password) {
                    return res.status(400).json({ success: false, error: 'Mật khẩu không đúng.' });
                }
                return res.json({
                    success: true,
                    user: {
                        id: rest.restaurant_id,
                        name: rest.restaurant_name,
                        email: rest.email,
                        phone: rest.phone || '',
                        linkedBank: false,
                        role: 'restaurant',
                        restaurantId: rest.restaurant_id,
                    }
                });
            }

            // 3. Kiểm tra bảng customers (cuối cùng)
            db.query('SELECT * FROM customers WHERE email = ?', [email], async (err, results) => {
                if (err) return res.status(500).json({ success: false, error: 'Lỗi server' });

                if (results.length === 0) {
                    return res.status(400).json({ success: false, error: 'Email không tồn tại.' });
                }

                const user = results[0];

                if (user.status !== 'active') {
                    return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa hoặc không hoạt động.' });
                }

                // Kiểm tra password null
                if (!user.password) {
                    return res.status(400).json({ success: false, error: 'Tài khoản chưa có mật khẩu. Liên hệ admin.' });
                }

                // Thử bcrypt trước, nếu lỗi thì thử plain text
                let isMatch = false;
                try {
                    isMatch = await bcrypt.compare(password, user.password);
                } catch (e) {
                    // Fallback: so sánh plain text (trường hợp password chưa hash)
                    isMatch = (password === user.password);
                }

                if (!isMatch) {
                    return res.status(400).json({ success: false, error: 'Mật khẩu không đúng.' });
                }

                return res.json({
                    success: true,
                    user: { id: user.customer_id, name: user.full_name, email: user.email, phone: user.phone, linkedBank: false, role: 'user' }
                });
            });
        });
    });
});

// ============================================================
// API RESTAURANT: LẤY MENU CỦA NHÀ HÀNG
// GET /api/restaurant/:restaurantId/menu
// ============================================================
app.get('/api/restaurant/:restaurantId/menu', (req, res) => {
    const { restaurantId } = req.params;
    const query = `
        SELECT f.food_id AS id, f.food_name AS name, f.price,
               f.description, f.image, f.is_available,
               fc.category_name AS category
        FROM foods f
        LEFT JOIN food_categories fc ON fc.category_id = f.category_id
        WHERE f.restaurant_id = ?
        ORDER BY fc.category_name ASC, f.food_name ASC
    `;
    db.query(query, [restaurantId], (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy menu:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, total: rows.length, data: rows });
    });
});

// ============================================================
// API RESTAURANT: THÊM MÓN ĂN
// POST /api/restaurant/:restaurantId/menu
// ============================================================
app.post('/api/restaurant/:restaurantId/menu', (req, res) => {
    const { restaurantId } = req.params;
    const { food_name, price, description, category_id, image } = req.body || {};

    if (!food_name || !price) {
        return res.status(400).json({ success: false, error: 'Tên món và giá là bắt buộc.' });
    }

    const query = `
        INSERT INTO foods (restaurant_id, category_id, food_name, price, description, image, is_available)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    db.query(query, [restaurantId, category_id || null, food_name, price, description || null, image || null], (err, result) => {
        if (err) {
            console.error('❌ Lỗi thêm món:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🍽️ Món mới: ${food_name} (${price}đ) → Nhà hàng #${restaurantId}`);
        res.status(201).json({ success: true, foodId: result.insertId, message: 'Đã thêm món mới!' });
    });
});

// ============================================================
// API RESTAURANT: CẬP NHẬT MÓN ĂN
// PUT /api/restaurant/menu/:foodId
// ============================================================
app.put('/api/restaurant/menu/:foodId', (req, res) => {
    const { foodId } = req.params;
    const { food_name, price, description, status, image } = req.body || {};

    const fields = [];
    const values = [];

    if (food_name) { fields.push('food_name = ?'); values.push(food_name); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('is_available = ?'); values.push(status === 'available' ? 1 : 0); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }

    if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Không có dữ liệu cập nhật.' });
    }

    values.push(foodId);
    const query = `UPDATE foods SET ${fields.join(', ')} WHERE food_id = ?`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Lỗi cập nhật món:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy món ăn.' });
        }
        res.json({ success: true, message: 'Đã cập nhật món ăn!' });
    });
});

// ============================================================
// API RESTAURANT: XÓA MÓN ĂN
// DELETE /api/restaurant/menu/:foodId
// ============================================================
app.delete('/api/restaurant/menu/:foodId', (req, res) => {
    const { foodId } = req.params;
    db.query('DELETE FROM foods WHERE food_id = ?', [foodId], (err, result) => {
        if (err) {
            console.error('❌ Lỗi xóa món:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy món ăn.' });
        }
        console.log(`🗑️ Đã xóa món #${foodId}`);
        res.json({ success: true, message: 'Đã xóa món ăn!' });
    });
});

// ============================================================
// API RESTAURANT: THỐNG KÊ NHÀ HÀNG
// GET /api/restaurant/:restaurantId/stats
// ============================================================
app.get('/api/restaurant/:restaurantId/stats', (req, res) => {
    const { restaurantId } = req.params;

    const statsQuery = `
        SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) AS revenue,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_orders,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders
        FROM restaurant_orders
        WHERE restaurant_id = ?
    `;

    const menuCountQuery = `SELECT COUNT(*) AS total_items FROM foods WHERE restaurant_id = ?`;

    db.query(statsQuery, [restaurantId], (err, statsRows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        const stats = statsRows[0] || {};

        db.query(menuCountQuery, [restaurantId], (err2, menuRows) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });

            res.json({
                success: true,
                stats: {
                    revenue: Number(stats.revenue) || 0,
                    totalOrders: Number(stats.total_orders) || 0,
                    pendingOrders: Number(stats.pending_orders) || 0,
                    completedOrders: Number(stats.completed_orders) || 0,
                    totalMenuItems: Number(menuRows[0]?.total_items) || 0,
                },
            });
        });
    });
});

// ============================================================
// API 1: ĐẶT ĐƠN HÀNG (RESTAURANT ORDER)
// POST /api/food-order
// Body: { customer_id, restaurant_id, items: [{food_name, quantity, price, note}], total_price }
// ============================================================
app.post('/api/food-order', (req, res) => {
    const { customer_id, restaurant_id, items, total_price } = req.body || {};

    if (!customer_id || !restaurant_id || !items || !Array.isArray(items) || items.length === 0 || !total_price) {
        return res.status(400).json({
            success: false,
            error: 'Thiếu thông tin! Vui lòng điền đầy đủ: customer_id, restaurant_id, items, total_price.'
        });
    }

    // Tạo order_id unique (6 chữ số để vừa với kiểu INT trong database)
    const order_id = Math.floor(100000 + Math.random() * 900000);

    const orderQuery = `
        INSERT INTO restaurant_orders (order_id, customer_id, restaurant_id, total_price, status)
        VALUES (?, ?, ?, ?, 'pending')
    `;

    db.query(orderQuery, [order_id, customer_id, restaurant_id, total_price], (err, result) => {
        if (err) {
            console.error('❌ Lỗi INSERT restaurant_orders:', err.message);
            return res.status(500).json({ success: false, error: 'Lỗi server: ' + err.message });
        }

        const dbOrderId = result.insertId;

        // Insert chi tiết từng món
        const detailValues = items.map(item => [
            dbOrderId, item.food_id || null, item.food_name, item.quantity, item.price, item.note || null
        ]);

        const detailQuery = `
            INSERT INTO restaurant_order_details (order_id, food_id, food_name, quantity, price, note)
            VALUES ?
        `;

        db.query(detailQuery, [detailValues], (err2) => {
            if (err2) {
                console.error('❌ Lỗi INSERT order_details:', err2.message);
                return res.status(500).json({ success: false, error: 'Lỗi lưu chi tiết đơn: ' + err2.message });
            }

            console.log(`✅ Đơn hàng mới: ID=${dbOrderId} | Customer=${customer_id} | Restaurant=${restaurant_id} | ${items.length} món`);

            res.status(201).json({
                success: true,
                message: '🍔 Đơn hàng đã được gửi đến quán ăn!',
                orderId: dbOrderId,
                total_price,
                status: 'pending'
            });
        });
    });
});

// ============================================================
// API 2: LẤY LỊCH SỬ ĐƠN HÀNG CỦA CUSTOMER
// GET /api/orders/history/:customer_id
// ============================================================
app.get('/api/orders/history/:customer_id', (req, res) => {
    const { customer_id } = req.params;

    if (!customer_id || isNaN(customer_id)) {
        return res.status(400).json({ success: false, error: 'customer_id không hợp lệ!' });
    }

    const query = `
        SELECT ro.id, ro.order_id, ro.total_price, ro.status, ro.created_at,
               r.restaurant_name
        FROM restaurant_orders ro
        LEFT JOIN restaurants r ON r.restaurant_id = ro.restaurant_id
        WHERE ro.customer_id = ?
        ORDER BY ro.created_at DESC
        LIMIT 20
    `;

    db.query(query, [customer_id], (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy lịch sử đơn hàng:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({
            success: true,
            total: rows.length,
            data: rows
        });
    });
});

// ============================================================
// API 3: HỦY ĐƠN HÀNG
// PATCH /api/orders/:orderId/cancel
// ============================================================
app.patch('/api/orders/:orderId/cancel', (req, res) => {
    const { orderId } = req.params;

    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ success: false, error: 'orderId không hợp lệ!' });
    }

    const query = `UPDATE restaurant_orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'`;

    db.query(query, [orderId], (err, result) => {
        if (err) {
            console.error('❌ Lỗi huỷ đơn:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hoặc đơn đã không ở trạng thái pending!' });
        }

        console.log(`🚫 Đơn hàng ID=${orderId} đã bị huỷ.`);
        res.json({ success: true, message: `Đã huỷ đơn #${orderId} thành công.` });
    });
});

// ============================================================
// API 3.5: RESTAURANT LẤY DANH SÁCH ĐƠN HÀNG
// GET /api/restaurant/:restaurantId/orders
// ============================================================
app.get('/api/restaurant/:restaurantId/orders', (req, res) => {
    const { restaurantId } = req.params;
    
    // Sort by created_at DESC, but pending/accepted/preparing should be on top
    const query = `
        SELECT ro.*, c.full_name as customer_name, c.phone as customer_phone
        FROM restaurant_orders ro
        LEFT JOIN customers c ON c.customer_id = ro.customer_id
        WHERE ro.restaurant_id = ?
        ORDER BY 
            CASE ro.status
                WHEN 'pending' THEN 1
                WHEN 'accepted' THEN 2
                WHEN 'preparing' THEN 3
                WHEN 'ready' THEN 4
                ELSE 5
            END,
            ro.created_at DESC
    `;

    db.query(query, [restaurantId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows });
    });
});

// ============================================================
// API 3.6: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// PATCH /api/orders/:orderId/status
// ============================================================
app.patch('/api/orders/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
    }

    const query = `UPDATE restaurant_orders SET status = ? WHERE id = ?`;
    
    db.query(query, [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
        }
        console.log(`✅ Cập nhật trạng thái đơn #${orderId} thành ${status}`);
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    });
});

// ============================================================
// API 4.5: LẤY THÔNG TIN 1 ĐƠN HÀNG
// GET /api/orders/info/:id
// ============================================================
app.get('/api/orders/info/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT ro.*, r.restaurant_name, r.address AS restaurant_address, r.phone AS restaurant_phone
        FROM restaurant_orders ro
        LEFT JOIN restaurants r ON r.restaurant_id = ro.restaurant_id
        WHERE ro.id = ?
    `;
    db.query(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
        res.json({ success: true, data: rows[0] });
    });
});

// ============================================================
// API 4: CHI TIẾT ĐƠN HÀNG
// GET /api/orders/:orderId/details
// ============================================================
app.get('/api/orders/:orderId/details', (req, res) => {
    const { orderId } = req.params;

    const query = `
        SELECT rod.detail_id, rod.food_name, rod.quantity, rod.price, rod.note
        FROM restaurant_order_details rod
        WHERE rod.order_id = ?
    `;

    db.query(query, [orderId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// ============================================================
// API 5: LẤY DANH MỤC (CATEGORIES)
// GET /api/explore/categories
// ============================================================
// Map icon tự động theo từ khóa trong tên danh mục
function mapCategoryIcon(name = '') {
    const n = name.toLowerCase();
    if (n.includes('bánh mì') || n.includes('banh mi')) return '🥖';
    if (n.includes('cháo') || n.includes('chao')) return '🍚';
    if (n.includes('mỳ') || n.includes('mì') || n.includes('bún') || n.includes('phở')) return '🍜';
    if (n.includes('lẩu')) return '🫕';
    if (n.includes('pizza')) return '🍕';
    if (n.includes('gà') || n.includes('ga')) return '🍗';
    if (n.includes('trà sữa') || n.includes('tra sua')) return '🧋';
    if (n.includes('cơm') || n.includes('com')) return '🍱';
    if (n.includes('burger') || n.includes('đồ ăn nhanh')) return '🍔';
    if (n.includes('hải sản') || n.includes('hai san')) return '🦐';
    if (n.includes('tráng miệng') || n.includes('kem')) return '🍦';
    if (n.includes('cà phê') || n.includes('ca phe')) return '☕';
    return '🍽️';
}

app.get('/api/explore/categories', (req, res) => {
    const query = `
        SELECT DISTINCT category_id AS id, category_name AS label
        FROM food_categories
        ORDER BY category_id ASC
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy categories:', err.message);
            return res.status(500).json({ success: false, error: 'Lỗi server: ' + err.message });
        }
        const data = rows.map(row => ({
            id: row.id,
            label: row.label,
            icon: mapCategoryIcon(row.label),
        }));
        res.json({ success: true, data });
    });
});

// ============================================================
// API 6: LẤY NHÀ HÀNG NỔI BẬT (FEATURED RESTAURANTS)
// GET /api/explore/featured
// ============================================================
const FEATURED_STYLES = [
    { bg: '#FFECB3', color: '#E65100' },
    { bg: '#E8EAF6', color: '#3949AB' },
    { bg: '#E0F2F1', color: '#00695C' },
    { bg: '#FCE4EC', color: '#C62828' },
    { bg: '#E8F5E9', color: '#2E7D32' },
    { bg: '#FFF3E0', color: '#E65100' },
];

app.get('/api/explore/featured', (req, res) => {
    const query = `
        SELECT restaurant_id AS id, restaurant_name AS label, logo AS image
        FROM restaurants
        ORDER BY restaurant_id ASC
        LIMIT 6
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy featured restaurants:', err.message);
            return res.status(500).json({ success: false, error: 'Lỗi server: ' + err.message });
        }
        const data = rows.map((row, i) => ({
            id: row.id,
            label: row.label,
            image: row.image || null,
            emoji: '🍽️',
            ...FEATURED_STYLES[i % FEATURED_STYLES.length],
        }));
        res.json({ success: true, data });
    });
});

// ============================================================
// API: LẤY MÓN ĂN THEO DANH MỤC
// GET /api/explore/foods?category_id=X
// ============================================================
app.get('/api/explore/foods', (req, res) => {
    const { category_id } = req.query;

    let query = `
        SELECT f.food_id AS id, f.food_name AS name, f.price,
               f.description, f.image, f.is_available,
               fc.category_name AS category,
               r.restaurant_name, r.restaurant_id
        FROM foods f
        LEFT JOIN food_categories fc ON fc.category_id = f.category_id
        LEFT JOIN restaurants r ON r.restaurant_id = f.restaurant_id
        WHERE f.is_available = 1
    `;
    const params = [];

    if (category_id && category_id !== '0') {
        query += ' AND f.category_id = ?';
        params.push(category_id);
    }

    query += ' ORDER BY f.food_name ASC';

    db.query(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy foods:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, total: rows.length, data: rows });
    });
});

// ============================================================
// API 7: LẤY DANH SÁCH NHÀ HÀNG
// GET /api/restaurants
// ============================================================
app.get('/api/restaurants', (req, res) => {
    const query = `
        SELECT
            r.restaurant_id AS id,
            r.restaurant_name AS name,
            r.address,
            r.phone,
            r.logo AS image,
            r.status,
            GROUP_CONCAT(fc.category_name SEPARATOR ', ') AS category
        FROM restaurants r
        LEFT JOIN food_categories fc ON fc.restaurant_id = r.restaurant_id
        GROUP BY r.restaurant_id
        ORDER BY r.restaurant_id ASC
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error('❌ Lỗi lấy restaurants:', err.message);
            return res.status(500).json({ success: false, error: 'Lỗi server: ' + err.message });
        }
        const data = rows.map(r => ({
            id: r.id,
            name: r.name,
            address: r.address || '',
            phone: r.phone || '',
            image: r.image || null,
            category: r.category || 'Đồ ăn',
            rating: (4.0 + Math.random() * 0.9).toFixed(1),   // rating mẫu (sau này lấy từ reviews)
            time: `${20 + Math.floor(Math.random() * 20)} phút`,
            promo: null,
        }));
        res.json({ success: true, total: data.length, data });
    });
});


// ============================================================
// API 8: HỖ TRỢ CHAT – LƯU TIN NHẮN
// POST /api/support/message
// GET  /api/support/messages
// ============================================================

// Tạo bảng nếu chưa có
db.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        sender ENUM('user','admin') NOT NULL DEFAULT 'user',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error('⚠️ Không tạo được bảng support_messages:', err.message);
});

// User gửi tin nhắn
app.post('/api/support/message', (req, res) => {
    const { message, sender, user_id } = req.body || {};
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Tin nhắn trống' });
    }
    db.query(
        'INSERT INTO support_messages (user_id, sender, message) VALUES (?, ?, ?)',
        [user_id || null, sender || 'user', message.trim()],
        (err, result) => {
            if (err) {
                console.error('❌ Lỗi lưu tin nhắn hỗ trợ:', err.message);
                return res.status(500).json({ success: false, error: err.message });
            }
            console.log(`💬 Tin nhắn hỗ trợ mới (#${result.insertId}): ${message.trim().substring(0, 50)}...`);
            res.json({ success: true, messageId: result.insertId });
        }
    );
});

// Admin đọc tin nhắn
app.get('/api/support/messages', (req, res) => {
    db.query('SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 50', (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, total: rows.length, data: rows });
    });
});

// ============================================================
// API 9: ADMIN DASHBOARD – THỐNG KÊ DOANH THU
// GET /api/admin/dashboard
// ============================================================
app.get('/api/admin/dashboard', (req, res) => {
    // Tổng doanh thu & số đơn
    const summaryQuery = `
        SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN total_price ELSE 0 END), 0) AS pending_revenue,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_orders,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
            COUNT(DISTINCT customer_id) AS total_customers
        FROM restaurant_orders
    `;

    // Doanh thu 7 ngày gần nhất
    const dailyQuery = `
        SELECT
            DATE(created_at) AS date,
            COALESCE(SUM(total_price), 0) AS revenue,
            COUNT(*) AS orders
        FROM restaurant_orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `;

    // Đơn hàng gần đây
    const recentQuery = `
        SELECT ro.id, ro.total_price, ro.status, ro.created_at,
               c.full_name AS customer_name,
               r.restaurant_name
        FROM restaurant_orders ro
        LEFT JOIN customers c ON c.customer_id = ro.customer_id
        LEFT JOIN restaurants r ON r.restaurant_id = ro.restaurant_id
        ORDER BY ro.created_at DESC
        LIMIT 10
    `;

    // Nhà hàng có doanh thu cao nhất
    const topRestQuery = `
        SELECT r.restaurant_name AS name,
               COALESCE(SUM(ro.total_price), 0) AS revenue,
               COUNT(ro.id) AS orders
        FROM restaurant_orders ro
        LEFT JOIN restaurants r ON r.restaurant_id = ro.restaurant_id
        WHERE ro.status != 'cancelled'
        GROUP BY ro.restaurant_id
        ORDER BY revenue DESC
        LIMIT 5
    `;

    db.query(summaryQuery, (err, summaryRows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        const summary = summaryRows[0] || {};

        db.query(dailyQuery, (err2, dailyRows) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });

            db.query(recentQuery, (err3, recentRows) => {
                if (err3) return res.status(500).json({ success: false, error: err3.message });

                db.query(topRestQuery, (err4, topRows) => {
                    if (err4) return res.status(500).json({ success: false, error: err4.message });

                    res.json({
                        success: true,
                        summary: {
                            totalRevenue: Number(summary.total_revenue) || 0,
                            pendingRevenue: Number(summary.pending_revenue) || 0,
                            totalOrders: Number(summary.total_orders) || 0,
                            pendingOrders: Number(summary.pending_orders) || 0,
                            completedOrders: Number(summary.completed_orders) || 0,
                            cancelledOrders: Number(summary.cancelled_orders) || 0,
                            totalCustomers: Number(summary.total_customers) || 0,
                        },
                        dailyRevenue: dailyRows.map(r => ({
                            date: r.date,
                            revenue: Number(r.revenue),
                            orders: Number(r.orders),
                        })),
                        recentOrders: recentRows,
                        topRestaurants: topRows.map(r => ({
                            name: r.name,
                            revenue: Number(r.revenue),
                            orders: Number(r.orders),
                        })),
                    });
                });
            });
        });
    });
});

// ============================================================
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Lắng nghe tất cả network interface (bao gồm WiFi) để mobile kết nối được
app.listen(PORT, HOST, () => {
    console.log(`\n🚀 ====================================`);
    console.log(`   Server đang chạy tại: http://${HOST}:${PORT}`);
    console.log(`   Truy cập từ mobile: http://10.168.27.74:${PORT}/api/ping`);
    console.log(`🚀 ====================================\n`);
});