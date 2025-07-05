// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Load initial data
    loadCategories();
    loadStores();
    loadProducts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize image preview
    initImagePreview();
});

// Set up all event listeners
function setupEventListeners() {
    // Filter button click
    document.getElementById('applyFilters').addEventListener('click', function() {
        loadProducts();
    });
    
    // Reset filters button click
    document.getElementById('resetFilters').addEventListener('click', function() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('storeFilter').value = '';
        document.getElementById('searchInput').value = '';
        loadProducts();
    });
    
    // Save new product button click
    document.getElementById('saveProductBtn').addEventListener('click', function() {
        saveProduct();
    });
    
    // Update product button click
    document.getElementById('updateProductBtn').addEventListener('click', function() {
        updateProduct();
    });
    
    // Confirm delete product button click
    document.getElementById('confirmDeleteProductBtn').addEventListener('click', function() {
        const productId = document.getElementById('deleteProductId').value;
        deleteProduct(productId);
    });
    
    // Logout button click
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
    
    // Search input enter key press
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            loadProducts();
        }
    });
}

// Initialize image preview functionality
function initImagePreview() {
    // Preview for add product
    document.getElementById('productImage').addEventListener('change', function(e) {
        const preview = document.getElementById('imagePreview');
        const previewImg = preview.querySelector('img');
        
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            preview.classList.add('d-none');
        }
    });
    
    // Preview for edit product
    document.getElementById('editProductImage').addEventListener('change', function(e) {
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
}

// Load categories for dropdowns
function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/categories', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Kategoriler yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Populate category filter dropdown
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>';
        
        // Populate add product category dropdown
        const productCategory = document.getElementById('productCategory');
        productCategory.innerHTML = '<option value="">Kategori Seçin</option>';
        
        // Populate edit product category dropdown
        const editProductCategory = document.getElementById('editProductCategory');
        editProductCategory.innerHTML = '<option value="">Kategori Seçin</option>';
        
        data.forEach(category => {
            // Add to filter dropdown
            const filterOption = document.createElement('option');
            filterOption.value = category.id;
            filterOption.textContent = category.name;
            categoryFilter.appendChild(filterOption);
            
            // Add to new product dropdown
            const addOption = document.createElement('option');
            addOption.value = category.id;
            addOption.textContent = category.name;
            productCategory.appendChild(addOption);
            
            // Add to edit product dropdown
            const editOption = document.createElement('option');
            editOption.value = category.id;
            editOption.textContent = category.name;
            editProductCategory.appendChild(editOption);
        });
    })
    .catch(error => {
        console.error('Error loading categories:', error);
        showAlert('danger', 'Kategoriler yüklenirken bir hata oluştu!');
    });
}

// Load stores for dropdowns
function loadStores() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/stores', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Mağazalar yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Populate store filter dropdown
        const storeFilter = document.getElementById('storeFilter');
        storeFilter.innerHTML = '<option value="">Tüm Mağazalar</option>';
        
        // Populate add product store dropdown
        const productStore = document.getElementById('productStore');
        productStore.innerHTML = '<option value="">Mağaza Seçin</option>';
        
        // Populate edit product store dropdown
        const editProductStore = document.getElementById('editProductStore');
        editProductStore.innerHTML = '<option value="">Mağaza Seçin</option>';
        
        data.forEach(store => {
            // Add to filter dropdown
            const filterOption = document.createElement('option');
            filterOption.value = store.id;
            filterOption.textContent = store.name;
            storeFilter.appendChild(filterOption);
            
            // Add to new product dropdown
            const addOption = document.createElement('option');
            addOption.value = store.id;
            addOption.textContent = store.name;
            productStore.appendChild(addOption);
            
            // Add to edit product dropdown
            const editOption = document.createElement('option');
            editOption.value = store.id;
            editOption.textContent = store.name;
            editProductStore.appendChild(editOption);
        });
    })
    .catch(error => {
        console.error('Error loading stores:', error);
        showAlert('danger', 'Mağazalar yüklenirken bir hata oluştu!');
    });
}

// Load products with filters
function loadProducts(page = 1) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Get filter values
    const categoryId = document.getElementById('categoryFilter').value;
    const storeId = document.getElementById('storeFilter').value;
    const searchTerm = document.getElementById('searchInput').value;
    
    // Build query string
    let queryParams = `?page=${page}`;
    if (categoryId) queryParams += `&categoryId=${categoryId}`;
    if (storeId) queryParams += `&storeId=${storeId}`;
    if (searchTerm) queryParams += `&search=${encodeURIComponent(searchTerm)}`;
    
    fetch(`/api/products${queryParams}`, {
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
        // Render products
        renderProducts(data.products || data);
        
        // Render pagination if we have pagination data
        if (data.totalPages) {
            renderPagination(data.currentPage, data.totalPages);
        }
    })
    .catch(error => {
        console.error('Error loading products:', error);
        showAlert('danger', 'Ürünler yüklenirken bir hata oluştu!');
    });
}

