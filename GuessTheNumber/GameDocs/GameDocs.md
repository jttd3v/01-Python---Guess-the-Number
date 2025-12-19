# Guess the Number - Technical Documentation

> **Audience**: Senior Software Developers  
> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Defensive Programming Implementation](#6-defensive-programming-implementation)
7. [Setup & Deployment Procedures](#7-setup--deployment-procedures)
8. [Configuration Management](#8-configuration-management)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Testing Guidelines](#11-testing-guidelines)
12. [Maintenance Procedures](#12-maintenance-procedures)

---

## 1. Architecture Overview

### 1.1 System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Browser (HTML5/CSS3/Vanilla JS)                        │    │
│  │  - Responsive UI (Roboto font, RGB colors)              │    │
│  │  - Client-side validation                               │    │
│  │  - LocalStorage for best score persistence              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Flask Application (Python 3.x)                         │    │
│  │  - Route handlers                                       │    │
│  │  - Input validation                                     │    │
│  │  - Error handling                                       │    │
│  │  - Database abstraction                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ pyodbc/ODBC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Microsoft SQL Server                                   │    │
│  │  - Database: CodingPortfolio                            │    │
│  │  - Table: GameResults                                   │    │
│  │  - Stored Procedures                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **Explicit > Implicit** | All errors are caught and handled explicitly. No silent failures. |
| **Simple > Complex** | Single-file backend, vanilla JS frontend. No unnecessary frameworks. |
| **Readability** | Code reads like English. Clear naming conventions throughout. |
| **One Obvious Way** | Standard library usage (random.randint, Math.floor). |

---

## 2. Project Structure

```
GuessTheNumber/
├── app.py                      # Flask application entry point
├── requirements.txt            # Python dependencies
│
├── static/
│   ├── css/
│   │   └── style.css          # Stylesheet (RGB colors, Roboto)
│   └── js/
│       └── game.js            # Game logic (defensive programming)
│
├── templates/
│   └── index.html             # Main game template
│
├── database/
│   └── setup_database.sql     # MSSQL setup script
│
└── GameDocs/
    └── GameDocs.md            # This documentation
```

### 2.1 File Responsibilities

| File | Responsibility | LOC (approx) |
|------|----------------|--------------|
| `app.py` | HTTP routing, DB operations, validation | ~200 |
| `game.js` | Client-side game logic, DOM manipulation | ~280 |
| `style.css` | Visual styling, responsive design | ~200 |
| `index.html` | Semantic HTML structure | ~50 |
| `setup_database.sql` | Database schema, stored procedures | ~180 |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Semantic markup |
| CSS3 | - | Styling (RGB only, no gradients) |
| Vanilla JavaScript | ES6+ | Game logic |
| Google Fonts | - | Roboto typeface |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.8+ | Runtime |
| Flask | 2.3+ | Web framework |
| pyodbc | 4.0+ | MSSQL connectivity |

### 3.3 Database

| Technology | Version | Purpose |
|------------|---------|---------|
| Microsoft SQL Server | 2019+ | Data persistence |
| ODBC Driver | 17+ | Database connectivity |

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     GameResults                           │
├──────────────────────────────────────────────────────────┤
│ PK │ Id           │ INT IDENTITY    │ NOT NULL           │
│    │ GameName     │ NVARCHAR(100)   │ NOT NULL           │
│    │ Attempts     │ INT             │ NOT NULL (1-1000)  │
│    │ Won          │ BIT             │ NOT NULL DEFAULT 0 │
│    │ PlayedAt     │ DATETIME2       │ NOT NULL           │
│    │ CreatedAt    │ DATETIME2       │ NOT NULL           │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PK_GameResults` | Id | Clustered | Primary key |
| `IX_GameResults_GameName` | GameName | Non-clustered | Filter by game |
| `IX_GameResults_PlayedAt` | PlayedAt DESC | Non-clustered | Date queries |

### 4.3 Constraints

| Constraint | Type | Rule |
|------------|------|------|
| `CK_GameResults_Attempts` | CHECK | Attempts BETWEEN 1 AND 1000 |
| `CK_GameResults_GameName` | CHECK | LEN(GameName) > 0 |

### 4.4 Stored Procedures

#### `usp_InsertGameResult`
```sql
EXEC usp_InsertGameResult 
    @GameName = 'GuessTheNumber',
    @Attempts = 7,
    @Won = 1,
    @PlayedAt = NULL  -- Defaults to GETUTCDATE()
```

#### `usp_GetGameStats`
```sql
EXEC usp_GetGameStats @GameName = 'GuessTheNumber'
-- Returns: TotalGames, GamesWon, AvgAttempts, BestScore, WorstScore
```

---

## 5. API Specification

### 5.1 Endpoints

#### `GET /`
**Description**: Serve the main game page  
**Response**: HTML page

---

#### `POST /api/game/result`
**Description**: Save a completed game result  

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
    "attempts": 7,
    "won": true,
    "timestamp": "2024-12-19T10:30:00.000Z"
}
```

**Validation Rules**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| attempts | integer | Yes | 1 ≤ x ≤ 1000 |
| won | boolean | Yes | true/false |
| timestamp | string | No | ISO 8601 format |

**Response (Success - 201)**:
```json
{
    "success": true,
    "message": "Game result saved"
}
```

**Response (Error - 400)**:
```json
{
    "success": false,
    "error": "Invalid attempts value"
}
```

---

#### `GET /api/game/stats`
**Description**: Retrieve game statistics

**Response (200)**:
```json
{
    "success": true,
    "stats": {
        "total_games": 42,
        "avg_attempts": 7.5,
        "best_score": 3
    }
}
```

---

## 6. Defensive Programming Implementation

### 6.1 Frontend (JavaScript)

| Pattern | Implementation | Location |
|---------|----------------|----------|
| **Input Validation** | `parseGuess()` returns null instead of NaN | `game.js:138` |
| **DOM Safety** | `cacheDOMElements()` validates all elements exist | `game.js:56` |
| **Error Boundaries** | try/catch around localStorage operations | `game.js:245` |
| **Type Checking** | Explicit typeof checks before operations | Throughout |
| **Sanitization** | `sanitizeInput()` removes non-numeric chars | `game.js:218` |

#### Code Example - Defensive Input Parsing
```javascript
function parseGuess(inputValue) {
    // Defensive: Handle empty or whitespace-only input
    if (typeof inputValue !== 'string' || inputValue.trim() === '') {
        return null;
    }

    const parsed = parseInt(inputValue, 10);

    // Explicit: Check for NaN
    if (Number.isNaN(parsed)) {
        return null;
    }

    return parsed;
}
```

### 6.2 Backend (Python)

| Pattern | Implementation | Location |
|---------|----------------|----------|
| **Type Hints** | All functions have type annotations | Throughout |
| **Null Checks** | Connection returns None, not exception | `app.py:82` |
| **Input Validation** | Explicit field validation in routes | `app.py:140` |
| **Resource Cleanup** | `finally` blocks close connections | `app.py:115` |
| **Bounded Values** | Range checks on numeric inputs | `app.py:160` |

#### Code Example - Defensive Database Query
```python
def execute_query(query: str, params: tuple = (), fetch: bool = False) -> Tuple[bool, Any]:
    connection = get_db_connection()
    
    if connection is None:
        return (False, "Database connection unavailable")
    
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        result = cursor.fetchall() if fetch else cursor.rowcount
        return (True, result)
    except pyodbc.Error as db_error:
        logger.error(f"Query execution failed: {db_error}")
        return (False, str(db_error))
    finally:
        if connection:
            connection.close()
```

### 6.3 Database (SQL)

| Pattern | Implementation |
|---------|----------------|
| **Existence Checks** | `IF NOT EXISTS` before CREATE statements |
| **Input Validation** | Parameter validation in stored procedures |
| **Constraints** | CHECK constraints on columns |
| **Error Codes** | Stored procedures return status codes |

---

## 7. Setup & Deployment Procedures

### 7.1 Prerequisites

- [ ] Python 3.8 or higher installed
- [ ] Microsoft SQL Server 2019 or higher
- [ ] ODBC Driver 17 for SQL Server installed
- [ ] Network access between application server and database server

### 7.2 Database Setup

```powershell
# Step 1: Connect to SQL Server using SSMS or sqlcmd
sqlcmd -S localhost -E

# Step 2: Execute the setup script
:r "C:\path\to\GuessTheNumber\database\setup_database.sql"
GO

# Step 3: Verify installation
USE CodingPortfolio;
SELECT * FROM sys.tables WHERE name = 'GameResults';
```

### 7.3 Application Setup

```powershell
# Step 1: Navigate to project directory
cd "C:\path\to\GuessTheNumber"

# Step 2: Create virtual environment
python -m venv venv

# Step 3: Activate virtual environment
.\venv\Scripts\Activate.ps1

# Step 4: Install dependencies
pip install -r requirements.txt

# Step 5: Configure environment variables (optional)
$env:DB_SERVER = "localhost"
$env:FLASK_DEBUG = "false"

# Step 6: Run the application
python app.py
```

### 7.4 Verification Checklist

- [ ] Application starts without errors on port 5000
- [ ] Game page loads at http://localhost:5000
- [ ] Game logic functions (guess, feedback, win detection)
- [ ] New game resets state correctly
- [ ] Game results persist to database (check GameResults table)

---

## 8. Configuration Management

### 8.1 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_SERVER` | No | localhost | SQL Server hostname |
| `DB_DRIVER` | No | {ODBC Driver 17...} | ODBC driver name |
| `DB_USERNAME` | No | - | SQL auth username |
| `DB_PASSWORD` | No | - | SQL auth password |
| `FLASK_DEBUG` | No | false | Enable debug mode |
| `SECRET_KEY` | No | dev-key-... | Flask secret key |

### 8.2 Production Configuration

```powershell
# Production environment setup
$env:DB_SERVER = "prod-sql-server.company.com"
$env:DB_USERNAME = "app_user"
$env:DB_PASSWORD = "secure_password_here"
$env:FLASK_DEBUG = "false"
$env:SECRET_KEY = "production-random-secret-key-32chars"
```

---

## 9. Error Handling Strategy

### 9.1 Error Response Format

All API errors follow this structure:
```json
{
    "success": false,
    "error": "Human-readable error message"
}
```

### 9.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET requests |
| 201 | Created | Successful POST (record created) |
| 400 | Bad Request | Validation errors |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Unexpected server errors |

### 9.3 Logging Strategy

```python
# Log levels used:
# - INFO: Application startup, successful operations
# - WARNING: Non-critical issues (localStorage unavailable)
# - ERROR: Database failures, unexpected exceptions
```

---

## 10. Security Considerations

### 10.1 Implemented Measures

| Measure | Implementation |
|---------|----------------|
| Input Sanitization | Client-side (regex) + Server-side (type checks) |
| SQL Injection Prevention | Parameterized queries only |
| XSS Prevention | No dynamic HTML insertion |
| CSRF | Not required (no session-based auth) |

### 10.2 Production Recommendations

- [ ] Enable HTTPS (TLS 1.2+)
- [ ] Set secure SECRET_KEY from environment
- [ ] Use SQL Server authentication (not Windows auth in prod)
- [ ] Implement rate limiting on API endpoints
- [ ] Add Content-Security-Policy headers
- [ ] Remove debug mode in production

---

## 11. Testing Guidelines

### 11.1 Manual Testing Checklist

**Game Logic**:
- [ ] Valid guess (1-100) shows correct feedback
- [ ] Invalid guess (text) shows error message
- [ ] Out of range (0, 101) shows error message
- [ ] Win detection works correctly
- [ ] Attempt counter increments properly
- [ ] Best score updates when beaten

**UI/UX**:
- [ ] Responsive layout works on mobile (< 480px)
- [ ] Enter key submits guess
- [ ] Input focuses after guess
- [ ] New Game resets all state

**API**:
- [ ] POST /api/game/result accepts valid JSON
- [ ] POST rejects invalid content-type
- [ ] POST validates attempts range
- [ ] GET /api/game/stats returns correct format

### 11.2 Database Verification

```sql
-- Check recent game results
SELECT TOP 10 * FROM GameResults 
WHERE GameName = 'GuessTheNumber'
ORDER BY PlayedAt DESC;

-- Verify statistics
EXEC usp_GetGameStats @GameName = 'GuessTheNumber';
```

---

## 12. Maintenance Procedures

### 12.1 Log Rotation

```powershell
# Application logs are written to stdout
# Configure your process manager (systemd, IIS, etc.) for log rotation
```

### 12.2 Database Maintenance

```sql
-- Weekly: Update statistics
UPDATE STATISTICS dbo.GameResults;

-- Monthly: Rebuild indexes if fragmentation > 30%
ALTER INDEX ALL ON dbo.GameResults REBUILD;

-- Archive old records (optional)
DELETE FROM GameResults WHERE PlayedAt < DATEADD(YEAR, -1, GETUTCDATE());
```

### 12.3 Dependency Updates

```powershell
# Check for outdated packages
pip list --outdated

# Update specific package
pip install --upgrade flask

# Regenerate requirements.txt
pip freeze > requirements.txt
```

---

## Appendix A: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Database connection unavailable" | ODBC driver missing | Install ODBC Driver 17 |
| Game results not saving | Table doesn't exist | Run setup_database.sql |
| CSS not loading | Flask static path | Check url_for() syntax |
| "pyodbc not found" | Missing dependency | `pip install pyodbc` |

---

## Appendix B: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial release |

---

*End of Technical Documentation*
