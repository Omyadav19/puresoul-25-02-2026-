# fix_tier_column.py
import os
from flask import Flask
from sqlalchemy import text
from models import db, User
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
db_uri = os.getenv('SQLALCHEMY_DATABASE_URI')
if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    try:
        # Check if tier column exists
        # This is for MySQL/SQLite.
        db.session.execute(text("ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'basic'"))
        db.session.commit()
        print("Tier column added successfully!")
    except Exception as e:
        print(f"Error or column already exists: {e}")
        db.session.rollback()
