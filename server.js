require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using HTTPS
}));

console.log('Настройка сервера...');

// Database configuration
const config = {
    driver: 'msnodesqlv8',
    connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;TrustServerCertificate=yes;`,
};

console.log('Подключение к базе данных...');
console.log('Строка подключения:', config.connectionString);

// Database connection pool
const pool = new sql.ConnectionPool(config);

pool.on('error', err => {
    console.error('Ошибка подключения к базе данных:', err);
});

// Проверка подключения к базе данных
async function testDatabaseConnection() {
    try {
        await pool.connect();
        console.log('Успешное подключение к базе данных');
        return true;
    } catch (err) {
        console.error('Ошибка при подключении к базе данных:', err);
        return false;
    }
}

// Middleware для проверки аутентификации
const checkAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Необходима авторизация' });
    }
};

// Проверка статуса аутентификации
app.get('/api/auth/check', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// API Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        await pool.connect();
        const result = await pool.request()
            .query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        await pool.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Products WHERE id_products = @id');
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new product
app.post('/api/products', checkAuth, async (req, res) => {
    try {
        await pool.connect();
        const result = await pool.request()
            .input('title', sql.NVarChar, req.body.title)
            .input('price', sql.Decimal(10,2), req.body.price)
            .input('img', sql.NVarChar, req.body.img)
            .input('type', sql.NVarChar, req.body.type)
            .input('occasion', sql.NVarChar, req.body.occasion || '')
            .input('stock', sql.Int, req.body.stock)
            .input('description', sql.NVarChar, req.body.description)
            .input('composition', sql.NVarChar, req.body.composition || '')
            .input('care', sql.NVarChar, req.body.care || '')
            .query(`
                INSERT INTO Products (title, price, img, type, occasion, stock, description, composition, care)
                VALUES (@title, @price, @img, @type, @occasion, @stock, @description, @composition, @care);
                SELECT SCOPE_IDENTITY() AS id_products;
            `);
        
        res.status(201).json({ id: result.recordset[0].id_products });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product
app.put('/api/products/:id', checkAuth, async (req, res) => {
    try {
        console.log('Обновление товара:', req.params.id);
        console.log('Данные для обновления:', req.body);
        
        await pool.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.NVarChar, req.body.title)
            .input('price', sql.Decimal(10,2), req.body.price)
            .input('img', sql.NVarChar, req.body.img)
            .input('type', sql.NVarChar, req.body.type)
            .input('occasion', sql.NVarChar, req.body.occasion || '')
            .input('stock', sql.Int, req.body.stock)
            .input('description', sql.NVarChar, req.body.description)
            .input('composition', sql.NVarChar, req.body.composition || '')
            .input('care', sql.NVarChar, req.body.care || '')
            .query(`
                UPDATE Products 
                SET title = @title,
                    price = @price,
                    img = @img,
                    type = @type,
                    occasion = @occasion,
                    stock = @stock,
                    description = @description,
                    composition = @composition,
                    care = @care
                WHERE id_products = @id;
                
                SELECT @@ROWCOUNT as rowsAffected;
            `);
        
        const rowsAffected = result.recordset[0].rowsAffected;
        console.log('Количество обновленных строк:', rowsAffected);
        
        if (rowsAffected > 0) {
            res.json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ error: 'Product not found or no changes made' });
        }
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product
app.delete('/api/products/:id', checkAuth, async (req, res) => {
    try {
        await pool.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Products WHERE id_products = @id');
        
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить все отзывы
app.get('/api/reviews', async (req, res) => {
    try {
        await pool.connect();
        const result = await pool.request()
            .query('SELECT * FROM Reviews ORDER BY [date] DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить отзыв
app.post('/api/reviews', async (req, res) => {
    try {
        const { product_id, author, rating, text, user_id } = req.body;
        const ratingNum = Math.max(1, Math.min(5, Number(rating) || 1));
        await pool.connect();
        const result = await pool.request()
            .input('product_id', sql.Int, product_id)
            .input('author', sql.NVarChar, author)
            .input('rating', sql.Int, ratingNum)
            .input('text', sql.NVarChar, text)
            .input('user_id', sql.Int, user_id)
            .query(`
                INSERT INTO Reviews (product_id, author, rating, [text], user_id)
                VALUES (@product_id, @author, @rating, @text, @user_id);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        res.status(201).json({ id: result.recordset[0].id });
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удалить отзыв
app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await pool.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Reviews WHERE id = @id');
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE username = @username AND password = @password');
        if (result.recordset.length > 0) {
            req.session.isAuthenticated = true;
            req.session.user = {
                id_user: result.recordset[0].id_user,
                username: result.recordset[0].username,
                role: result.recordset[0].role
            };
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Выход
app.post('/api/auth/logout', (req, res) => {
    console.log('Выход пользователя:', req.session.user?.username);
    req.session.destroy();
    res.json({ success: true });
});

// Получить все заказы с позициями
app.get('/api/orders', async (req, res) => {
    try {
        await pool.connect();
        const ordersResult = await pool.request().query('SELECT * FROM Orders');
        const orders = ordersResult.recordset;
        const itemsResult = await pool.request().query('SELECT * FROM OrderItems');
        const items = itemsResult.recordset;
        orders.forEach(order => {
            order.items = items.filter(i => i.id_order === order.id_order).map(item => ({
                id_products: item.id_products,
                quantity: item.quantity,
                price: item.price
            }));
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить заказ по id_order
app.get('/api/orders/:id', async (req, res) => {
    try {
        await pool.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Orders WHERE id_order = @id');
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить заказ
app.post('/api/orders', async (req, res) => {
    try {
        const { total_sum, status_order, client_id, items } = req.body;
        await pool.connect();
        // Сохраняем заказ
        const result = await pool.request()
            .input('total_sum', sql.Decimal(10,2), total_sum)
            .input('status_order', sql.NVarChar, status_order)
            .input('client_id', sql.Int, client_id)
            .query(`INSERT INTO Orders (total_sum, status_order, client_id) VALUES (@total_sum, @status_order, @client_id); SELECT SCOPE_IDENTITY() AS id_order;`);
        const id_order = result.recordset[0].id_order;
        // Сохраняем позиции заказа
        if (Array.isArray(items)) {
            for (const item of items) {
                await pool.request()
                    .input('id_order', sql.Int, id_order)
                    .input('id_products', sql.Int, item.id_products)
                    .input('quantity', sql.Int, item.quantity)
                    .input('price', sql.Decimal(10,2), item.price || 0)
                    .query(`INSERT INTO OrderItems (id_order, id_products, quantity, price) VALUES (@id_order, @id_products, @quantity, @price);`);
            }
        }
        res.status(201).json({ id_order });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Смена статуса заказа
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status_order } = req.body;
        await pool.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('status_order', sql.NVarChar, status_order)
            .query('UPDATE Orders SET status_order = @status_order WHERE id_order = @id');
        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление заказа
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await pool.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Orders WHERE id_order = @id');
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавить клиента
app.post('/api/klients', async (req, res) => {
    try {
        const { FIO, phone, email, address } = req.body;
        await pool.connect();
        // Проверяем, есть ли уже клиент с таким email
        const check = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id_klient FROM Klients WHERE email = @email');
        if (check.recordset.length > 0) {
            // Уже есть такой клиент
            return res.json({ id_klient: check.recordset[0].id_klient });
        }
        // Добавляем нового клиента
        const result = await pool.request()
            .input('FIO', sql.NVarChar, FIO)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('address', sql.NVarChar, address)
            .query(`
                INSERT INTO Klients (FIO, phone, email, address, date_registration)
                VALUES (@FIO, @phone, @email, @address, GETDATE());
                SELECT SCOPE_IDENTITY() AS id_klient;
            `);
        res.status(201).json({ id_klient: result.recordset[0].id_klient });
    } catch (err) {
        console.error('Error adding klient:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3001;

// Запуск сервера только после проверки подключения к базе данных
testDatabaseConnection().then(connected => {
    if (connected) {
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
            console.log(`Админ-панель доступна по адресу: http://localhost:${PORT}/admin.html`);
        });
    } else {
        console.error('Сервер не запущен из-за ошибки подключения к базе данных');
    }
}); 