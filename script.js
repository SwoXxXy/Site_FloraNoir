document.addEventListener("DOMContentLoaded", function () {
    // Навигация
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-links a');
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileNav = document.querySelector('.nav-links');
    const pages = document.querySelectorAll('.page');
    
    // Прокрутка навигации
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Бургер-меню
    burgerMenu.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
    });
    
    // Переключение страниц
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                navLinks.forEach(l => l.classList.remove('active'));
                pages.forEach(page => page.classList.remove('active'));
                
                this.classList.add('active');
                const targetPage = document.querySelector(this.getAttribute('href'));
                targetPage.classList.add('active');
                
                mobileNav.classList.remove('active');
                window.scrollTo(0, 0);
            }
        });
    });
    
    // API функции
    const API_URL = 'http://localhost:3000/api';

    async function fetchProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async function addProduct(product) {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async function updateProduct(id, product) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async function deleteProduct(id) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
    
    // Отображение товаров
    const productList = document.getElementById('productList');
    const typeFilter = document.getElementById('typeFilter');
    const occasionFilter = document.getElementById('occasionFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchInput');
    
    async function displayProducts(searchTerm = '') {
        if (!productList) return;
        
        const products = await fetchProducts();
        productList.innerHTML = '';
        
        const typeValue = typeFilter ? typeFilter.value : 'all';
        const occasionValue = occasionFilter ? occasionFilter.value : 'all';
        const priceValue = priceFilter ? priceFilter.value : 'all';
        
        let filteredProducts = products.filter(product => {
            const matchesSearch = searchTerm === '' || 
                product.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeValue === 'all' || product.type === typeValue;
            const matchesOccasion = occasionValue === 'all' || 
                (occasionValue === 'none' ? !product.occasion : product.occasion === occasionValue);
            let matchesPrice = true;
            if (priceValue !== 'all') {
                const [min, max] = priceValue.split('-').map(Number);
                matchesPrice = !isNaN(max) ? 
                    product.price >= min && product.price <= max : 
                    product.price >= min;
            }
            return matchesSearch && matchesType && matchesOccasion && matchesPrice;
        });
        
        if (filteredProducts.length === 0) {
            productList.innerHTML = '<p class="no-products">Товары не найдены</p>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const productItem = document.createElement('a');
            productItem.classList.add('product-item');
            productItem.href = `product.html?id=${product.id_products}`;
            productItem.innerHTML = `
                <img src="${product.img}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p class="price">${product.price} руб.</p>
                <p class="stock">В наличии: ${product.stock} шт.</p>
            `;
            productList.appendChild(productItem);
        });
    }
    
    // Корзина
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (!Array.isArray(cart)) cart = [];
    const cartCounter = document.getElementById('cartCounter');
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.querySelector('.total-price');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    function updateCartCounter() {
        if (cartCounter) {
            cartCounter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    }

    // История операций
    function addToHistory(operation) {
        const history = JSON.parse(localStorage.getItem('operations_history')) || [];
        operation.date = new Date().toISOString();
        history.push(operation);
        localStorage.setItem('operations_history', JSON.stringify(history));
    }

    // Обновляем функцию updateCart для записи операций
    async function updateCart() {
        if (!cartItemsContainer || !totalPriceElement) return;
        
        const products = await fetchProducts();
        let total = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <p class="empty-cart">Ваша корзина пуста</p>
                <div class="cart-buttons">
                    <a href="orders.html" class="btn-secondary">Мои заказы</a>
                </div>
            `;
            totalPriceElement.textContent = '0 руб.';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }
        
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const product = products.find(p => p.id_products === item.id);
            if (product) {
                const itemTotal = product.price * item.quantity;
                total += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <img src="${product.img}" alt="${product.title}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${product.title}</div>
                        <div class="cart-item-price">${product.price} руб.</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="decrease-quantity">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="increase-quantity">+</button>
                        <i class="fas fa-trash remove-item"></i>
                    </div>
                `;
                
                const decreaseBtn = cartItem.querySelector('.decrease-quantity');
                const increaseBtn = cartItem.querySelector('.increase-quantity');
                const removeBtn = cartItem.querySelector('.remove-item');
                const quantitySpan = cartItem.querySelector('.cart-item-quantity');
                
                decreaseBtn.addEventListener('click', () => {
                    if (item.quantity > 1) {
                        const oldQuantity = item.quantity;
                        item.quantity--;
                        quantitySpan.textContent = item.quantity;
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCart();
                        updateCartCounter();
                        
                        // Запись в историю
                        addToHistory({
                            type: 'update',
                            productId: product.id_products,
                            productTitle: product.title,
                            quantity: item.quantity,
                            previousQuantity: oldQuantity
                        });
                    }
                });
                
                increaseBtn.addEventListener('click', () => {
                    if (item.quantity < product.stock) {
                        const oldQuantity = item.quantity;
                        item.quantity++;
                        quantitySpan.textContent = item.quantity;
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCart();
                        updateCartCounter();
                        
                        // Запись в историю
                        addToHistory({
                            type: 'update',
                            productId: product.id_products,
                            productTitle: product.title,
                            quantity: item.quantity,
                            previousQuantity: oldQuantity
                        });
                    } else {
                        alert('Недостаточно товара в наличии');
                    }
                });
                
                removeBtn.addEventListener('click', () => {
                    // Запись в историю перед удалением
                    addToHistory({
                        type: 'remove',
                        productId: product.id_products,
                        productTitle: product.title,
                        quantity: item.quantity
                    });
                    
                    cart = cart.filter(cartItem => cartItem.id !== item.id);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCart();
                    updateCartCounter();
                });
                
                cartItemsContainer.appendChild(cartItem);
            }
        });
        
        // Добавляем кнопки после списка товаров
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'cart-buttons';
        buttonsContainer.innerHTML = `
            <a href="orders.html" class="btn-secondary">Мои заказы</a>
        `;
        cartItemsContainer.appendChild(buttonsContainer);
        
        totalPriceElement.textContent = `${total} руб.`;
        if (checkoutBtn) checkoutBtn.style.display = 'block';
    }

    // === Модальное окно для данных клиента ===
    const clientBackdrop = document.createElement('div');
    clientBackdrop.className = 'modal-backdrop';
    clientBackdrop.style.display = 'none';
    document.body.appendChild(clientBackdrop);

    const clientModal = document.createElement('div');
    clientModal.id = 'clientModal';
    clientModal.style.display = 'none';
    clientModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeClientModal">&times;</span>
            <h2>Данные клиента</h2>
            <form id="clientForm">
                <div class="form-group">
                    <label for="clientFIO">ФИО</label>
                    <input type="text" id="clientFIO" required>
                </div>
                <div class="form-group">
                    <label for="clientPhone">Телефон</label>
                    <input type="tel" id="clientPhone" required>
                </div>
                <div class="form-group">
                    <label for="clientEmail">Email</label>
                    <input type="email" id="clientEmail" required>
                </div>
                <div class="form-group">
                    <label for="clientAddress">Адрес доставки</label>
                    <input type="text" id="clientAddress" required>
                </div>
                <button type="submit" class="btn-primary">Подтвердить</button>
            </form>
        </div>
    `;
    document.body.appendChild(clientModal);

    const closeClientModalBtn = document.getElementById('closeClientModal');
    closeClientModalBtn.onclick = () => { clientModal.style.display = 'none'; clientBackdrop.style.display = 'none'; };
    clientBackdrop.onclick = function(event) {
        clientModal.style.display = 'none';
        clientBackdrop.style.display = 'none';
    };

    // === Изменяем обработчик checkoutBtn ===
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const products = await fetchProducts();
            let canCheckout = true;
            let totalAmount = 0;
            let totalItems = 0;
            cart.forEach(item => {
                const product = products.find(p => p.id_products === item.id);
                if (!product || product.stock < item.quantity) {
                    canCheckout = false;
                    alert(`Товар "${product?.title || 'Неизвестный товар'}" недоступен в указанном количестве`);
                }
                if (product) {
                    totalAmount += product.price * item.quantity;
                    totalItems += item.quantity;
                }
            });
            if (!canCheckout) return;
            // Показываем модальное окно для клиента
            clientModal.style.display = 'block';
            clientBackdrop.style.display = 'block';
            // Обработка формы клиента
            const clientForm = document.getElementById('clientForm');
            clientForm.onsubmit = async function(e) {
                e.preventDefault();
                const FIO = document.getElementById('clientFIO').value.trim();
                const phone = document.getElementById('clientPhone').value.trim();
                const email = document.getElementById('clientEmail').value.trim();
                const address = document.getElementById('clientAddress').value.trim();
                if (!FIO || !phone || !email || !address) {
                    alert('Пожалуйста, заполните все поля');
                    return;
                }
                // Отправляем клиента в БД
                let id_klient = null;
                try {
                    const res = await fetch('http://localhost:3000/api/klients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ FIO, phone, email, address })
                    });
                    const data = await res.json();
                    id_klient = data.id_klient;
                } catch (err) {
                    alert('Ошибка при сохранении данных клиента!');
                    return;
                }
                // Формируем заказ для API
                const order = {
                    items: cart,
                    total_sum: totalAmount,
                    status_order: 'pending',
                    client_id: id_klient
                };
                // Отправляем заказ на сервер
                try {
                    await fetch('http://localhost:3000/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(order)
                    });
                } catch (error) {
                    alert('Ошибка при оформлении заказа!');
                    return;
                }
                // Запись в историю
                addToHistory({
                    type: 'order',
                    amount: totalAmount,
                    quantity: totalItems
                });
                // Очищаем корзину
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCart();
                updateCartCounter();
                clientModal.style.display = 'none';
                clientBackdrop.style.display = 'none';
                alert('Заказ успешно оформлен!');
            };
        });
    }

    // Добавляем запись в историю при добавлении товара в корзину
    window.addEventListener('addToCart', function(e) {
        const { product, quantity } = e.detail;
        addToHistory({
            type: 'add',
            productId: product.id_products,
            productTitle: product.title,
            quantity: quantity
        });
    });

    // Инициализация корзины при загрузке страницы
    updateCart();
    updateCartCounter();
    
    // Фильтрация товаров
    if (typeFilter) typeFilter.addEventListener('change', () => displayProducts(searchInput?.value || ''));
    if (occasionFilter) occasionFilter.addEventListener('change', () => displayProducts(searchInput?.value || ''));
    if (priceFilter) priceFilter.addEventListener('change', () => displayProducts(searchInput?.value || ''));
    if (searchInput) searchInput.addEventListener('input', (e) => displayProducts(e.target.value));
    
    // Инициализация магазина
    if (document.getElementById('productList')) {
        displayProducts();
    }
    
    // Экспорт функций для использования в других файлах
    window.shopApi = {
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        displayProducts
    };
});

// Обработка якорных ссылок при загрузке
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash) {
        const targetLink = document.querySelector(`a[href="${hash}"]`);
        if (targetLink) targetLink.click();
    }
});

// Улучшенная обработка якорных ссылок при загрузке
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash) {
        const targetLink = document.querySelector(`a[href="${hash}"]`);
        if (targetLink) {
            // Сохраняем текущую позицию прокрутки
            const scrollPosition = window.scrollY;
            
            // Имитируем клик по ссылке
            targetLink.click();
            
            // Восстанавливаем позицию прокрутки после небольшой задержки
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 100);
        }
    }
});

// Функция для обновления количества товаров на странице магазина
function updateProductStockOnPage(productId, quantityChange) {
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
        const itemId = parseInt(new URL(item.href).searchParams.get('id'));
        if (itemId === productId) {
            const stockElement = item.querySelector('.stock');
            if (stockElement) {
                const currentStock = parseInt(stockElement.textContent.match(/\d+/)[0]);
                const newStock = currentStock - quantityChange;
                stockElement.textContent = `В наличии: ${newStock > 0 ? newStock : 0} шт.`;
            }
        }
    });
}

// Модифицируем функцию добавления в корзину в обработчике оформления заказа
// Находим этот блок в существующем коде (примерно строка 250):
// cart.forEach(item => {
//     const product = products.find(p => p.id === item.id);
//     if (product) {
//         product.stock -= item.quantity;
//     }
// });

// Заменяем его на:
cart.forEach(item => {
    const product = products.find(p => p.id_products === item.id);
    if (product) {
        product.stock -= item.quantity;
        updateProductStockOnPage(item.id, item.quantity);
    }
});