# Guess the Number

A simple web-based number guessing game built with Python Flask.

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![Author](https://img.shields.io/badge/Author-jttd3v-blue)

## Author

**jttd3v**

## Quick Start

1. **Navigate to the project folder:**
   ```
   cd GuessTheNumber
   ```

2. **Create and activate a virtual environment (recommended):**
   ```
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```
   python app.py
   ```

5. **Open in browser:**
   ```
   http://localhost:5000
   ```

## How to Play

1. The computer picks a random number between 1 and 100
2. Enter your guess in the input field
3. Click "Guess" or press Enter
4. Follow the hints: "Too low" or "Too high"
5. Keep guessing until you find the correct number!
6. 🎆 Win and enjoy the fireworks and confetti celebration!

## Project Structure

```
GuessTheNumber/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── templates/          # HTML templates
├── static/             # CSS and JavaScript
├── database/           # MSSQL setup scripts
└── GameDocs/           # Technical documentation
```

## Requirements

- Python 3.8+
- Flask
- pyodbc (optional, for database features)

---

© 2024 jttd3v. All rights reserved.
