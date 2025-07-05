// Categories.js - Kategori yönetimi için JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const auth = checkAuth();
    if (!auth) return;
    
    // DOM elementleri
    const categoryModal = document.getElementById('category-modal');
    const deleteModal = document.getElementById('delete-modal');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryForm = document.getElementById('category-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const searchInput = document.getElementById('search-category');
    const searchBtn = document.getElementById('search-btn');
    const modalCloseButtons = document.querySelectorAll('.close');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    let currentPage = 1;
    let currentCategoryId = null;
    
    // Kategorileri listele
    loadCategories(currentPage);
    
    // Event Listeners
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
    categoryForm.addEventListener('submit', saveCategory);
    cancelBtn.addEventListener('click', closeModal);
    searchBtn.addEventListener('click', searchCategories);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCategories();
        }
    });
    
    // Modal kapatma butonları
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // Kategori silmeyi iptal et
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // Kategori silmeyi onayla
    confirmDeleteBtn.addEventListener('click', deleteCategory);
    
    // Modal dışına tıklandığında kapat
    window.addEventListener('click', function(event) {
        if (event.target === categoryModal) {
            categoryModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Kategorileri yükle
    async function loadCategories(page, searchTerm = '') {
        try {
            let url = `/api/categories?page=${page}&limit=10`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            
            const response = await apiRequest(url);
            
            const categoriesList = document.getElementById('categories-list');
            const pagination = document.getElementById('pagination');
            
            if (response.data.length === 0) {
                categoriesList.innerHTML = '<tr><td colspan="5" class="text-center">Kategori bulunamadı</td></tr>';
                pagination.innerHTML = '';
                return;
            }
            
            // Kategori listesini oluştur
            categoriesList.innerHTML = response.data.map(category => `
                <tr>
                    <td>#${category.id}</td>
                    <td>${category.name}</td>
                    <td>${category.productCount || 0}</td>
                    <td>${formatDate(category.createdAt)}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${category.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${category.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Düzenleme butonlarına event listener ekle
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-id');
                    openEditCategoryModal(categoryId);
                });
            });
            
            // Silme butonlarına event listener ekle
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-id');
                    openDeleteCategoryModal(categoryId);
                });
            });
            
            // Sayfalama
            renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
            alert('Kategoriler yüklenirken bir hata oluştu: ' + error.message);
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
                loadCategories(page, searchInput.value);
            });
        });
    }
    
    // Yeni kategori modalını aç
    function openAddCategoryModal() {
        // Form temizle
        categoryForm.reset();
        document.getElementById('category-id').value = '';
        document.getElementById('modal-title').textContent = 'Yeni Kategori Ekle';
        
        // Modal aç
        categoryModal.style.display = 'block';
    }
    
    // Kategori düzenleme modalını aç
    async function openEditCategoryModal(categoryId) {
        try {
            const category = await apiRequest(`/api/categories/${categoryId}`);
            
            // Form doldur
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            document.getElementById('modal-title').textContent = 'Kategori Düzenle';
            
            // Modal aç
            categoryModal.style.display = 'block';
            
        } catch (error) {
            console.error('Kategori detayları alınırken hata:', error);
            alert('Kategori detayları alınırken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kategori silme modalını aç
    function openDeleteCategoryModal(categoryId) {
        currentCategoryId = categoryId;
        deleteModal.style.display = 'block';
    }
    
    // Kategori kaydet (ekle/düzenle)
    async function saveCategory(e) {
        e.preventDefault();
        
        const categoryId = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value;
        const description = document.getElementById('category-description').value;
        
        try {
            if (categoryId) {
                // Kategori güncelle
                await apiRequest(`/api/categories/${categoryId}`, 'PUT', { name, description });
                alert('Kategori başarıyla güncellendi!');
            } else {
                // Yeni kategori ekle
                await apiRequest('/api/categories', 'POST', { name, description });
                alert('Kategori başarıyla oluşturuldu!');
            }
            
            // Modal kapat ve listeyi yenile
            categoryModal.style.display = 'none';
            loadCategories(currentPage, searchInput.value);
            
        } catch (error) {
            console.error('Kategori kaydedilirken hata:', error);
            alert('Kategori kaydedilirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kategori sil
    async function deleteCategory() {
        if (!currentCategoryId) return;
        
        try {
            await apiRequest(`/api/categories/${currentCategoryId}`, 'DELETE');
            
            // Modal kapat ve listeyi yenile
            deleteModal.style.display = 'none';
            loadCategories(currentPage, searchInput.value);
            
            alert('Kategori başarıyla silindi!');
            
        } catch (error) {
            console.error('Kategori silinirken hata:', error);
            alert('Kategori silinirken bir hata oluştu: ' + error.message);
        }
    }
    
    // Kategori ara
    function searchCategories() {
        const searchTerm = searchInput.value.trim();
        currentPage = 1;
        loadCategories(currentPage, searchTerm);
    }
    
    // Modal kapat
    function closeModal() {
        categoryModal.style.display = 'none';
    }
    
    // Yardımcı fonksiyonlar
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
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
    
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        margin-right: 5px;
        font-size: 14px;
    }
    
    .edit-btn { color: #3498db; }
    .delete-btn { color: #e74c3c; }
    
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
    
    .form-group input, .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
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
