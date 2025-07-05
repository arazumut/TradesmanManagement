// Global store ID
let storeId = null;

// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Get store ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    storeId = urlParams.get('id');
    
    if (!storeId) {
        window.location.href = 'stores.html';
        return;
    }
    
    // Load store data
    loadStoreDetails();
    
    // Load store products
    loadStoreProducts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize tabs
    const tabEls = document.querySelectorAll('#storeDetailTabs button');
    tabEls.forEach(tabEl => {
        tabEl.addEventListener('click', handleTabClick);
    });
});

// Set up all event listeners
function setupEventListeners() {
    // Edit store button
    document.getElementById('editStoreBtn').addEventListener('click', function() {
        openEditStoreModal();
    });
    
    // Update store button
    document.getElementById('updateStoreBtn').addEventListener('click', function() {
        updateStore();
    });
    
    // Add product button
    document.getElementById('addProductBtn').addEventListener('click', function() {
        // Redirect to products page with store filter
        window.location.href = `products.html?storeId=${storeId}`;
    });
    
    // Filter orders button
    document.getElementById('filterOrdersBtn').addEventListener('click', function() {
        loadStoreOrders();
    });
    
    // Order status actions
    document.querySelectorAll('#orderStatusActions button').forEach(button => {
        button.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            const orderId = document.getElementById('orderDetailId').textContent;
            updateOrderStatus(orderId, status);
        });
    });
    
    // Rating filter
    document.getElementById('ratingFilter').addEventListener('change', function() {
        loadStoreReviews();
    });
    
    // Edit store image preview
    document.getElementById('editStoreImage').addEventListener('change', function(e) {
        const preview = document.getElementById('editImagePreview');
        const previewImg = preview.querySelector('img');
        
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                document.getElementById('keepCurrentImage').checked = false;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
}

// Handle tab click events
function handleTabClick(e) {
    const tabId = e.target.id;
    
    if (tabId === 'orders-tab') {
        loadStoreOrders();
    } else if (tabId === 'reviews-tab') {
        loadStoreReviews();
    }
}

// Load store details
function loadStoreDetails() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/stores/${storeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Mağaza bilgileri yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Update store info
        document.getElementById('storeName').textContent = data.name;
        document.getElementById('storeOwner').textContent = `Sahip: ${data.User ? data.User.name : 'Bilinmiyor'}`;
        document.getElementById('storeAddress').textContent = data.address || 'Adres bilgisi yok';
        document.getElementById('storePhone').textContent = data.phone || 'Telefon bilgisi yok';
        document.getElementById('storeEmail').textContent = data.User ? data.User.email : 'E-posta bilgisi yok';
        document.getElementById('storeWorkingHours').textContent = data.workingHours || 'Belirtilmemiş';
        
        // Format date
        const createdAt = new Date(data.createdAt).toLocaleDateString('tr-TR');
        document.getElementById('storeCreatedAt').textContent = createdAt;
        
        // Set status badge
        const statusBadge = document.getElementById('storeStatus');
        if (data.isOpen) {
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Aktif';
        } else {
            statusBadge.className = 'badge bg-danger';
            statusBadge.textContent = 'Kapalı';
        }
        
        // Set store image
        const storeImage = document.getElementById('storeImage');
        if (data.image) {
            storeImage.src = `/uploads/${data.image}`;
        } else {
            storeImage.src = 'https://via.placeholder.com/150';
        }
        
        // Update document title
        document.title = `${data.name} | Esnaf Yönetim Paneli`;
        
        // Load store statistics
        loadStoreStatistics();
    })
    .catch(error => {
        console.error('Error loading store details:', error);
        showAlert('danger', 'Mağaza bilgileri yüklenirken bir hata oluştu!');
    });
}

