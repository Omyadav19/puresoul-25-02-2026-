import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def add_tier_column():
    db_uri = os.getenv('SQLALCHEMY_DATABASE_URI')
    # Expected format: mysql+pymysql://root:Root%40123@localhost:3306/puresoul
    
    # Strip protocol
    if '://' in db_uri:
        db_uri = db_uri.split('://')[1]
    
    # root:Root%40123@localhost:3306/puresoul
    auth_part, rest = db_uri.split('@')
    user, password = auth_part.split(':')
    host_port, database = rest.split('/')
    
    if ':' in host_port:
        host, port = host_port.split(':')
        port = int(port)
    else:
        host = host_port
        port = 3306
    
    # Decode password %40 -> @
    import urllib.parse
    password = urllib.parse.unquote(password)
    
    print(f"Connecting to {host}:{port}/{database}...")
    
    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port
    )
    
    try:
        with conn.cursor() as cursor:
            # Check if column exists
            cursor.execute("SHOW COLUMNS FROM users LIKE 'tier'")
            result = cursor.fetchone()
            if not result:
                print("Adding 'tier' column...")
                cursor.execute("ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'basic'")
                conn.commit()
                print("Column 'tier' added successfully.")
            else:
                print("Column 'tier' already exists.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_tier_column()
