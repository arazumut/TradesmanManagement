// Orders.js - Sipariş yönetimi için JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const auth = checkAuth();
    if (!auth) return;
    
    // DOM elementleri
    const orderDetailModal = document.getElementById('order-detail-modal');
    const searchInput = document.getElementById('search-order');
    const searchBtn = document.getElementById('search-btn');
    const statusFilter = document.getElementById('status-filter');
    const storeFilter = document.getElementById('store-filter');
    const dateFilter = document.getElementById('date-filter');
    const modalCloseButtons = document.querySelectorAll('.close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const printOrderBtn = document.getElementById('print-order-btn');
    const updateStatusBtn = document.getElementById('update-status-btn');
    
    let currentPage = 1;
    let currentOrderId = null;
    
    // Siparişleri ve mağazaları yükle
    loadOrders();
    loadStores();
    
    // Event Listeners
    searchBtn.addEventListener('click', searchOrders);
    statusFilter.addEventListener('change', searchOrders);
    storeFilter.addEventListener('change', searchOrders);
    dateFilter.addEventListener('change', searchOrders);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchOrders();
        }
    });
    
    // Modal kapatma butonları
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            orderDetailModal.style.display = 'none';
        });
    });
    
    closeModalBtn.addEventListener('click', function() {
        orderDetailModal.style.display = 'none';
    });
    
    // Sipariş yazdır
    printOrderBtn.addEventListener('click', printOrder);
    
    // Sipariş durumu güncelle
    updateStatusBtn.addEventListener('click', updateOrderStatus);
    
    // Modal dışına tıklandığında kapat
    window.addEventListener('click', function(event) {
        if (event.target === orderDetailModal) {
            orderDetailModal.style.display = 'none';
        }
    });
    
    // Siparişleri yükle
    async function loadOrders(page = 1, filters = {}) {
        try {
            let url = `/api/admin/orders?page=${page}&limit=10`;
            
            // Filtreler ekle
            if (filters.search) {
                url += `&search=${encodeURIComponent(filters.search)}`;
            }
            
            if (filters.status && filters.status !== 'all') {
                url += `&status=${filters.status}`;
            }
            
            if (filters.storeId && filters.storeId !== 'all') {
                url += `&storeId=${filters.storeId}`;
            }
            
            if (filters.dateFilter && filters.dateFilter !== 'all') {
                url += `&dateFilter=${filters.dateFilter}`;
            }
            
            const response = await apiRequest(url);
            
            const ordersList = document.getElementById('orders-list');
            const pagination = document.getElementById('pagination');
            
            if (response.data.length === 0) {
                ordersList.innerHTML = '<tr><td colspan="7" class="text-center">Sipariş bulunamadı</td></tr>';
                pagination.innerHTML = '';
                return;
            }
            
            // Sipariş listesini oluştur
            ordersList.innerHTML = response.data.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.user ? order.user.name : 'Bilinmiyor'}</td>
                    <td>${order.store ? order.store.name : 'Bilinmiyor'}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td><span class="status-badge ${order.status}">${formatStatus(order.status)}</span></td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn print-btn" data-id="${order.id}">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Görüntüleme butonlarına event listener ekle
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    openOrderDetailModal(orderId);
                });
            });
            
            // Yazdırma butonlarına event listener ekle
            document.querySelectorAll('.print-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    printSpecificOrder(orderId);
                });
            });
            
            // Sayfalama
            renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Siparişler yüklenirken hata:', error);
            alert('Siparişler yüklenirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Mağazaları yükle (select için)
    async function loadStores() {
        try {
            const response = await apiRequest('/api/stores?limit=100');
            
            const storeFilterSelect = document.getElementById('store-filter');
            
            // Mağazaları dropdown'a ekle
            storeFilterSelect.innerHTML = '<option value="all">Tüm Mağazalar</option>' + 
                response.data.map(store => `
                    <option value="${store.id}">${store.name}</option>
                `).join('');
            
        } catch (error) {
            console.error('Mağazalar yüklenirken hata:', error);
            // Hata mesajını gösterme - kritik değil
        }
    }
    
    // Sayfalama
    function renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        
        if (!pagination || pagination.pages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Önceki sayfa
        paginationHTML += `
            <button class="page-btn ${pagination.page === 1 ? 'disabled' : ''}" 
                    ${pagination.page === 1 ? 'disabled' : `data-page="${pagination.page - 1}"`}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Sayfa numaraları
        for (let i = 1; i <= pagination.pages; i++) {
            if (
                i === 1 || // İlk sayfa
                i === pagination.pages || // Son sayfa
                (i >= pagination.page - 1 && i <= pagination.page + 1) // Aktif sayfa civarı
            ) {
                paginationHTML += `
                    <button class="page-btn ${pagination.page === i ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (
                i === 2 && pagination.page > 3 || // İlk sayfadan sonra
                i === pagination.pages - 1 && pagination.page < pagination.pages - 2 // Son sayfadan önce
            ) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        // Sonraki sayfa
        paginationHTML += `
            <button class="page-btn ${pagination.page === pagination.pages ? 'disabled' : ''}" 
                    ${pagination.page === pagination.pages ? 'disabled' : `data-page="${pagination.page + 1}"`}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationElement.innerHTML = paginationHTML;
        
        // Sayfa butonlarına event listener ekle
        document.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = parseInt(this.getAttribute('data-page'));
                currentPage = page;
                loadOrders(page, {
                    search: searchInput.value,
                    status: statusFilter.value,
                    storeId: storeFilter.value,
                    dateFilter: dateFilter.value
                });
            });
        });
    }
    
    // Sipariş detayı modalını aç
    async function openOrderDetailModal(orderId) {
        try {
            currentOrderId = orderId;
            const order = await apiRequest(`/api/orders/${orderId}`);
            
            // Modal başlık
            document.getElementById('order-id').textContent = order.id;
            
            // Sipariş bilgileri
            document.getElementById('order-date').textContent = formatDate(order.createdAt);
            document.getElementById('order-status').textContent = formatStatus(order.status);
            document.getElementById('order-total').textContent = formatCurrency(order.totalAmount);
            document.getElementById('order-payment').textContent = formatPaymentMethod(order.paymentMethod || 'cash');
            
            // Müşteri bilgileri
            if (order.user) {
                document.getElementById('customer-name').textContent = order.user.name;
                document.getElementById('customer-phone').textContent = order.user.phone || '-';
                document.getElementById('customer-email').textContent = order.user.email;
                document.getElementById('customer-address').textContent = order.address || order.user.address || '-';
            } else {
                document.getElementById('customer-name').textContent = 'Bilinmiyor';
                document.getElementById('customer-phone').textContent = '-';
                document.getElementById('customer-email').textContent = '-';
                document.getElementById('customer-address').textContent = order.address || '-';
            }
            
            // Sipariş ürünleri
            const orderItemsElement = document.getElementById('order-items');
            
            if (order.orderItems && order.orderItems.length > 0) {
                orderItemsElement.innerHTML = order.orderItems.map(item => `
                    <tr>
                        <td>${item.product ? item.product.name : 'Bilinmeyen Ürün'}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                `).join('');
                
                document.getElementById('order-items-total').textContent = formatCurrency(order.totalAmount);
            } else {
                orderItemsElement.innerHTML = '<tr><td colspan="4" class="text-center">Sipariş ürünü bulunamadı</td></tr>';
                document.getElementById('order-items-total').textContent = formatCurrency(0);
            }
            
            // Sipariş durumu güncelleme
            document.getElementById('update-status').value = order.status;
            
            // Modal aç
            orderDetailModal.style.display = 'block';
            
        } catch (error) {
            console.error('Sipariş detayları alınırken hata:', error);
            alert('Sipariş detayları alınırken bir hata oluştu: ' + error.message);
        }
    }
    
    // Sipariş durumunu güncelle
    async function updateOrderStatus() {
        if (!currentOrderId) return;
        
        const newStatus = document.getElementById('update-status').value;
        
        try {
            await apiRequest(`/api/orders/${currentOrderId}/status`, 'PUT', { status: newStatus });
            
            alert('Sipariş durumu başarıyla güncellendi!');
            
            // Sipariş listesini yenile
            loadOrders(currentPage, {
                search: searchInput.value,
                status: statusFilter.value,
                storeId: storeFilter.value,
                dateFilter: dateFilter.value
            });
            
            // Modal kapat
            orderDetailModal.style.display = 'none';
            
        } catch (error) {
            console.error('Sipariş durumu güncellenirken hata:', error);
            alert('Sipariş durumu güncellenirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Sipariş ara
    function searchOrders() {
        const searchTerm = searchInput.value.trim();
        const status = statusFilter.value;
        const storeId = storeFilter.value;
        const date = dateFilter.value;
        
        currentPage = 1;
        
        loadOrders(currentPage, {
            search: searchTerm,
            status: status,
            storeId: storeId,
            dateFilter: date
        });
    }
    
    // Sipariş yazdır
    function printOrder() {
        if (!currentOrderId) return;
        printSpecificOrder(currentOrderId);
    }
    
    // Belirli bir siparişi yazdır
    function printSpecificOrder(orderId) {
        // Yazdırma işlemi için yeni bir pencere aç
        const printWindow = window.open(`/api/orders/${orderId}/print`, '_blank');
        
        // Yeni pencere yüklendikten sonra yazdır
        printWindow.addEventListener('load', function() {
            printWindow.print();
        });
    }
    
    // Yardımcı fonksiyonlar
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatCurrency(amount) {
        return '₺' + parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    function formatStatus(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'processing': 'Hazırlanıyor',
            'shipped': 'Yolda',
            'delivered': 'Teslim Edildi',
            'cancelled': 'İptal'
        };
        return statusMap[status] || status;
    }
    
    function formatPaymentMethod(method) {
        const methodMap = {
            'cash': 'Nakit',
            'credit_card': 'Kredi Kartı',
            'bank_transfer': 'Banka Havalesi',
            'online': 'Online Ödeme'
        };
        return methodMap[method] || method;
    }
});

// CSS için ek stil kuralları
document.head.insertAdjacentHTML('beforeend', `
<style>
    /* Action Bar */
    .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .search-box {
        display: flex;
        align-items: center;
    }
    
    .search-box input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
        font-size: 14px;
        width: 250px;
    }
    
    .search-box button {
        padding: 8px 12px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
    }
    
    .filter-group {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .filter-box select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background-color: white;
    }
    
    .primary-btn {
        padding: 8px 16px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
    
    .primary-btn i {
        margin-right: 8px;
    }
    
    .secondary-btn {
        padding: 8px 16px;
        background-color: #95a5a6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    /* Data Table */
    .data-table {
        overflow-x: auto;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        margin-bottom: 20px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    table th, table td {
        padding: 12px 15px;
        text-align: left;
    }
    
    table th {
        background-color: #f8f9fa;
        color: #2c3e50;
        font-weight: 500;
    }
    
    table tbody tr {
        border-bottom: 1px solid #eee;
    }
    
    table tbody tr:last-child {
        border-bottom: none;
    }
    
    .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .pending { background-color: #f1c40f30; color: #f39c12; }
    .processing { background-color: #3498db30; color: #2980b9; }
    .shipped { background-color: #9b59b630; color: #8e44ad; }
    .delivered { background-color: #2ecc7130; color: #27ae60; }
    .cancelled { background-color: #e74c3c30; color: #c0392b; }
    
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        margin-right: 5px;
        font-size: 14px;
    }
    
    .view-btn { color: #3498db; }
    .print-btn { color: #27ae60; }
    
    /* Modal */
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-content {
        background-color: #fff;
        margin: 5% auto;
        width: 500px;
        max-width: 90%;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-content.modal-lg {
        width: 800px;
    }
    
    .modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        background-color: white;
        z-index: 1;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #2c3e50;
    }
    
    .close {
        color: #aaa;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .close:hover {
        color: #555;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    /* Order Detail Styles */
    .order-details {
        margin-bottom: 20px;
    }
    
    .order-info-section {
        margin-bottom: 25px;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
    }
    
    .order-info-section h4 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #2c3e50;
        font-size: 16px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .info-item {
        display: flex;
        flex-direction: column;
    }
    
    .info-label {
        font-size: 12px;
        color: #7f8c8d;
        margin-bottom: 5px;
    }
    
    .info-value {
        font-size: 14px;
        font-weight: 500;
    }
    
    .order-items-table table {
        font-size: 14px;
    }
    
    .order-items-table tfoot {
        background-color: #f8f9fa;
        font-weight: 500;
    }
    
    .text-right {
        text-align: right;
    }
    
    .order-status-section {
        margin-top: 25px;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
    }
    
    .status-update-form {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    
    .status-update-form select {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background-color: white;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    
    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        margin-top: 20px;
    }
    
    .page-btn {
        min-width: 32px;
        height: 32px;
        border: 1px solid #ddd;
        background-color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    
    .page-btn.active {
        background-color: #3498db;
        color: white;
        border-color: #3498db;
    }
    
    .page-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .page-dots {
        padding: 0 5px;
    }
    
    .text-center {
        text-align: center;
    }
</style>
`);
