# Minesweeper - Multiplayer Edition

Ein vollständig ausgestattetes Minesweeper-Spiel mit Multiplayer-Modus und User-Management-System.

## Features

### User Management
- **Benutzerregistrierung und Login**: Sichere Authentifizierung mit JWT-Tokens
- **Passwortsicherheit**: Passwörter werden mit bcrypt gehasht
- **Benutzerprofil**: Zeigt Spielstatistiken und persönliche Bestleistungen
- **Bestenliste**: Globale Rangliste der besten Spieler

### Spielmodi
- **Einzelspieler**: Klassisches Minesweeper in drei Schwierigkeitsgraden
  - Einfach: 9x9 mit 10 Minen
  - Mittel: 16x16 mit 40 Minen
  - Schwer: 16x30 mit 99 Minen
- **Multiplayer**: Kompetitiver Modus für 2-4 Spieler
  - Identische Spielfelder für alle Spieler
  - Echtzeit-Fortschrittsanzeige
  - Wer zuerst das Board löst, gewinnt
  - Chat-Funktion in der Lobby

### Technische Features
- **Echtzeit-Kommunikation**: WebSocket-Verbindungen mit Socket.io
- **Sicherheit**: Helmet.js, CSRF-Schutz, Rate Limiting, XSS-Schutz
- **Datenbank**: SQLite für Benutzerdaten und Spielstatistiken
- **Responsive Design**: Funktioniert auf Desktop und mobilen Geräten

## Installation

### Voraussetzungen
- Node.js (v14 oder höher)
- npm oder yarn

