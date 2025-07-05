// Dashboard Data
document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const auth = checkAuth();
    if (!auth) return;
    
    try {
        // Dashboard verilerini getir
        const dashboardData = await apiRequest('/api/admin/dashboard');
        
        // İstatistik kartlarını güncelle
        document.getElementById('total-users').textContent = dashboardData.totalUsers || 0;
        document.getElementById('active-stores').textContent = dashboardData.activeStores || 0;
        document.getElementById('total-orders').textContent = dashboardData.totalOrders || 0;
        document.getElementById('total-revenue').textContent = formatCurrency(dashboardData.totalRevenue || 0);
        
        // Son siparişleri listele
        const recentOrdersElement = document.getElementById('recent-orders');
        if (dashboardData.recentOrders && dashboardData.recentOrders.length > 0) {
            recentOrdersElement.innerHTML = dashboardData.recentOrders.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.user ? order.user.name : 'Belirsiz'}</td>
                    <td>${order.store ? order.store.name : 'Mağaza Bilgisi Yok'}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td><span class="badge ${getStatusBadgeClass(order.status)}">${formatStatus(order.status)}</span></td>
                    <td>${formatDate(order.createdAt)}</td>
                </tr>
            `).join('');
        } else {
            recentOrdersElement.innerHTML = '<tr><td colspan="6" class="text-center">Henüz sipariş bulunmuyor.</td></tr>';
        }
        
        // Aktif mağazaları listele
        const activeStoresElement = document.getElementById('active-stores-list');
        if (dashboardData.activeStoresList && dashboardData.activeStoresList.length > 0) {
            activeStoresElement.innerHTML = dashboardData.activeStoresList.map(store => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">${store.name}</h5>
                                <span class="badge bg-light text-dark">${store.isOpen ? 'Açık' : 'Kapalı'}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-2"><i class="fas fa-user me-2"></i> ${store.user ? store.user.name : 'Belirsiz'}</div>
                            <div class="mb-2"><i class="fas fa-phone me-2"></i> ${store.phone || 'Telefon Yok'}</div>
                            <div><i class="fas fa-map-marker-alt me-2"></i> ${store.address || 'Adres Yok'}</div>
                        </div>
                        <div class="card-footer">
                            <a href="store-detail.html?id=${store.id}" class="btn btn-sm btn-outline-primary w-100">
                                <i class="fas fa-eye me-1"></i> Detayları Gör
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            activeStoresElement.innerHTML = '<div class="col-12 text-center py-4">Aktif mağaza bulunamadı</div>';
        }
        
    } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
        alert('Dashboard verileri yüklenirken bir hata oluştu: ' + error.message);
    }
});

// Yardımcı fonksiyonlar
function formatCurrency(amount) {
    return '₺' + parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
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

function getStatusBadgeClass(status) {
    const classMap = {
        'pending': 'bg-warning',
        'processing': 'bg-info',
        'shipped': 'bg-primary',
        'delivered': 'bg-success',
        'cancelled': 'bg-danger'
    };
    return classMap[status] || 'bg-secondary';
}
    return status;
}
