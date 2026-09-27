from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Initialize extensions here to avoid circular imports
db = SQLAlchemy()
jwt = JWTManager()
