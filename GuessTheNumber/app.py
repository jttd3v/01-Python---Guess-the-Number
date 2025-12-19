"""
Guess the Number - Flask Backend Application

Principles Applied:
- Explicit is better than implicit (defensive programming, type hints)
- Simple is better than complex (minimal Flask setup)
- Readability counts (clear function names, docstrings)
"""

import os
import random
import logging
from datetime import datetime
from typing import Optional, Tuple, Any
from functools import wraps

from flask import Flask, render_template, request, jsonify
import pyodbc

# =============================================================================
# Configuration
# =============================================================================

class Config:
    """Application configuration - Explicit over implicit."""
    
    # Database Configuration
    DB_SERVER: str = os.environ.get('DB_SERVER', 'localhost')
    DB_NAME: str = 'CodingPortfolio'
    DB_DRIVER: str = os.environ.get('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
    
    # Use Windows Authentication by default, or SQL Auth if credentials provided
    DB_USERNAME: Optional[str] = os.environ.get('DB_USERNAME')
    DB_PASSWORD: Optional[str] = os.environ.get('DB_PASSWORD')
    
    # Game Configuration
    MIN_NUMBER: int = 1
    MAX_NUMBER: int = 100
    
    # Flask Configuration
    DEBUG: bool = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')


# =============================================================================
# Logging Setup
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# Flask Application Factory
# =============================================================================

def create_app() -> Flask:
    """
    Application factory pattern.
    Simple: Single responsibility - create and configure the app.
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    register_routes(app)
    register_error_handlers(app)
    
    return app


# =============================================================================
# Database Connection
# =============================================================================

def get_db_connection() -> Optional[pyodbc.Connection]:
    """
    Create database connection with defensive error handling.
    
    Returns:
        pyodbc.Connection or None if connection fails
    
    Defensive: Returns None instead of raising exception to calling code.
    """
    try:
        # Build connection string explicitly
        if Config.DB_USERNAME and Config.DB_PASSWORD:
            # SQL Server Authentication
            connection_string = (
                f"DRIVER={Config.DB_DRIVER};"
                f"SERVER={Config.DB_SERVER};"
                f"DATABASE={Config.DB_NAME};"
                f"UID={Config.DB_USERNAME};"
                f"PWD={Config.DB_PASSWORD};"
            )
        else:
            # Windows Authentication
            connection_string = (
                f"DRIVER={Config.DB_DRIVER};"
                f"SERVER={Config.DB_SERVER};"
                f"DATABASE={Config.DB_NAME};"
                f"Trusted_Connection=yes;"
            )
        
        connection = pyodbc.connect(connection_string, timeout=5)
        return connection
        
    except pyodbc.Error as db_error:
        logger.error(f"Database connection failed: {db_error}")
        return None
    except Exception as error:
        logger.error(f"Unexpected error connecting to database: {error}")
        return None


def execute_query(query: str, params: tuple = (), fetch: bool = False) -> Tuple[bool, Any]:
    """
    Execute a database query with defensive error handling.
    
    Args:
        query: SQL query string with parameter placeholders
        params: Tuple of parameters to bind
        fetch: Whether to fetch results
    
    Returns:
        Tuple of (success: bool, result: Any)
        
    Defensive: Always returns a tuple, never raises to caller.
    """
    connection = get_db_connection()
    
    if connection is None:
        return (False, "Database connection unavailable")
    
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        
        if fetch:
            result = cursor.fetchall()
        else:
            connection.commit()
            result = cursor.rowcount
        
        return (True, result)
        
    except pyodbc.Error as db_error:
        logger.error(f"Query execution failed: {db_error}")
        return (False, str(db_error))
        
    finally:
        # Explicit resource cleanup
        if connection:
            connection.close()


# =============================================================================
# Route Registration
# =============================================================================

def register_routes(app: Flask) -> None:
    """Register all application routes. Simple: One place for all routes."""
    
    @app.route('/')
    def index():
        """Serve the main game page."""
        return render_template('index.html')
    
    @app.route('/api/game/result', methods=['POST'])
    def save_game_result():
        """
        Save game result to database.
        
        Defensive: Validate all input before processing.
        """
        # Defensive: Validate request content type
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Defensive: Get JSON with error handling
        try:
            data = request.get_json()
        except Exception:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON payload'
            }), 400
        
        # Defensive: Validate required fields
        if data is None:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        attempts = data.get('attempts')
        won = data.get('won')
        
        # Explicit validation
        if attempts is None or not isinstance(attempts, int):
            return jsonify({
                'success': False,
                'error': 'Invalid attempts value'
            }), 400
        
        if attempts < 1 or attempts > 1000:  # Reasonable bounds
            return jsonify({
                'success': False,
                'error': 'Attempts out of valid range'
            }), 400
        
        if won is None or not isinstance(won, bool):
            return jsonify({
                'success': False,
                'error': 'Invalid won value'
            }), 400
        
        # Save to database
        query = """
            INSERT INTO GameResults (GameName, Attempts, Won, PlayedAt)
            VALUES (?, ?, ?, ?)
        """
        params = ('GuessTheNumber', attempts, won, datetime.utcnow())
        
        success, result = execute_query(query, params)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Game result saved'
            }), 201
        else:
            # Log the error but return generic message to client
            logger.error(f"Failed to save game result: {result}")
            return jsonify({
                'success': False,
                'error': 'Failed to save result'
            }), 500
    
    @app.route('/api/game/stats', methods=['GET'])
    def get_game_stats():
        """
        Get game statistics from database.
        
        Defensive: Handle missing data gracefully.
        """
        query = """
            SELECT 
                COUNT(*) as total_games,
                AVG(Attempts) as avg_attempts,
                MIN(Attempts) as best_score
            FROM GameResults
            WHERE GameName = 'GuessTheNumber' AND Won = 1
        """
        
        success, result = execute_query(query, fetch=True)
        
        if not success or not result:
            return jsonify({
                'success': True,
                'stats': {
                    'total_games': 0,
                    'avg_attempts': None,
                    'best_score': None
                }
            })
        
        row = result[0]
        
        return jsonify({
            'success': True,
            'stats': {
                'total_games': row[0] or 0,
                'avg_attempts': float(row[1]) if row[1] else None,
                'best_score': row[2]
            }
        })


# =============================================================================
# Error Handlers
# =============================================================================

def register_error_handlers(app: Flask) -> None:
    """Register error handlers. Explicit error responses."""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Resource not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'error': 'Method not allowed'
        }), 405


# =============================================================================
# Application Entry Point
# =============================================================================

app = create_app()

if __name__ == '__main__':
    # Explicit: Only run in debug mode when explicitly enabled
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=Config.DEBUG
    )
