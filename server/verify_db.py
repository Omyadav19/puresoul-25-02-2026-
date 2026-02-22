import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def verify_tier_column():
    db_uri = os.getenv('SQLALCHEMY_DATABASE_URI')
    if '://' in db_uri:
        db_uri = db_uri.split('://')[1]
    
    auth_part, rest = db_uri.split('@')
    user, password = auth_part.split(':')
    host_port, database = rest.split('/')
    
    if ':' in host_port:
        host, port = host_port.split(':')
        port = int(port)
    else:
        host = host_port
        port = 3306
    
    import urllib.parse
    password = urllib.parse.unquote(password)
    
    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port
    )
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("DESCRIBE users")
            columns = [row[0] for row in cursor.fetchall()]
            print(f"Columns in 'users' table: {columns}")
            if 'tier' in columns:
                print("SUCCESS: 'tier' column exists.")
            else:
                print("FAILURE: 'tier' column missing. Attempting to add...")
                cursor.execute("ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'basic'")
                conn.commit()
                print("Tier column added.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify_tier_column()
