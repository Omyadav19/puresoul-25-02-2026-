from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        try:
            # Check existing columns
            result = db.session.execute(text("SHOW COLUMNS FROM users"))
            columns = [row[0] for row in result.fetchall()]
            
            print(f"Current columns: {columns}")
            
            # Add credits if missing or update default
            if 'credits' not in columns:
                print("Adding 'credits' column...")
                db.session.execute(text("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 12"))
            else:
                print("Updating 'credits' default to 12...")
                # Note: MySQL syntax for altering default
                db.session.execute(text("ALTER TABLE users ALTER COLUMN credits SET DEFAULT 12"))
            
            # Add total_credits_purchased column if missing
            if 'total_credits_earned' in columns and 'total_credits_purchased' not in columns:
                print("Renaming 'total_credits_earned' to 'total_credits_purchased'...")
                db.session.execute(text("ALTER TABLE users CHANGE total_credits_earned total_credits_purchased INTEGER DEFAULT 0"))
            elif 'total_credits_purchased' not in columns:
                print("Adding 'total_credits_purchased' column...")
                db.session.execute(text("ALTER TABLE users ADD COLUMN total_credits_purchased INTEGER DEFAULT 0"))

            # Add tier column if missing
            if 'tier' not in columns:
                print("Adding 'tier' column...")
                db.session.execute(text("ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'basic'"))
            
            db.session.commit()
            print("Migration successful!")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate()
