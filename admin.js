document.addEventListener("DOMContentLoaded", function () {
    const API_URL = 'http://localhost:3000/api';
    const productModal = document.getElementById('productModal');
    const orderModal = document.getElementById('orderModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Загрузка товаров
    async function renderProductsTable() {
        try {
            const products = await fetch(`${API_URL}/products`).then(res => res.json());
            const tableBody = document.getElementById('productsTable');
            tableBody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id_products}</td>
                    <td>${product.title}</td>
                    <td>${product.price}</td>
                    <td>${product.type}</td>
                    <td>${product.stock}</td>
                    <td>
                        <button class="edit-btn" data-id="${product.id_products}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-id="${product.id_products}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Обработчики для кнопок
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    const productId = this.getAttribute('data-id');
                    const product = await fetch(`${API_URL}/products/${productId}`).then(res => res.json());
                    
                    if (product) {
                        document.getElementById('modalTitle').textContent = 'Редактировать товар';
                        document.getElementById('productId').value = product.id_products;
                        document.getElementById('productTitle').value = product.title;
                        document.getElementById('productPrice').value = product.price;
                        document.getElementById('productType').value = product.type;
                        document.getElementById('productOccasion').value = product.occasion || '';
                        document.getElementById('productStock').value = product.stock;
                        document.getElementById('productDescription').value = product.description;
                        document.getElementById('productComposition').value = product.composition || '';
                        document.getElementById('productCare').value = product.care || '';
                        document.getElementById('productImage').value = product.img;
                        
                        productModal.style.display = 'block';
                    }
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
                        const productId = this.getAttribute('data-id');
                        try {
                            await fetch(`${API_URL}/products/${productId}`, {
                                method: 'DELETE'
                            });
                            renderProductsTable();
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            alert('Ошибка при удалении товара');
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error rendering products table:', error);
            alert('Ошибка при загрузке товаров');
        }
    }
    
    // Форма товара
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const productData = {
            title: document.getElementById('productTitle').value,
            price: parseFloat(document.getElementById('productPrice').value),
            type: document.getElementById('productType').value,
            occasion: document.getElementById('productOccasion').value,
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value,
            composition: document.getElementById('productComposition').value,
            care: document.getElementById('productCare').value,
            img: document.getElementById('productImage').value
        };
        
        try {
            let response;
            if (productId) {
                // Обновление существующего товара
                response = await fetch(`${API_URL}/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка при обновлении товара');
                }
            } else {
                // Добавление нового товара
                response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка при добавлении товара');
                }
            }
            
            await renderProductsTable();
            productModal.style.display = 'none';
            alert(productId ? 'Товар успешно обновлен' : 'Товар успешно добавлен');
        } catch (error) {
            console.error('Error saving product:', error);
            alert(error.message || 'Ошибка при сохранении товара');
        }
    });
    
    // Кнопка добавления нового товара
    document.getElementById('addProductBtn').addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Добавить товар';
        document.getElementById('productId').value = '';
        document.getElementById('productForm').reset();
        productModal.style.display = 'block';
    });
    
    // Кнопка отмены в форме товара
    document.getElementById('cancelBtn').addEventListener('click', function() {
        productModal.style.display = 'none';
    });
    
    // Закрытие модальных окон
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            productModal.style.display = 'none';
            orderModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
        if (event.target === orderModal) {
            orderModal.style.display = 'none';
        }
    });
    
    // Инициализация таблицы товаров
    renderProductsTable();

    // === Функции для статистики ===
    async function fetchOrders() {
        const res = await fetch('http://localhost:3000/api/orders');
        return await res.json();
    }
    async function fetchProducts() {
        const res = await fetch('http://localhost:3000/api/products');
        return await res.json();
    }

    function updateMonthlySales() {
        const year = parseInt(document.getElementById('yearFilter').value);
        fetchOrders().then(orders => {
            const salesByMonth = Array(12).fill(0);
            let hasData = false;
            orders.forEach(order => {
                const date = new Date(order.date_order);
                if (date.getFullYear() === year && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const month = date.getMonth();
                        const price = Number(item.price) || 0;
                        const quantity = Number(item.quantity) || 0;
                        const itemTotal = price * quantity;
                        if (itemTotal > 0) {
                            salesByMonth[month] += itemTotal;
                            hasData = true;
                        }
                    });
                }
            });
            monthlySalesChart.data.datasets[0].data = salesByMonth;
            monthlySalesChart.update();
            const total = salesByMonth.reduce((a, b) => a + b, 0);
            document.getElementById('totalSales').textContent = (hasData ? total : 0).toLocaleString() + ' ₽';
            const ordersWithItems = orders.filter(o => new Date(o.date_order).getFullYear() === year && Array.isArray(o.items) && o.items.length > 0);
            document.getElementById('avgOrderValue').textContent =
                (hasData && ordersWithItems.length ? Math.round(total / ordersWithItems.length) : 0).toLocaleString() + ' ₽';
        });
    }

    function updateTopProducts() {
        const period = document.getElementById('periodFilter').value;
        fetchOrders().then(orders => {
            fetchProducts().then(products => {
                const now = new Date();
                let fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                if (period === 'quarter') fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                if (period === 'year') fromDate = new Date(now.getFullYear(), 0, 1);
                const productSales = {};
                let hasData = false;
                orders.forEach(order => {
                    const date = new Date(order.date_order);
                    if (date >= fromDate && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const qty = parseInt(item.quantity) || 0;
                            if (qty > 0) {
                                productSales[item.id_products] = (productSales[item.id_products] || 0) + qty;
                                hasData = true;
                            }
                        });
                    }
                });
                // Формируем данные для графика
                const labels = [];
                const values = [];
                products.forEach(product => {
                    if (productSales[product.id_products]) {
                        labels.push(product.title);
                        values.push(productSales[product.id_products]);
                    }
                });
                // Если нет данных — показываем пустой график
                if (!hasData) {
                    topProductsChart.data.labels = [];
                    topProductsChart.data.datasets[0].data = [];
                } else {
                    // Сортируем по убыванию
                    const sortedData = labels.map((label, index) => ({
                        label: label,
                        value: values[index]
                    })).sort((a, b) => b.value - a.value);
                    const top5 = sortedData.slice(0, 5);
                    topProductsChart.data.labels = top5.map(item => item.label);
                    topProductsChart.data.datasets[0].data = top5.map(item => item.value);
                }
                topProductsChart.update();
                // Сводка
                const totalProducts = values.reduce((a, b) => a + b, 0);
                document.getElementById('totalProducts').textContent = hasData ? totalProducts : 0;
                document.getElementById('totalOrders').textContent = hasData ? orders.length : 0;
            });
        });
    }

    // Для функции отображения заказов в админке:
    async function displayOrders() {
        const orders = await fetchOrders();
        const ordersTable = document.getElementById('ordersTable');
        ordersTable.innerHTML = '';
        if (orders.length === 0) {
            ordersTable.innerHTML = '<tr><td colspan="5">Заказов нет</td></tr>';
            return;
        }
        orders.forEach(order => {
            const tr = document.createElement('tr');
            let statusHtml = '';
            switch (order.status_order) {
                case 'pending':
                    statusHtml = '<span class="order-status status-pending"><i class="fas fa-clock"></i> В ожидании</span>'; break;
                case 'processing':
                    statusHtml = '<span class="order-status status-processing"><i class="fas fa-cog"></i> В обработке</span>'; break;
                case 'completed':
                    statusHtml = '<span class="order-status status-completed"><i class="fas fa-check"></i> Выполнен</span>'; break;
                case 'cancelled':
                    statusHtml = '<span class="order-status status-cancelled"><i class="fas fa-ban"></i> Отменён</span>'; break;
                default:
                    statusHtml = order.status_order;
            }
            tr.innerHTML = `
                <td>${order.id_order}</td>
                <td>${new Date(order.date_order).toLocaleString('ru-RU')}</td>
                <td>${order.total_sum} ₽</td>
                <td>${statusHtml}</td>
                <td>
                    <button class="action-btn complete-btn" title="Выполнить"><i class="fas fa-check"></i></button>
                    <button class="action-btn cancel-btn" title="Отменить"><i class="fas fa-ban"></i></button>
                    <button class="action-btn delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tr.querySelector('.complete-btn').onclick = async () => {
                await updateOrderStatus(order.id_order, 'completed');
                displayOrders();
            };
            tr.querySelector('.cancel-btn').onclick = async () => {
                await updateOrderStatus(order.id_order, 'cancelled');
                displayOrders();
            };
            tr.querySelector('.delete-btn').onclick = async () => {
                if (confirm('Удалить заказ?')) {
                    await deleteOrder(order.id_order);
                    displayOrders();
                }
            };
            ordersTable.appendChild(tr);
        });
    }

    // Вызов отображения заказов при загрузке страницы
    displayOrders();

    async function updateOrderStatus(id_order, newStatus) {
        await fetch(`${API_URL}/orders/${id_order}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_order: newStatus })
        });
    }

    async function deleteOrder(id_order) {
        await fetch(`${API_URL}/orders/${id_order}`, { method: 'DELETE' });
    }

    async function fetchReviews() {
        try {
            const response = await fetch('http://localhost:3000/api/reviews');
            return await response.json();
        } catch (e) {
            return [];
        }
    }

    async function displayReviews() {
        const reviews = await fetchReviews();
        const reviewsTable = document.getElementById('reviewsTable');
        reviewsTable.innerHTML = '';
        if (reviews.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" class="no-data">Отзывов пока нет</td>`;
            reviewsTable.appendChild(tr);
            return;
        }
        reviews.forEach(review => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${review.id}</td>
                <td>${review.product_id}</td>
                <td>${review.author}</td>
                <td class="review-text-cell">${review.text}</td>
                <td><div class="rating-display">${getStarRating(review.rating)}</div></td>
                <td>${new Date(review.date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="review-actions">
                        <button class="action-btn delete-btn" onclick="deleteReview(${review.id})" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            reviewsTable.appendChild(tr);
        });
    }

    // Вызов displayReviews() при загрузке страницы
    displayReviews();

    function getStarRating(rating) {
        rating = Number(rating) || 0;
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    // === Chart.js графики ===
    const monthlySalesCtx = document.getElementById('monthlySalesChart').getContext('2d');
    window.monthlySalesChart = new Chart(monthlySalesCtx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            datasets: [{
                label: 'Продажи',
                data: [],
                borderColor: '#8B4513',
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toLocaleString() + ' ₽';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' ₽';
                        }
                    }
                }
            }
        }
    });

    const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
    window.topProductsChart = new Chart(topProductsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Количество продаж',
                data: [],
                backgroundColor: '#8B4513',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    // Обработчики фильтров
    const yearFilter = document.getElementById('yearFilter');
    const periodFilter = document.getElementById('periodFilter');
    if (yearFilter) yearFilter.addEventListener('change', updateMonthlySales);
    if (periodFilter) periodFilter.addEventListener('change', updateTopProducts);

    // При первой загрузке страницы сразу обновляем графики
    updateMonthlySales();
    updateTopProducts();

    // Обновляем графики при активации вкладки 'Статистика'
    const statsTabBtn = document.querySelector('[data-tab="stats"]');
    if (statsTabBtn) {
        statsTabBtn.addEventListener('click', () => {
            updateMonthlySales();
            updateTopProducts();
        });
    }
});