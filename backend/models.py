from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    
    # Roles: 'ADMIN', 'EMPLOYEE', 'CLIENT'
    role = db.Column(db.String(20), nullable=False, default='EMPLOYEE')
    # Custom permissions (e.g., 'Read & Write', 'Full Access', 'View Only')
    permissions = db.Column(db.String(255), nullable=True, default='Standard Access')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    allocated_projects = db.relationship(
        'ProjectAllocation', 
        foreign_keys='ProjectAllocation.employee_id',
        back_populates='employee'
    )
    client_projects = db.relationship(
        'Project', 
        foreign_keys='Project.client_id',
        back_populates='client'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Financials (visible to Admin / Employee)
    budget = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    billing = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    
    # Status & Progress
    status = db.Column(db.String(50), nullable=False, default='In Progress')
    completion_percentage = db.Column(db.Integer, nullable=False, default=0)
    due_date = db.Column(db.String(50), nullable=True, default='Dec 31, 2026')
    
    # The client who owns this project
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    client = db.relationship('User', foreign_keys=[client_id], back_populates='client_projects')
    allocations = db.relationship('ProjectAllocation', back_populates='project', cascade="all, delete-orphan")


class ProjectAllocation(db.Model):
    """
    Many-to-Many association table linking Employees to Projects.
    Allows Admins to track which employee is allocated to which client/project.
    """
    __tablename__ = 'project_allocations'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = db.relationship('Project', back_populates='allocations')
    employee = db.relationship('User', foreign_keys=[employee_id], back_populates='allocated_projects')
