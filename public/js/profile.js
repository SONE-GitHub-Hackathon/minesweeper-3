// Load profile data
async function loadProfile() {
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        
        // Update profile info
        document.getElementById('profile-username').textContent = data.user.username;
        document.getElementById('profile-created').textContent = new Date(data.user.createdAt).toLocaleDateString('de-DE');
        
        // Update statistics
        document.getElementById('total-games').textContent = data.stats.totalGames;
        document.getElementById('won-games').textContent = data.stats.wonGames;
        document.getElementById('win-rate').textContent = data.stats.winRate.toFixed(1) + '%';
        document.getElementById('best-time').textContent = data.stats.bestTime ? 
            `${data.stats.bestTime}s` : '-';
    } catch (err) {
        console.error('Load profile error:', err);
        alert('Fehler beim Laden des Profils');
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/profile/leaderboard');
        const data = await response.json();
        
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        
        data.leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.won_games}</td>
                <td>${entry.win_rate.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Load leaderboard error:', err);
    }
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login.html';
    } catch (err) {
        console.error('Logout error:', err);
    }
});

// Initialize
loadProfile();
loadLeaderboard();
