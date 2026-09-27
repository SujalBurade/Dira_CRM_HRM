from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from models import User, Project, ProjectAllocation
from extensions import db

auth_bp = Blueprint('auth', __name__)
api_bp = Blueprint('api', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        user_data = {
            'id': user.id, 
            'role': user.role, 
            'name': user.full_name,
            'email': user.email,
            'permissions': user.permissions or 'Standard Access'
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=user_data)
        
        return jsonify({
            'token': access_token,
            'user': user_data
        }), 200
    
    return jsonify({'message': 'Invalid email or password'}), 401

# --- Secured Endpoints ---

def get_current_user_model():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except (ValueError, TypeError):
        return None

@api_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    total_revenue = db.session.query(db.func.sum(Project.billing)).scalar() or 0
    active_clients = User.query.filter_by(role='CLIENT').count()
    total_employees = User.query.filter_by(role='EMPLOYEE').count()
    active_allocations = ProjectAllocation.query.count()

    allocations = ProjectAllocation.query.order_by(ProjectAllocation.assigned_date.desc()).limit(15).all()
    allocations_data = []
    for alloc in allocations:
        allocations_data.append({
            'id': alloc.id,
            'employee_id': alloc.employee.id,
            'employee_name': alloc.employee.full_name,
            'employee_email': alloc.employee.email,
            'employee_initials': "".join([n[0] for n in alloc.employee.full_name.split() if n]),
            'project_id': alloc.project.id,
            'project_name': alloc.project.name,
            'client_name': alloc.project.client.full_name if alloc.project.client else 'N/A',
            'budget': float(alloc.project.budget),
            'status': alloc.project.status,
            'completion_percentage': alloc.project.completion_percentage
        })

    return jsonify({
        'stats': {
            'revenue': float(total_revenue),
            'active_clients': active_clients,
            'total_employees': total_employees,
            'active_allocations': active_allocations
        },
        'allocations': allocations_data
    })

@api_bp.route('/admin/data', methods=['GET'])
@jwt_required()
def admin_all_data():
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    projects = Project.query.all()
    users = User.query.all()
    
    projects_data = []
    for p in projects:
        team_members = [{
            'id': alloc.employee.id,
            'name': alloc.employee.full_name,
            'email': alloc.employee.email,
            'initials': "".join([n[0] for n in alloc.employee.full_name.split() if n])
        } for alloc in p.allocations]

        projects_data.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'budget': float(p.budget),
            'billing': float(p.billing),
            'status': p.status,
            'completion_percentage': p.completion_percentage,
            'due_date': p.due_date,
            'client_id': p.client_id,
            'client_name': p.client.full_name if p.client else 'Unassigned',
            'client_email': p.client.email if p.client else '',
            'team': team_members
        })
    
    users_data = [{
        'id': u.id,
        'name': u.full_name,
        'email': u.email,
        'role': u.role,
        'permissions': u.permissions or 'Standard Access'
    } for u in users]
    
    return jsonify({
        'projects': projects_data,
        'users': users_data
    })

@api_bp.route('/admin/allocate', methods=['POST'])
@jwt_required()
def admin_allocate():
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    project_id = data.get('project_id')
    employee_id = data.get('employee_id')
    
    if not project_id or not employee_id:
        return jsonify({'message': 'Missing project_id or employee_id'}), 400
        
    exists = ProjectAllocation.query.filter_by(project_id=project_id, employee_id=employee_id).first()
    if exists:
        return jsonify({'message': 'Employee already allocated to this project'}), 400
        
    alloc = ProjectAllocation(project_id=project_id, employee_id=employee_id)
    db.session.add(alloc)
    db.session.commit()
    
    return jsonify({'message': 'Allocation successful'}), 201

@api_bp.route('/admin/allocate/<int:allocation_id>', methods=['DELETE'])
@jwt_required()
def remove_allocation(allocation_id):
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    alloc = ProjectAllocation.query.get_or_404(allocation_id)
    db.session.delete(alloc)
    db.session.commit()
    return jsonify({'message': 'Allocation removed'}), 200

# --- USER MANAGEMENT (ADMIN) ---