// Load store statistics
function loadStoreStatistics() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/admin/stores/${storeId}/stats`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Mağaza istatistikleri yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Update statistics
        document.getElementById('totalOrders').textContent = data.totalOrders || 0;
        document.getElementById('totalProducts').textContent = data.totalProducts || 0;
        document.getElementById('avgRating').textContent = data.avgRating ? data.avgRating.toFixed(1) : '0.0';
        
        // Format total revenue
        const formattedRevenue = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(data.totalRevenue || 0);
        document.getElementById('totalRevenue').textContent = formattedRevenue;
    })
    .catch(error => {
        console.error('Error loading store statistics:', error);
        // Not showing alert as this is not critical
    });
}

// Load store products
function loadStoreProducts(page = 1) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/products?storeId=${storeId}&page=${page}&limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ürünler yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        renderProductsTable(data.products);
        renderPagination('productsPagination', page, data.totalPages, loadStoreProducts);
    })
    .catch(error => {
        console.error('Error loading store products:', error);
        showAlert('danger', 'Ürünler yüklenirken bir hata oluştu!');
    });
}

// Render products table
function renderProductsTable(products) {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Bu mağazaya ait ürün bulunamadı</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(product.price || 0);
        
        // Status badge
        const statusBadge = product.isActive 
            ? '<span class="badge bg-success">Aktif</span>' 
            : '<span class="badge bg-danger">Pasif</span>';
        
        // Product image
        const productImage = product.image 
            ? `/uploads/${product.image}` 
            : 'https://via.placeholder.com/50';
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${productImage}" alt="${product.name}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${product.name}</td>
            <td>${product.Category ? product.Category.name : 'Kategori Yok'}</td>
            <td>${formattedPrice}</td>
            <td>${product.stock || 0}</td>
            <td>${statusBadge}</td>
            <td>
                <a href="products.html?edit=${product.id}" class="btn btn-sm btn-info">
                    <i class="fas fa-edit"></i>
                </a>
                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Add event listener for delete button
        const deleteBtn = row.querySelector('.delete-product-btn');
        deleteBtn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
                deleteProduct(productId);
            }
        });
        
        tableBody.appendChild(row);
    });
}

// Delete product
function deleteProduct(productId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ürün silinirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        showAlert('success', 'Ürün başarıyla silindi!');
        loadStoreProducts();
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        showAlert('danger', 'Ürün silinirken bir hata oluştu!');
    });
}

// Load store orders
function loadStoreOrders(page = 1) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const status = document.getElementById('orderStatusFilter').value;
    
    let url = `/api/orders?storeId=${storeId}&page=${page}&limit=10`;
    if (status) {
        url += `&status=${status}`;
    }
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Siparişler yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        renderOrdersTable(data.orders);
        renderPagination('ordersPagination', page, data.totalPages, loadStoreOrders);
    })
    .catch(error => {
        console.error('Error loading store orders:', error);
        showAlert('danger', 'Siparişler yüklenirken bir hata oluştu!');
    });
}

// Render orders table
function renderOrdersTable(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Bu mağazaya ait sipariş bulunamadı</td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Format date
        const orderDate = new Date(order.createdAt).toLocaleDateString('tr-TR');
        
        // Format total
        const formattedTotal = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(order.totalAmount || 0);
        
        // Status badge
        let statusBadge = '';
        switch(order.status) {
            case 'pending':
                statusBadge = '<span class="badge bg-warning">Beklemede</span>';
                break;
            case 'processing':
                statusBadge = '<span class="badge bg-info">Hazırlanıyor</span>';
                break;
            case 'completed':
                statusBadge = '<span class="badge bg-success">Tamamlandı</span>';
                break;
            case 'cancelled':
                statusBadge = '<span class="badge bg-danger">İptal Edildi</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Bilinmiyor</span>';
        }
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${orderDate}</td>
            <td>${order.User ? order.User.name : 'Bilinmiyor'}</td>
            <td>${formattedTotal}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-info view-order-btn" data-id="${order.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        // Add event listener for view button
        const viewBtn = row.querySelector('.view-order-btn');
        viewBtn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            viewOrderDetails(orderId);
        });
        
        tableBody.appendChild(row);
    });
}

// View order details
function viewOrderDetails(orderId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Sipariş detayları yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(order => {
        // Set order details
        document.getElementById('orderDetailId').textContent = order.id;
        document.getElementById('orderDetailDate').textContent = new Date(order.createdAt).toLocaleString('tr-TR');
        document.getElementById('orderDetailCustomer').textContent = order.User ? order.User.name : 'Bilinmiyor';
        document.getElementById('orderDetailPhone').textContent = order.User ? order.User.phone : 'Bilinmiyor';
        document.getElementById('orderDetailAddress').textContent = order.address || 'Bilinmiyor';
        
        // Format total
        const formattedTotal = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(order.totalAmount || 0);
        document.getElementById('orderDetailTotal').textContent = formattedTotal;
        
        // Payment method
        document.getElementById('orderDetailPayment').textContent = order.paymentMethod || 'Bilinmiyor';
        
        // Note
        document.getElementById('orderDetailNote').textContent = order.note || 'Not yok';
        
        // Status badge
        let statusBadge = '';
        switch(order.status) {
            case 'pending':
                statusBadge = '<span class="badge bg-warning">Beklemede</span>';
                break;
            case 'processing':
                statusBadge = '<span class="badge bg-info">Hazırlanıyor</span>';
                break;
            case 'completed':
                statusBadge = '<span class="badge bg-success">Tamamlandı</span>';
                break;
            case 'cancelled':
                statusBadge = '<span class="badge bg-danger">İptal Edildi</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Bilinmiyor</span>';
        }
        document.getElementById('orderDetailStatus').innerHTML = statusBadge;
        
        // Order items
        renderOrderItems(order.OrderItems);
        
        // Disable current status button
        document.querySelectorAll('#orderStatusActions button').forEach(button => {
            const status = button.getAttribute('data-status');
            if (status === order.status) {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    })
    .catch(error => {
        console.error('Error loading order details:', error);
        showAlert('danger', 'Sipariş detayları yüklenirken bir hata oluştu!');
    });
}

// Render order items
function renderOrderItems(items) {
    const itemsContainer = document.getElementById('orderDetailItems');
    itemsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        itemsContainer.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Bu siparişe ait ürün bulunamadı</td>
            </tr>
        `;
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(item.price || 0);
        
        // Format total
        const total = (item.price || 0) * (item.quantity || 0);
        const formattedTotal = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(total);
        
        row.innerHTML = `
            <td>${item.Product ? item.Product.name : 'Bilinmiyor'}</td>
            <td>${formattedPrice}</td>
            <td>${item.quantity}</td>
            <td>${formattedTotal}</td>
        `;
        
        itemsContainer.appendChild(row);
    });
}

