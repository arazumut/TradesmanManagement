// Auth Utilities
// Token ve kullanıcı bilgilerini kontrol et, gerekirse login sayfasına yönlendir
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Admin veya Esnaf değilse yetkisiz
    if (user.role !== 'admin' && user.role !== 'tradesman') {
        window.location.href = 'login.html';
        return false;
    }
    
    // Kullanıcı adını göster
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    return { token, user };
}

// API istekleri için yardımcı fonksiyon
async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        throw new Error('Oturum süresi doldu');
    }
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
        if (response.status === 401) {
            // Token geçersiz, çıkış yap
            logout();
            window.location.href = 'login.html';
        }
        throw new Error(data.message || 'Bir hata oluştu');
    }
    
    return data;
}

// Çıkış yapma fonksiyonu
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    // Kimlik kontrolü
    checkAuth();
    
    // Çıkış butonu
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});
