// Authentication helper functions
const Auth = {
    token: null,
    user: null,

    // Initialize - check if user is logged in
    async init() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.updateUI();
                return true;
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        }
        return false;
    },

    // Update UI based on authentication status
    updateUI() {
        const authInfo = document.getElementById('auth-info');
        const usernameDisplay = document.getElementById('username-display');
        
        if (this.user && authInfo && usernameDisplay) {
            authInfo.style.display = 'block';
            usernameDisplay.textContent = `Willkommen, ${this.user.username}!`;
        }
    },

    // Logout
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.user = null;
            window.location.href = '/login.html';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }
};

// Initialize authentication
if (document.getElementById('auth-info')) {
    Auth.init();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }
    
    // Setup profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }
}
