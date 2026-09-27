import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from extensions import db, jwt
import models  # Register models with SQLAlchemy

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    # In production, this should be a secure random key
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-placeholder')
    
    # Database Config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/hrm_crm_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT Config
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-placeholder')
    app.config['JWT_TOKEN_LOCATION'] = ['headers']

    # --- Security Features ---
    # 1. CORS setup: Allow local dev and production frontend
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        frontend_url
    ]
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)

    # Register Blueprints
    from routes import auth_bp, api_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    with app.app_context():
        db.create_all()
        
        # Auto-seed initial admin if database is completely empty (for Render deployment)
        from models import User
        if User.query.count() == 0:
            admin = User(email="admin@dira.com", full_name="Jane Doe (Owner)", role="ADMIN")
            admin.set_password("password123")
            db.session.add(admin)
            db.session.commit()
            print("Database was empty. Auto-seeded initial admin user: admin@dira.com")

    # 2. Security Headers (Middleware)
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # --- Basic Routes ---
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "HRM+CRM API is running."}), 200

    # (Future endpoints will go here: auth, admin, employees, clients)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