@api_bp.route('/admin/users', methods=['POST'])
@jwt_required()
def create_user():
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data.get('email') or not data.get('name'):
        return jsonify({'message': 'Name and Email are required'}), 400

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400
        
    new_user = User(
        email=data.get('email'), 
        full_name=data.get('name'), 
        role=data.get('role', 'EMPLOYEE'),
        permissions=data.get('permissions', 'Standard Access')
    )
    new_user.set_password(data.get('password', 'password123'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@api_bp.route('/admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def modify_user(user_id):
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    target_user = User.query.get_or_404(user_id)
    if request.method == 'DELETE':
        ProjectAllocation.query.filter_by(employee_id=target_user.id).delete()
        projects = Project.query.filter_by(client_id=target_user.id).all()
        for p in projects:
            ProjectAllocation.query.filter_by(project_id=p.id).delete()
            db.session.delete(p)
        db.session.delete(target_user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
        
    if request.method == 'PUT':
        data = request.get_json()
        target_user.full_name = data.get('name', target_user.full_name)
        target_user.role = data.get('role', target_user.role)
        target_user.permissions = data.get('permissions', target_user.permissions)
        if data.get('password'):
            target_user.set_password(data.get('password'))
        db.session.commit()
        return jsonify({'message': 'User updated successfully'})

# --- PROJECT MANAGEMENT (ADMIN) ---

@api_bp.route('/admin/projects', methods=['POST'])
@jwt_required()
def create_project():
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data.get('name') or not data.get('client_id'):
        return jsonify({'message': 'Project Name and Client are required'}), 400

    project = Project(
        name=data.get('name'),
        description=data.get('description', ''),
        budget=data.get('budget', 0.0),
        billing=data.get('billing', 0.0),
        status=data.get('status', 'In Progress'),
        completion_percentage=data.get('completion_percentage', 0),
        due_date=data.get('due_date', 'Dec 31, 2026'),
        client_id=data.get('client_id')
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({'message': 'Project created successfully'}), 201

@api_bp.route('/admin/projects/<int:project_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def modify_project(project_id):
    user = get_current_user_model()
    if not user or user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    project = Project.query.get_or_404(project_id)
    if request.method == 'DELETE':
        ProjectAllocation.query.filter_by(project_id=project.id).delete()
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted successfully'})
        
    if request.method == 'PUT':
        data = request.get_json()
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.budget = data.get('budget', project.budget)
        project.billing = data.get('billing', project.billing)
        project.status = data.get('status', project.status)
        project.completion_percentage = data.get('completion_percentage', project.completion_percentage)
        project.due_date = data.get('due_date', project.due_date)
        if data.get('client_id'):
            project.client_id = data.get('client_id')
        db.session.commit()
        return jsonify({'message': 'Project updated successfully'})


# --- EMPLOYEE DASHBOARD & CONTROLS ---

@api_bp.route('/employee/dashboard', methods=['GET'])
@jwt_required()
def employee_dashboard():
    emp_user = get_current_user_model()
    if not emp_user or emp_user.role != 'EMPLOYEE':
        return jsonify({'message': 'Unauthorized'}), 403
    
    allocations = ProjectAllocation.query.filter_by(employee_id=emp_user.id).all()
    projects_data = []
    assigned_clients_dict = {}
    
    for alloc in allocations:
        p = alloc.project
        team_members = [{
            'id': a.employee.id,
            'name': a.employee.full_name,
            'email': a.employee.email,
            'initials': "".join([n[0] for n in a.employee.full_name.split() if n])
        } for a in p.allocations]

        projects_data.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'status': p.status,
            'completion_percentage': p.completion_percentage,
            'due_date': p.due_date,
            'budget': float(p.budget),
            'client_id': p.client_id,
            'client_name': p.client.full_name if p.client else 'N/A',
            'client_email': p.client.email if p.client else '',
            'team': team_members
        })

        if p.client:
            assigned_clients_dict[p.client.id] = {
                'id': p.client.id,
                'name': p.client.full_name,
                'email': p.client.email,
                'project_name': p.name
            }
        
    return jsonify({
        'user': {
            'id': emp_user.id,
            'name': emp_user.full_name,
            'email': emp_user.email,
            'role': emp_user.role,
            'permissions': emp_user.permissions or 'Standard Access'
        },
        'projects': projects_data,
        'assigned_clients': list(assigned_clients_dict.values())
    })

@api_bp.route('/employee/projects/<int:project_id>/status', methods=['PUT'])
@jwt_required()
def update_project_status(project_id):
    emp_user = get_current_user_model()
    if not emp_user or emp_user.role != 'EMPLOYEE':
        return jsonify({'message': 'Unauthorized'}), 403

    alloc = ProjectAllocation.query.filter_by(project_id=project_id, employee_id=emp_user.id).first()
    if not alloc:
        return jsonify({'message': 'Access denied: You are not assigned to this project'}), 403

    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    if 'status' in data:
        project.status = data['status']
    if 'completion_percentage' in data:
        project.completion_percentage = int(data['completion_percentage'])

    db.session.commit()
    return jsonify({'message': 'Project progress updated successfully'}), 200


# --- CLIENT DASHBOARD & CONTROLS ---

@api_bp.route('/client/dashboard', methods=['GET'])
@jwt_required()
def client_dashboard():
    client_user = get_current_user_model()
    if not client_user or client_user.role != 'CLIENT':
        return jsonify({'message': 'Unauthorized'}), 403
    
    projects = Project.query.filter_by(client_id=client_user.id).all()
    projects_data = []
    
    for p in projects:
        team_members = [{
            'id': alloc.employee.id,
            'name': alloc.employee.full_name,
            'email': alloc.employee.email,
            'initials': "".join([n[0] for n in alloc.employee.full_name.split() if n])
        } for alloc in p.allocations]
        
        projects_data.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'status': p.status,
            'completion_percentage': p.completion_percentage,
            'due_date': p.due_date,
            'created_at': p.created_at.strftime('%Y-%m-%d') if p.created_at else None,
            'team': team_members
        })
        
    return jsonify({
        'user': {
            'id': client_user.id,
            'name': client_user.full_name,
            'email': client_user.email
        },
        'projects': projects_data
    })
