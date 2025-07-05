// Stores.js - Mağaza yönetimi için JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const auth = checkAuth();
    if (!auth) return;
    
    // DOM elementleri
    const storeModal = document.getElementById('store-modal');
    const deleteModal = document.getElementById('delete-modal');
    const addStoreBtn = document.getElementById('add-store-btn');
    const storeForm = document.getElementById('store-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const searchInput = document.getElementById('search-store');
    const searchBtn = document.getElementById('search-btn');
    const statusFilter = document.getElementById('status-filter');
    const modalCloseButtons = document.querySelectorAll('.close');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    let currentPage = 1;
    let currentStoreId = null;
    
    // Mağazaları listele
    loadStores();
    
    // Esnafları yükle (select için)
    loadTradesmen();
    
    // Event Listeners
    addStoreBtn.addEventListener('click', openAddStoreModal);
    storeForm.addEventListener('submit', saveStore);
    cancelBtn.addEventListener('click', closeModal);
    searchBtn.addEventListener('click', searchStores);
    statusFilter.addEventListener('change', searchStores);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStores();
        }
    });
    
    // Modal kapatma butonları
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            storeModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // Mağaza silmeyi iptal et
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // Mağaza silmeyi onayla
    confirmDeleteBtn.addEventListener('click', deleteStore);
    
    // Modal dışına tıklandığında kapat
    window.addEventListener('click', function(event) {
        if (event.target === storeModal) {
            storeModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Mağazaları yükle
    async function loadStores(page = 1, searchTerm = '', statusFilter = 'all') {
        try {
            let url = `/api/admin/stores?page=${page}&limit=9`; // Grid için daha az mağaza
            
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            
            if (statusFilter !== 'all') {
                url += `&isOpen=${statusFilter}`;
            }
            
            const response = await apiRequest(url);
            
            const storesGrid = document.getElementById('stores-grid');
            const pagination = document.getElementById('pagination');
            
            if (response.data.length === 0) {
                storesGrid.innerHTML = '<div class="no-data">Mağaza bulunamadı</div>';
                pagination.innerHTML = '';
                return;
            }
            
            // Mağaza kartlarını oluştur
            storesGrid.innerHTML = response.data.map(store => `
                <div class="store-card">
                    <div class="store-card-header" style="background-color: ${getRandomColor()}">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="store-card-body">
                        <div class="store-name">${store.name}</div>
                        <div class="store-info"><i class="fas fa-user"></i> ${store.user ? store.user.name : 'Atanmamış'}</div>
                        <div class="store-info"><i class="fas fa-map-marker-alt"></i> ${store.address}</div>
                        <div class="store-info"><i class="fas fa-phone"></i> ${store.phone}</div>
                        <div class="store-status ${store.isOpen ? 'open' : 'closed'}">
                            ${store.isOpen ? 'Açık' : 'Kapalı'}
                        </div>
                        <div class="store-card-actions">
                            <button class="action-btn view-btn" data-id="${store.id}">
                                <i class="fas fa-eye"></i> Görüntüle
                            </button>
                            <button class="action-btn edit-btn" data-id="${store.id}">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                            <button class="action-btn delete-btn" data-id="${store.id}">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Düzenleme butonlarına event listener ekle
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const storeId = this.getAttribute('data-id');
                    openEditStoreModal(storeId);
                });
            });
            
            // Silme butonlarına event listener ekle
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const storeId = this.getAttribute('data-id');
                    openDeleteStoreModal(storeId);
                });
            });
            
            // Görüntüleme butonlarına event listener ekle
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const storeId = this.getAttribute('data-id');
                    // Mağaza detay sayfasına yönlendir (opsiyonel)
                    window.location.href = `store-detail.html?id=${storeId}`;
                });
            });
            
            // Sayfalama
            renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Mağazalar yüklenirken hata:', error);
            alert('Mağazalar yüklenirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Esnafları yükle (select için)
    async function loadTradesmen() {
        try {
            const response = await apiRequest('/api/admin/users?role=tradesman&limit=100');
            
            const storeOwnerSelect = document.getElementById('store-owner');
            
            // Esnafları dropdown'a ekle
            storeOwnerSelect.innerHTML = '<option value="">Seçiniz...</option>' + 
                response.data.map(user => `
                    <option value="${user.id}">${user.name} (${user.email})</option>
                `).join('');
            
        } catch (error) {
            console.error('Esnaflar yüklenirken hata:', error);
            alert('Esnaflar yüklenirken bir hata oluştu: ' + error.message);
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
                loadStores(page, searchInput.value, statusFilter.value);
            });
        });
    }
    
    // Yeni mağaza modalını aç
    function openAddStoreModal() {
        // Form temizle
        storeForm.reset();
        document.getElementById('store-id').value = '';
        document.getElementById('modal-title').textContent = 'Yeni Mağaza Ekle';
        
        // Modal aç
        storeModal.style.display = 'block';
    }
    
    // Mağaza düzenleme modalını aç
    async function openEditStoreModal(storeId) {
        try {
            const store = await apiRequest(`/api/stores/${storeId}`);
            
            // Form doldur
            document.getElementById('store-id').value = store.id;
            document.getElementById('store-name').value = store.name;
            document.getElementById('store-address').value = store.address;
            document.getElementById('store-phone').value = store.phone;
            document.getElementById('store-status').checked = store.isOpen;
            
            if (store.userId) {
                document.getElementById('store-owner').value = store.userId;
            }
            
            document.getElementById('modal-title').textContent = 'Mağaza Düzenle';
            
            // Modal aç
            storeModal.style.display = 'block';
            
        } catch (error) {
            console.error('Mağaza detayları alınırken hata:', error);
            alert('Mağaza detayları alınırken bir hata oluştu: ' + error.message);
        }
    }
    
    // Mağaza silme modalını aç
    function openDeleteStoreModal(storeId) {
        currentStoreId = storeId;
        deleteModal.style.display = 'block';
    }
    
    // Mağaza kaydet (ekle/düzenle)
    async function saveStore(e) {
        e.preventDefault();
        
        const storeId = document.getElementById('store-id').value;
        const name = document.getElementById('store-name').value;
        const address = document.getElementById('store-address').value;
        const phone = document.getElementById('store-phone').value;
        const userId = document.getElementById('store-owner').value;
        const isOpen = document.getElementById('store-status').checked;
        
        try {
            if (storeId) {
                // Mağaza güncelle
                await apiRequest(`/api/stores/${storeId}`, 'PUT', { 
                    name, 
                    address, 
                    phone, 
                    userId,
                    isOpen
                });
                alert('Mağaza başarıyla güncellendi!');
            } else {
                // Yeni mağaza ekle
                await apiRequest('/api/stores', 'POST', { 
                    name, 
                    address, 
                    phone, 
                    userId,
                    isOpen
                });
                alert('Mağaza başarıyla oluşturuldu!');
            }
            
            // Modal kapat ve listeyi yenile
            storeModal.style.display = 'none';
            loadStores(currentPage, searchInput.value, statusFilter.value);
            
        } catch (error) {
            console.error('Mağaza kaydedilirken hata:', error);
            alert('Mağaza kaydedilirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Mağaza sil
    async function deleteStore() {
        if (!currentStoreId) return;
        
        try {
            await apiRequest(`/api/stores/${currentStoreId}`, 'DELETE');
            
            // Modal kapat ve listeyi yenile
            deleteModal.style.display = 'none';
            loadStores(currentPage, searchInput.value, statusFilter.value);
            
            alert('Mağaza başarıyla silindi!');
            
        } catch (error) {
            console.error('Mağaza silinirken hata:', error);
            alert('Mağaza silinirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Mağaza ara
    function searchStores() {
        const searchTerm = searchInput.value.trim();
        const status = statusFilter.value;
        currentPage = 1;
        loadStores(currentPage, searchTerm, status);
    }
    
    // Modal kapat
    function closeModal() {
        storeModal.style.display = 'none';
    }
    
    // Rastgele renk üret (mağaza kartı başlığı için)
    function getRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#d35400', '#2980b9', '#27ae60', '#c0392b'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
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
    
    .danger-btn {
        padding: 8px 16px;
        background-color: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    /* Store Cards */
    .stores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .store-card {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .store-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .store-card-header {
        height: 80px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }
    
    .store-card-body {
        padding: 15px;
    }
    
    .store-name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
    }
    
    .store-info {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 5px;
    }
    
    .store-info i {
        width: 20px;
        margin-right: 5px;
    }
    
    .store-status {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        margin: 10px 0;
    }
    
    .open { background-color: #2ecc7130; color: #27ae60; }
    .closed { background-color: #e74c3c30; color: #c0392b; }
    
    .store-card-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
    
    .action-btn {
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        border: none;
    }
    
    .view-btn { background-color: #3498db20; color: #3498db; }
    .edit-btn { background-color: #f39c1220; color: #f39c12; }
    .delete-btn { background-color: #e74c3c20; color: #e74c3c; }
    
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
        margin: 10% auto;
        width: 500px;
        max-width: 90%;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
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
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #555;
    }
    
    .form-group input, .form-group textarea, .form-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .checkbox-group {
        display: flex;
        align-items: center;
    }
    
    .checkbox-group input {
        width: auto;
        margin-right: 10px;
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
    
    .no-data {
        text-align: center;
        padding: 30px;
        color: #7f8c8d;
        grid-column: 1 / -1;
    }
</style>
`);
