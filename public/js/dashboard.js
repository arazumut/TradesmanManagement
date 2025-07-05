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
                    <td>${'Mağaza Bilgisi Yok'}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td><span class="status ${getStatusClass(order.status)}">${formatStatus(order.status)}</span></td>
                    <td>${formatDate(order.createdAt)}</td>
                </tr>
            `).join('');
        } else {
            recentOrdersElement.innerHTML = '<tr><td colspan="6" class="text-center">Henüz sipariş bulunmuyor</td></tr>';
        }
        
        // Aktif mağazaları listele
        const activeStoresElement = document.getElementById('active-stores-list');
        if (dashboardData.activeStoresList && dashboardData.activeStoresList.length > 0) {
            activeStoresElement.innerHTML = dashboardData.activeStoresList.map(store => `
                <div class="store-card">
                    <div class="store-header">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="store-body">
                        <div class="store-name">${store.name}</div>
                        <div class="store-info"><i class="fas fa-user"></i> ${store.user ? store.user.name : 'Belirsiz'}</div>
                        <div class="store-info"><i class="fas fa-shopping-cart"></i> 0 Sipariş</div>
                        <div class="store-open-status ${store.isOpen ? 'open' : 'closed'}">
                            ${store.isOpen ? 'Açık' : 'Kapalı'}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            activeStoresElement.innerHTML = '<div class="text-center">Aktif mağaza bulunamadı</div>';
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

function getStatusClass(status) {
    return status;
}