// Update order status
function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
    .then(response => {
        if (!response.ok) throw new Error('Sipariş durumu güncellenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
        modal.hide();
        
        // Show success message
        showAlert('success', 'Sipariş durumu başarıyla güncellendi!');
        
        // Reload orders
        loadStoreOrders();
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        showAlert('danger', 'Sipariş durumu güncellenirken bir hata oluştu!');
    });
}

// Load store reviews
function loadStoreReviews(page = 1) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const rating = document.getElementById('ratingFilter').value;
    
    let url = `/api/stores/${storeId}/reviews?page=${page}&limit=10`;
    if (rating) {
        url += `&rating=${rating}`;
    }
    
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Değerlendirmeler yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        renderReviews(data.reviews);
        renderPagination('reviewsPagination', page, data.totalPages, loadStoreReviews);
    })
    .catch(error => {
        console.error('Error loading store reviews:', error);
        // Not showing alert as this is not critical
        // Just show empty state
        renderReviews([]);
    });
}

// Render reviews
function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = '';
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted">Henüz değerlendirme bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    reviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'card mb-3';
        
        // Format date
        const reviewDate = new Date(review.createdAt).toLocaleDateString('tr-TR');
        
        // Generate stars
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-warning"></i>';
            }
        }
        
        reviewEl.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <h6 class="mb-0">${review.User ? review.User.name : 'Anonim'}</h6>
                        <div class="text-muted small">${reviewDate}</div>
                    </div>
                    <div class="rating">
                        ${stars}
                    </div>
                </div>
                <p class="card-text">${review.comment || 'Yorum yok'}</p>
            </div>
        `;
        
        container.appendChild(reviewEl);
    });
}

// Open edit store modal
function openEditStoreModal() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/stores/${storeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Mağaza bilgileri yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(store => {
        // Set form fields
        document.getElementById('editStoreId').value = store.id;
        document.getElementById('editStoreName').value = store.name;
        document.getElementById('editStorePhone').value = store.phone || '';
        document.getElementById('editStoreAddress').value = store.address || '';
        document.getElementById('editStoreWorkingHours').value = store.workingHours || '';
        document.getElementById('editStoreStatus').value = store.isOpen.toString();
        document.getElementById('editStoreDescription').value = store.description || '';
        
        // Set image preview
        const imagePreview = document.getElementById('editImagePreview');
        const previewImg = imagePreview.querySelector('img');
        
        if (store.image) {
            previewImg.src = `/uploads/${store.image}`;
        } else {
            previewImg.src = 'https://via.placeholder.com/150';
        }
        
        // Reset keep current image checkbox
        document.getElementById('keepCurrentImage').checked = true;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editStoreModal'));
        modal.show();
    })
    .catch(error => {
        console.error('Error loading store details for edit:', error);
        showAlert('danger', 'Mağaza bilgileri yüklenirken bir hata oluştu!');
    });
}

// Update store
function updateStore() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const form = document.getElementById('editStoreForm');
    const formData = new FormData(form);
    
    // If keep current image is checked and no new image is selected, remove the image field
    if (document.getElementById('keepCurrentImage').checked && !document.getElementById('editStoreImage').files[0]) {
        formData.delete('image');
    }
    
    fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Mağaza güncellenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editStoreModal'));
        modal.hide();
        
        // Show success message
        showAlert('success', 'Mağaza başarıyla güncellendi!');
        
        // Reload store details
        loadStoreDetails();
    })
    .catch(error => {
        console.error('Error updating store:', error);
        showAlert('danger', 'Mağaza güncellenirken bir hata oluştu!');
    });
}

// Render pagination
function renderPagination(containerId, currentPage, totalPages, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!totalPages || totalPages <= 1) {
        return;
    }
    
    const paginationUl = document.createElement('ul');
    paginationUl.className = 'pagination';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Önceki';
    if (currentPage > 1) {
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            callback(currentPage - 1);
        });
    }
    prevLi.appendChild(prevLink);
    paginationUl.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (i !== currentPage) {
                callback(i);
            }
        });
        pageLi.appendChild(pageLink);
        paginationUl.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Sonraki';
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            callback(currentPage + 1);
        });
    }
    nextLi.appendChild(nextLink);
    paginationUl.appendChild(nextLi);
    
    container.appendChild(paginationUl);
}

// Show alert message
function showAlert(type, message) {
    // Check if alert container exists, if not create it
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertEl);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
    }, 5000);
}