// Render products table
function renderProducts(products) {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">Ürün bulunamadı</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Format price with currency
        const formattedPrice = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(product.price);
        
        // Status badge color
        const statusBadgeClass = product.status === 'active' ? 'bg-success' : 'bg-danger';
        const statusText = product.status === 'active' ? 'Aktif' : 'Pasif';
        
        // Product image or default
        const productImage = product.image
            ? `/uploads/${product.image}`
            : 'https://via.placeholder.com/50';
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${productImage}" alt="${product.name}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${product.name}</td>
            <td>${product.Category ? product.Category.name : 'Kategori Yok'}</td>
            <td>${product.Store ? product.Store.name : 'Mağaza Yok'}</td>
            <td>${formattedPrice}</td>
            <td>${product.stock}</td>
            <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-info edit-product-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Add event listeners to action buttons
        const editBtn = row.querySelector('.edit-product-btn');
        editBtn.addEventListener('click', () => openEditProductModal(product.id));
        
        const deleteBtn = row.querySelector('.delete-product-btn');
        deleteBtn.addEventListener('click', () => openDeleteProductModal(product.id));
        
        tableBody.appendChild(row);
    });
}

// Render pagination
function renderPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
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
            loadProducts(currentPage - 1);
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
                loadProducts(i);
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
            loadProducts(currentPage + 1);
        });
    }
    nextLi.appendChild(nextLink);
    paginationUl.appendChild(nextLi);
    
    paginationContainer.appendChild(paginationUl);
}

// Save new product
function saveProduct() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    
    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Ürün eklenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Reset form
        form.reset();
        
        // Hide image preview
        document.getElementById('imagePreview').classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        
        // Reload products
        loadProducts();
        
        showAlert('success', 'Ürün başarıyla eklendi!');
    })
    .catch(error => {
        console.error('Error adding product:', error);
        showAlert('danger', 'Ürün eklenirken bir hata oluştu!');
    });
}

// Open edit product modal and load product data
function openEditProductModal(productId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`/api/products/${productId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ürün bilgileri yüklenirken bir hata oluştu!');
        return response.json();
    })
    .then(product => {
        // Set form fields
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.categoryId;
        document.getElementById('editProductStore').value = product.storeId;
        document.getElementById('editProductStock').value = product.stock;
        document.getElementById('editProductStatus').value = product.status;
        document.getElementById('editProductDescription').value = product.description || '';
        
        // Set image preview
        const imagePreview = document.getElementById('editImagePreview');
        const previewImg = imagePreview.querySelector('img');
        
        if (product.image) {
            previewImg.src = `/uploads/${product.image}`;
            imagePreview.classList.remove('d-none');
        } else {
            previewImg.src = 'https://via.placeholder.com/200';
            imagePreview.classList.remove('d-none');
        }
        
        // Reset keep current image checkbox
        document.getElementById('keepCurrentImage').checked = true;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    })
    .catch(error => {
        console.error('Error loading product details:', error);
        showAlert('danger', 'Ürün bilgileri yüklenirken bir hata oluştu!');
    });
}

// Update product
function updateProduct() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const productId = document.getElementById('editProductId').value;
    const form = document.getElementById('editProductForm');
    const formData = new FormData(form);
    
    // If keep current image is checked and no new image is selected, remove the image field
    if (document.getElementById('keepCurrentImage').checked && !document.getElementById('editProductImage').files[0]) {
        formData.delete('image');
    }
    
    fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Ürün güncellenirken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        
        // Reload products
        loadProducts();
        
        showAlert('success', 'Ürün başarıyla güncellendi!');
    })
    .catch(error => {
        console.error('Error updating product:', error);
        showAlert('danger', 'Ürün güncellenirken bir hata oluştu!');
    });
}

// Open delete product confirmation modal
function openDeleteProductModal(productId) {
    document.getElementById('deleteProductId').value = productId;
    const modal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
    modal.show();
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
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
        modal.hide();
        
        // Reload products
        loadProducts();
        
        showAlert('success', 'Ürün başarıyla silindi!');
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        showAlert('danger', 'Ürün silinirken bir hata oluştu!');
    });
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
