// Login Form Submit Handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');
    
    if (localStorage.getItem('token')) {
        // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
        window.location.href = 'dashboard.html';
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        errorMessage.textContent = '';
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Giriş başarısız');
            }
            
            if (data.user.role !== 'admin' && data.user.role !== 'tradesman') {
                throw new Error('Bu panele erişim yetkiniz yok');
            }
            
            // Token ve kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Dashboard'a yönlendir
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});
