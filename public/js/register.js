document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const errorDiv = document.getElementById('register-error');
    
    errorDiv.textContent = '';
    
    // Validation
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Passwörter stimmen nicht überein';
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        errorDiv.textContent = 'Benutzername muss 3-20 Zeichen lang sein';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Passwort muss mindestens 6 Zeichen lang sein';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
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
            errorDiv.textContent = data.error || 'Registrierung fehlgeschlagen';
        }
    } catch (err) {
        console.error('Registration error:', err);
        errorDiv.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    }
});
