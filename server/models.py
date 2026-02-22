# server/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    credits = db.Column(db.Integer, default=12)
    total_credits_purchased = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_pro = db.Column(db.Boolean, default=False)
    tier = db.Column(db.String(20), default='basic')  # basic, pro, plus

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'username': self.username,
            'credits': self.credits,
            'total_credits_purchased': self.total_credits_purchased,
            'is_pro': self.is_pro,
            'tier': self.tier
        }

class TherapySession(db.Model):
    __tablename__ = 'therapy_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_title = db.Column(db.String(255), nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    messages = db.relationship('TherapyMessage', backref='session', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_title': self.session_title,
            'started_at': self.started_at,
            'ended_at': self.ended_at,
            'is_active': self.is_active
        }

class TherapyMessage(db.Model):
    __tablename__ = 'therapy_messages'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('therapy_sessions.id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # 'user' or 'ai'
    message_text = db.Column(db.Text, nullable=False)
    emotion_detected = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender': self.sender,
            'message_text': self.message_text,
            'emotion_detected': self.emotion_detected,
            'created_at': self.created_at
        }


class ContactUs(db.Model):
    __tablename__ = 'contactus'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'message': self.message,
            'created_at': self.created_at
        }
