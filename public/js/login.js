document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.textContent = '';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            errorDiv.textContent = data.error || 'Login fehlgeschlagen';
        }
    } catch (err) {
        console.error('Login error:', err);
        errorDiv.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    }
});
