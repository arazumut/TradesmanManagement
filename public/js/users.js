// Users.js - Kullanıcı yönetimi için JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const auth = checkAuth();
    if (!auth) return;
    
    // DOM elementleri
    const userModal = document.getElementById('user-modal');
    const deleteModal = document.getElementById('delete-modal');
    const addUserBtn = document.getElementById('add-user-btn');
    const userForm = document.getElementById('user-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const searchInput = document.getElementById('search-user');
    const searchBtn = document.getElementById('search-btn');
    const roleFilter = document.getElementById('role-filter');
    const modalCloseButtons = document.querySelectorAll('.close');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    let currentPage = 1;
    let currentUserId = null;
    
    // Kullanıcıları listele
    loadUsers();
    
    // Event Listeners
    addUserBtn.addEventListener('click', openAddUserModal);
    userForm.addEventListener('submit', saveUser);
    cancelBtn.addEventListener('click', closeModal);
    searchBtn.addEventListener('click', searchUsers);
    roleFilter.addEventListener('change', searchUsers);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
    
    // Modal kapatma butonları
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            userModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // Kullanıcı silmeyi iptal et
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // Kullanıcı silmeyi onayla
    confirmDeleteBtn.addEventListener('click', deleteUser);
    
    // Modal dışına tıklandığında kapat
    window.addEventListener('click', function(event) {
        if (event.target === userModal) {
            userModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Kullanıcıları yükle
    async function loadUsers(page = 1, searchTerm = '', roleFilter = 'all') {
        try {
            let url = `/api/admin/users?page=${page}&limit=10`;
            
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            
            if (roleFilter !== 'all') {
                url += `&role=${roleFilter}`;
            }
            
            const response = await apiRequest(url);
            
            const usersList = document.getElementById('users-list');
            const pagination = document.getElementById('pagination');
            
            if (response.data.length === 0) {
                usersList.innerHTML = '<tr><td colspan="8" class="text-center">Kullanıcı bulunamadı</td></tr>';
                pagination.innerHTML = '';
                return;
            }
            
            // Kullanıcı listesini oluştur
            usersList.innerHTML = response.data.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${formatRole(user.role)}</span></td>
                    <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Aktif' : 'Pasif'}</span></td>
                    <td>${user.store ? user.store.name : '-'}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn ${user.role === 'admin' ? 'disabled' : 'delete-btn'}" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Düzenleme butonlarına event listener ekle
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    openEditUserModal(userId);
                });
            });
            
            // Silme butonlarına event listener ekle
            document.querySelectorAll('.delete-btn:not(.disabled)').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    openDeleteUserModal(userId);
                });
            });
            
            // Sayfalama
            renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Kullanıcılar yüklenirken hata:', error);
            alert('Kullanıcılar yüklenirken bir hata oluştu: ' + error.message);
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
                loadUsers(page, searchInput.value, roleFilter.value);
            });
        });
    }
    
    // Yeni kullanıcı modalını aç
    function openAddUserModal() {
        // Form temizle
        userForm.reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-password').required = true; // Yeni kullanıcı için şifre zorunlu
        document.getElementById('modal-title').textContent = 'Yeni Kullanıcı Ekle';
        
        // Modal aç
        userModal.style.display = 'block';
    }
    
    // Kullanıcı düzenleme modalını aç
    async function openEditUserModal(userId) {
        try {
            const user = await apiRequest(`/api/admin/users/${userId}`);
            
            // Form doldur
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-password').required = false; // Düzenleme için şifre opsiyonel
            document.getElementById('user-password').value = '';
            document.getElementById('user-phone').value = user.phone || '';
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-address').value = user.address || '';
            document.getElementById('user-status').checked = user.isActive;
            
            document.getElementById('modal-title').textContent = 'Kullanıcı Düzenle';
            
            // Admin kullanıcı ise rol değiştirmeyi engelle
            if (user.role === 'admin') {
                document.getElementById('user-role').disabled = true;
            } else {
                document.getElementById('user-role').disabled = false;
            }
            
            // Modal aç
            userModal.style.display = 'block';
            
        } catch (error) {
            console.error('Kullanıcı detayları alınırken hata:', error);
            alert('Kullanıcı detayları alınırken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kullanıcı silme modalını aç
    function openDeleteUserModal(userId) {
        currentUserId = userId;
        deleteModal.style.display = 'block';
    }
    
    // Kullanıcı kaydet (ekle/düzenle)
    async function saveUser(e) {
        e.preventDefault();
        
        const userId = document.getElementById('user-id').value;
        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const phone = document.getElementById('user-phone').value;
        const role = document.getElementById('user-role').value;
        const address = document.getElementById('user-address').value;
        const isActive = document.getElementById('user-status').checked;
        
        try {
            if (userId) {
                // Kullanıcı güncelle
                const userData = { 
                    name, 
                    email, 
                    phone, 
                    role,
                    address,
                    isActive
                };
                
                // Şifre sadece değiştirilmek isteniyorsa ekle
                if (password) {
                    userData.password = password;
                }
                
                await apiRequest(`/api/admin/users/${userId}`, 'PUT', userData);
                alert('Kullanıcı başarıyla güncellendi!');
            } else {
                // Yeni kullanıcı ekle
                await apiRequest('/api/admin/users', 'POST', { 
                    name, 
                    email, 
                    password,
                    phone, 
                    role,
                    address,
                    isActive
                });
                alert('Kullanıcı başarıyla oluşturuldu!');
            }
            
            // Modal kapat ve listeyi yenile
            userModal.style.display = 'none';
            loadUsers(currentPage, searchInput.value, roleFilter.value);
            
        } catch (error) {
            console.error('Kullanıcı kaydedilirken hata:', error);
            alert('Kullanıcı kaydedilirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kullanıcı sil
    async function deleteUser() {
        if (!currentUserId) return;
        
        try {
            await apiRequest(`/api/admin/users/${currentUserId}`, 'DELETE');
            
            // Modal kapat ve listeyi yenile
            deleteModal.style.display = 'none';
            loadUsers(currentPage, searchInput.value, roleFilter.value);
            
            alert('Kullanıcı başarıyla silindi!');
            
        } catch (error) {
            console.error('Kullanıcı silinirken hata:', error);
            alert('Kullanıcı silinirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kullanıcı ara
    function searchUsers() {
        const searchTerm = searchInput.value.trim();
        const role = roleFilter.value;
        currentPage = 1;
        loadUsers(currentPage, searchTerm, role);
    }
    
    // Modal kapat
    function closeModal() {
        userModal.style.display = 'none';
    }
    
    // Yardımcı fonksiyonlar
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    }
    
    function formatRole(role) {
        const roleMap = {
            'admin': 'Admin',
            'tradesman': 'Esnaf',
            'customer': 'Müşteri'
        };
        return roleMap[role] || role;
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
    
    .role-badge, .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .role-badge.admin { background-color: #9b59b630; color: #8e44ad; }
    .role-badge.tradesman { background-color: #3498db30; color: #2980b9; }
    .role-badge.customer { background-color: #2ecc7130; color: #27ae60; }
    
    .status-badge.active { background-color: #2ecc7130; color: #27ae60; }
    .status-badge.inactive { background-color: #e74c3c30; color: #c0392b; }
    
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        margin-right: 5px;
        font-size: 14px;
    }
    
    .edit-btn { color: #3498db; }
    .delete-btn { color: #e74c3c; }
    
    .action-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
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
    
    .text-center {
        text-align: center;
    }
</style>
`);
