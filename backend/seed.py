from app import create_app
from extensions import db
from models import User, Project, ProjectAllocation

app = create_app()

with app.app_context():
    print("Dropping all existing tables...")
    db.drop_all()
    print("Creating tables...")
    db.create_all()

    # 1. Create Admin
    admin = User(
        email="admin@dira.com", 
        full_name="Jane Doe (Owner)", 
        role="ADMIN",
        permissions="Full Admin Control"
    )
    admin.set_password("password123")
    
    # 2. Create Employees
    employee1 = User(
        email="employee@dira.com", 
        full_name="John Smith", 
        role="EMPLOYEE",
        permissions="Read & Write Projects"
    )
    employee1.set_password("password123")

    employee2 = User(
        email="alex@dira.com", 
        full_name="Alex Johnson", 
        role="EMPLOYEE",
        permissions="Design & Dev Access"
    )
    employee2.set_password("password123")
    
    # 3. Create Clients
    client1 = User(
        email="client@dira.com", 
        full_name="Acme Corp Contact", 
        role="CLIENT",
        permissions="Client Portal Access"
    )
    client1.set_password("password123")

    client2 = User(
        email="techcorp@dira.com", 
        full_name="TechCorp Solutions", 
        role="CLIENT",
        permissions="Client Portal Access"
    )
    client2.set_password("password123")

    db.session.add_all([admin, employee1, employee2, client1, client2])
    db.session.commit()

    # 4. Create Projects for Clients
    project1 = Project(
        name="Website Redesign",
        description="Complete overhaul of the Acme Corp landing page and dashboards.",
        budget=45000.00,
        billing=15000.00,
        status="In Progress",
        completion_percentage=65,
        due_date="Dec 15, 2026",
        client_id=client1.id
    )

    project2 = Project(
        name="Mobile App Development",
        description="Cross-platform iOS and Android mobile app build for TechCorp.",
        budget=80000.00,
        billing=40000.00,
        status="In Progress",
        completion_percentage=40,
        due_date="Jan 30, 2027",
        client_id=client2.id
    )

    project3 = Project(
        name="SEO & Marketing Campaign",
        description="Comprehensive search engine optimization and ad management for Acme Corp.",
        budget=20000.00,
        billing=20000.00,
        status="Completed",
        completion_percentage=100,
        due_date="Nov 01, 2026",
        client_id=client1.id
    )

    db.session.add_all([project1, project2, project3])
    db.session.commit()

    # 5. Allocate Employees to Projects
    alloc1 = ProjectAllocation(project_id=project1.id, employee_id=employee1.id)
    alloc2 = ProjectAllocation(project_id=project1.id, employee_id=employee2.id)
    alloc3 = ProjectAllocation(project_id=project2.id, employee_id=employee1.id)
    alloc4 = ProjectAllocation(project_id=project3.id, employee_id=employee2.id)

    db.session.add_all([alloc1, alloc2, alloc3, alloc4])
    db.session.commit()

    print("--- Database successfully seeded! ---")
    print("Use these credentials to test the login:")
    print("Admin      -> admin@dira.com / password123")
    print("Employee 1 -> employee@dira.com / password123")
    print("Employee 2 -> alex@dira.com / password123")
    print("Client 1   -> client@dira.com / password123")
    print("Client 2   -> techcorp@dira.com / password123")