### Schritte

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd minesweeper-3
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   ```
   Bearbeiten Sie `.env` und ändern Sie `JWT_SECRET` zu einem sicheren Wert.

4. **Server starten**
   ```bash
   npm start
   ```
   
   Für Entwicklung mit Auto-Reload:
   ```bash
   npm run dev
   ```

5. **Browser öffnen**
   Öffnen Sie http://localhost:3000

## Projektstruktur

```
minesweeper-3/
├── database/               # Datenbankdateien
│   ├── init.js            # Datenbankinitialisierung
│   ├── schema.sql         # Datenbankschema
│   └── minesweeper.db     # SQLite-Datenbank (wird automatisch erstellt)
├── server/                 # Backend-Code
│   ├── models/            # Datenmodelle
│   │   ├── User.js        # Benutzermodell
│   │   ├── Game.js        # Spielmodell
│   │   └── GameRoom.js    # Spielraummodell
│   ├── routes/            # API-Routen
│   │   ├── auth.js        # Authentifizierung
│   │   ├── profile.js     # Benutzerprofil
│   │   └── game.js        # Spielergebnisse
│   ├── middleware/        # Express-Middleware
│   │   └── auth.js        # JWT-Authentifizierung
│   └── server.js          # Hauptserver mit Socket.io
├── public/                 # Frontend-Dateien
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Hauptstyles
│   │   ├── auth.css       # Login/Register-Styles
│   │   └── profile.css    # Profil-Styles
│   ├── js/                # JavaScript-Dateien
│   │   ├── game.js        # Spiellogik
│   │   ├── auth.js        # Authentifizierungshelfer
│   │   ├── multiplayer.js # Multiplayer-Logik
│   │   ├── login.js       # Login-Seite
│   │   ├── register.js    # Registrierungsseite
│   │   └── profile.js     # Profil-Seite
│   ├── index.html         # Hauptspielseite
│   ├── login.html         # Login-Seite
│   ├── register.html      # Registrierungsseite
│   └── profile.html       # Profil-Seite
├── .env.example           # Beispiel-Umgebungsvariablen
├── .gitignore            # Git-Ignore-Datei
├── package.json          # npm-Konfiguration
└── README.md             # Diese Datei
```

## API-Dokumentation

### Authentifizierung

#### POST /api/auth/register
Registriert einen neuen Benutzer.

**Request Body:**
```json
{
  "username": "string (3-20 Zeichen)",
  "password": "string (mindestens 6 Zeichen)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

#### POST /api/auth/login
Meldet einen Benutzer an.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

#### POST /api/auth/logout
Meldet den aktuellen Benutzer ab.

#### GET /api/auth/me
Gibt Informationen über den aktuell angemeldeten Benutzer zurück.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Profil

#### GET /api/profile
Gibt Benutzerprofil mit Statistiken zurück (Authentifizierung erforderlich).

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "stats": {
    "totalGames": 10,
    "wonGames": 5,
    "bestTime": 120,
    "winRate": 50.0
  }
}
```

#### GET /api/profile/leaderboard
Gibt die globale Bestenliste zurück.

**Response:**
```json
{
  "leaderboard": [
    {
      "username": "string",
      "total_games": 10,
      "won_games": 8,
      "win_rate": 80.0
    }
  ]
}
```

### Spiel

#### POST /api/game/result
Speichert ein Spielergebnis (Authentifizierung erforderlich).

**Request Body:**
```json
{
  "difficulty": "easy|medium|hard",
  "won": true,
  "timeSeconds": 120,
  "gameMode": "single|multiplayer"
}
```

#### GET /api/game/history
Gibt die letzten Spiele des Benutzers zurück (Authentifizierung erforderlich).

## WebSocket-Events

### Client → Server

- **create-room**: Erstellt einen neuen Spielraum
  ```javascript
  socket.emit('create-room', { name: 'Mein Raum', difficulty: 'easy' })
  ```

- **join-room**: Tritt einem Spielraum bei
  ```javascript
  socket.emit('join-room', { roomId: 'room_123' })
  ```

- **leave-room**: Verlässt den aktuellen Raum
  ```javascript
  socket.emit('leave-room')
  ```

- **get-rooms**: Fordert Liste aller Räume an
  ```javascript
  socket.emit('get-rooms')
  ```

- **start-game**: Startet das Spiel (nur Host)
  ```javascript
  socket.emit('start-game')
  ```

- **update-progress**: Sendet Fortschritt
  ```javascript
  socket.emit('update-progress', { progress: 50 })
  ```

- **game-finished**: Meldet Spielende
  ```javascript
  socket.emit('game-finished', { won: true, time: 120 })
  ```

- **chat-message**: Sendet Chat-Nachricht
  ```javascript
  socket.emit('chat-message', { message: 'Hallo!' })
  ```

### Server → Client

- **room-created**: Raum wurde erstellt
- **player-joined**: Spieler ist beigetreten
- **player-left**: Spieler hat den Raum verlassen
- **rooms-list**: Liste aller Räume
- **rooms-updated**: Räume wurden aktualisiert
- **game-started**: Spiel wurde gestartet
- **progress-updated**: Fortschritt eines Spielers
- **player-finished**: Spieler hat das Spiel beendet
- **chat-message**: Chat-Nachricht empfangen
- **error**: Fehlermeldung

## Sicherheit

Das Projekt implementiert mehrere Sicherheitsmaßnahmen:

1. **Passwort-Hashing**: Verwendung von bcrypt mit Salt
2. **JWT-Tokens**: Sichere Session-Verwaltung
3. **HTTP-Security-Headers**: Helmet.js für zusätzliche Sicherheit
4. **Rate Limiting**: Schutz vor Brute-Force-Angriffen
5. **Input-Validierung**: Validierung aller Benutzereingaben
6. **CSRF-Schutz**: SameSite-Cookie-Attribut
7. **XSS-Schutz**: Content Security Policy

## Entwicklung

### Debugging
Setzen Sie `NODE_ENV=development` in der `.env` Datei für detaillierte Logs.

### Datenbank zurücksetzen
Löschen Sie `database/minesweeper.db` und starten Sie den Server neu.

## Lizenz

ISC