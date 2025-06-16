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

    // Для функции отображения заказов в админке:
    async function fetchOrders() {
        try {
            const response = await fetch('http://localhost:3000/api/orders');
            return await response.json();
        } catch (e) {
            return [];
        }
    }

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
});