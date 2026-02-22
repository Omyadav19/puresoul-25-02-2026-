# server/app.py - Flask Backend for Puresoul AI Therapist (MySQL Version)

import os
import io
import re
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from sqlalchemy import or_
import bcrypt
import jwt
from dotenv import load_dotenv
from groq import Groq
from elevenlabs import ElevenLabs
from functools import wraps

from validation import validate_email, validate_username, validate_password
from models import db, User, TherapySession, TherapyMessage, ContactUs

print("RUNNING UPDATED app.py FILE (Pro System)")

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database Configuration
db_uri = os.getenv('SQLALCHEMY_DATABASE_URI')
if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Extensions
db.init_app(app)

# Initialize API clients
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
ELEVENLABS_API_KEY = os.getenv("ELEVEN_API_KEY")

if not ELEVENLABS_API_KEY:
    raise RuntimeError("ELEVENLABS_API_KEY is not set")

elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# JWT Secret
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

# Create tables within app context
with app.app_context():
    db.create_all()

# ============== AUTH DECORATORS ==============

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['id']).first()
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def pro_required(f):
    """Decorator that blocks non-Pro users from accessing Pro-only endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['id']).first()
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        if not current_user.is_pro:
            return jsonify({
                'message': 'Pro subscription required to access this feature.',
                'upgrade_required': True
            }), 403

        return f(current_user, *args, **kwargs)

    return decorated


# ============== API ROUTES ==============

@app.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    """Return aggregated analytics data for the Dashboard page."""
    try:
        # Session stats
        sessions = TherapySession.query.filter_by(user_id=current_user.id).all()
        total_sessions = len(sessions)

        # Message stats
        total_messages = 0
        session_durations = []
        category_counts = {}
        for s in sessions:
            msgs = TherapyMessage.query.filter_by(session_id=s.id).all()
            msg_count = len(msgs)
            total_messages += msg_count

            # Duration in minutes
            if s.started_at and s.ended_at:
                dur = max(0, int((s.ended_at - s.started_at).total_seconds() / 60))
            else:
                dur = 0

            # Category from session title (e.g. "Mental Health Session" → "Mental Health")
            title = s.session_title or 'Mental Health Session'
            category = title.replace(' Session', '').strip()
            category_counts[category] = category_counts.get(category, 0) + 1

            session_durations.append({
                'date': s.started_at.strftime('%b %d') if s.started_at else 'N/A',
                'duration': dur,
                'messages': msg_count,
                'category': category,
                'session_id': s.id,
                'started_at': s.started_at.isoformat() if s.started_at else None,
            })

        avg_duration = (
            round(sum(d['duration'] for d in session_durations) / total_sessions)
            if total_sessions > 0 else 0
        )

        # Emotion breakdown from emotion_detected field in messages
        emotion_counts = {}
        session_ids = [s.id for s in sessions]
        if session_ids:
            all_messages = TherapyMessage.query.filter(
                TherapyMessage.session_id.in_(session_ids),
                TherapyMessage.emotion_detected.isnot(None)
            ).all()
            for m in all_messages:
                e = m.emotion_detected.lower()
                emotion_counts[e] = emotion_counts.get(e, 0) + 1

        emotion_distribution = [
            {'name': k, 'value': v} for k, v in emotion_counts.items()
        ]

        # Wellness score: ratio of positive/neutral messages
        positive = emotion_counts.get('happy', 0)
        neutral = emotion_counts.get('neutral', 0) + emotion_counts.get('surprised', 0)
        total_emotions = sum(emotion_counts.values())
        wellness_score = (
            round(((positive * 2 + neutral) / (total_emotions * 2)) * 100)
            if total_emotions > 0 else 0
        )

        most_frequent_emotion = (
            max(emotion_counts, key=emotion_counts.get)
            if emotion_counts else 'N/A'
        )

        return jsonify({
            'total_sessions': total_sessions,
            'total_messages': total_messages,
            'avg_session_duration': avg_duration,
            'credits': current_user.credits,
            'total_credits_purchased': current_user.total_credits_purchased,
            'is_pro': current_user.is_pro,
            'wellness_score': wellness_score,
            'most_frequent_emotion': most_frequent_emotion,
            'emotion_distribution': emotion_distribution,
            'session_durations': session_durations[-10:],  # last 10 sessions
            'category_counts': category_counts,
        }), 200

    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({'message': 'Server error fetching dashboard data.'}), 500


@app.route('/api/mood-history', methods=['GET'])
@token_required
def get_mood_history(current_user):
    """Return session history with messages for the Mood History page."""
    try:
        sessions = TherapySession.query.filter_by(
            user_id=current_user.id
        ).order_by(TherapySession.started_at.desc()).limit(20).all()

        history = []
        for s in sessions:
            msgs = TherapyMessage.query.filter_by(
                session_id=s.id
            ).order_by(TherapyMessage.created_at.asc()).all()

            if s.started_at and s.ended_at:
                dur = max(0, int((s.ended_at - s.started_at).total_seconds() / 60))
            else:
                dur = 0

            title = s.session_title or 'Mental Health Session'
            category = title.replace(' Session', '').strip()

            history.append({
                'id': s.id,
                'session_title': s.session_title,
                'category': category,
                'started_at': s.started_at.isoformat() if s.started_at else None,
                'ended_at': s.ended_at.isoformat() if s.ended_at else None,
                'duration': dur,
                'is_active': s.is_active,
                'message_count': len(msgs),
                'messages': [
                    {
                        'id': m.id,
                        'sender': m.sender,
                        'message_text': m.message_text,
                        'emotion_detected': m.emotion_detected,
                        'created_at': m.created_at.isoformat() if m.created_at else None,
                    }
                    for m in msgs[:5]  # preview first 5 messages
                ],
            })

        return jsonify({
            'sessions': history,
            'total': len(history),
            'is_pro': current_user.is_pro,
        }), 200

    except Exception as e:
        print(f"Mood history error: {e}")
        return jsonify({'message': 'Server error fetching mood history.'}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'online',
        'message': 'Puresoul AI Backend is running',
        'endpoints': [
            '/api/register',
            '/api/login',
            '/api/get-response',
            '/api/text-to-speech',
            '/api/session/create',
            '/api/pro/sessions',
            '/api/pro/session/<session_id>',
            '/api/pro/upgrade',
        ]
    }), 200


@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint."""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        username_errors = validate_username(username)
        if username_errors:
            return jsonify({'message': ', '.join(username_errors)}), 400

        if not validate_email(email):
            return jsonify({'message': 'Invalid email format.'}), 400

        password_errors = validate_password(password)
        if password_errors:
            return jsonify({'message': ', '.join(password_errors)}), 400

        existing_user = User.query.filter(
            or_(User.email == email.lower(), User.username == username.lower())
        ).first()

        if existing_user:
            return jsonify({'message': 'User with this email or username already exists.'}), 400

        salt = bcrypt.gensalt(rounds=10)
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)

        tier = data.get('tier', 'basic').lower()
        if tier not in ['basic', 'pro', 'plus']:
            tier = 'basic'

        initial_credits = 12
        is_pro_status = False
        if tier == 'pro':
            initial_credits = 30
            is_pro_status = True
        elif tier == 'plus':
            initial_credits = 50
            is_pro_status = True

        new_user = User(
            name=name,
            email=email.lower(),
            username=username.lower(),
            password=hashed_password.decode('utf-8'),
            credits=initial_credits,
            tier=tier,
            is_pro=is_pro_status
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': f'Account created successfully as {tier.capitalize()}! Please login.',
            'credits': initial_credits,
            'tier': tier
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        return jsonify({'message': 'Server error during registration.'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint."""
    try:
        data = request.get_json()
        identifier = data.get('identifier', '').strip()
        password = data.get('password', '')

        user = User.query.filter(
            or_(User.email == identifier.lower(), User.username == identifier.lower())
        ).first()

        if not user:
            return jsonify({'message': 'Invalid credentials.'}), 400

        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'message': 'Invalid credentials.'}), 400

        token = jwt.encode(
            {
                'id': user.id,
                'username': user.username,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            JWT_SECRET,
            algorithm='HS256'
        )

        return jsonify({
            'token': token,
            'username': user.username,
            'credits': user.credits,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': 'Server error during login.'}), 500


@app.route('/api/credits', methods=['GET'])
@token_required
def get_credits(current_user):
    """Fetch user's current credits."""
    return jsonify({
        'username': current_user.username,
        'credits': current_user.credits,
        'is_pro': current_user.is_pro
    }), 200


@app.route('/api/credits/use', methods=['POST'])
@token_required
def use_credit(current_user):
    """Deduct exactly 1 credit."""
    if current_user.credits <= 0:
        return jsonify({
            'success': False,
            'message': 'Insufficient credits',
            'credits': 0
        }), 403

    current_user.credits -= 1
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Credit deducted',
        'credits': current_user.credits
    }), 200


@app.route('/api/contact', methods=['POST'])
def receive_contact():
    """Store incoming contact messages in the database."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip()
        message = (data.get('message') or '').strip()

        if not email or not validate_email(email):
            return jsonify({'message': 'Invalid email.'}), 400

        if not message:
            return jsonify({'message': 'Message is required.'}), 400

        contact = ContactUs(email=email.lower(), message=message)
        db.session.add(contact)
        db.session.commit()

        return jsonify({'message': 'Contact saved. Thank you!'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Contact endpoint error: {e}")
        return jsonify({'message': 'Server error saving contact.'}), 500


@app.route('/api/credits/buy', methods=['POST'])
@token_required
def buy_credits_v2(current_user):
    """Add purchased credits."""
    data = request.get_json()
    amount = data.get('amount', 0)

    if amount <= 0:
        return jsonify({'message': 'Invalid amount.'}), 400

    current_user.credits += amount
    current_user.total_credits_purchased += amount
    db.session.commit()

    return jsonify({
        'message': f'Successfully purchased {amount} credits!',
        'credits': current_user.credits
    }), 200


# ============== PRO UPGRADE ==============

@app.route('/api/pro/upgrade', methods=['POST'])
@token_required
def upgrade_to_pro(current_user):
    """Upgrade a user to a specific tier (Pro or Plus)."""
    try:
        data = request.get_json() or {}
        new_tier = data.get('tier', 'pro').lower()
        
        if new_tier not in ['pro', 'plus']:
            return jsonify({'message': 'Invalid tier specified.'}), 400

        current_user.tier = new_tier
        current_user.is_pro = True
        
        # Grant credits based on upgrade
        if new_tier == 'pro':
            current_user.credits += 30
        elif new_tier == 'plus':
            current_user.credits += 50
            
        db.session.commit()
        return jsonify({
            'message': f'Successfully upgraded to {new_tier.capitalize()}!',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Upgrade error: {e}")
        return jsonify({'message': 'Server error during upgrade.'}), 500


# ============== SESSION MANAGEMENT (PRO ONLY) ==============

@app.route('/api/session/create', methods=['POST'])
@token_required
def create_session(current_user):
    """
    Create a new therapy session.
    Available to all authenticated users, but only Pro users get persistence.
    Returns session_id for Pro users, None for free users.
    """
    try:
        data = request.get_json() or {}
        category = data.get('category', 'Mental Health')
        session_title = data.get('session_title', f"{category} Session")

        # Mark any previously active sessions as inactive
        TherapySession.query.filter_by(
            user_id=current_user.id, is_active=True
        ).update({'is_active': False, 'ended_at': datetime.utcnow()})

        new_session = TherapySession(
            user_id=current_user.id,
            session_title=session_title,
            is_active=True
        )
        db.session.add(new_session)
        db.session.commit()

        return jsonify({
            'session_id': new_session.id,
            'is_pro': current_user.is_pro,
            'session': new_session.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Session create error: {e}")
        return jsonify({'message': 'Server error creating session.'}), 500


@app.route('/api/session/<int:session_id>/end', methods=['POST'])
@token_required
def end_session(current_user, session_id):
    """Mark a session as ended."""
    try:
        session = TherapySession.query.filter_by(
            id=session_id, user_id=current_user.id
        ).first()

        if not session:
            return jsonify({'message': 'Session not found.'}), 404

        session.is_active = False
        session.ended_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Session ended.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Session end error: {e}")
        return jsonify({'message': 'Server error ending session.'}), 500


@app.route('/api/pro/sessions', methods=['GET'])
@pro_required
def get_pro_sessions(current_user):
    """Fetch all therapy sessions for the authenticated Pro user."""
    try:
        sessions = TherapySession.query.filter_by(
            user_id=current_user.id
        ).order_by(TherapySession.started_at.desc()).all()

        sessions_data = []
        for s in sessions:
            d = s.to_dict()
            # Convert datetimes to ISO strings for JSON serialization
            d['started_at'] = s.started_at.isoformat() if s.started_at else None
            d['ended_at'] = s.ended_at.isoformat() if s.ended_at else None
            # Include message count for sidebar display
            d['message_count'] = TherapyMessage.query.filter_by(session_id=s.id).count()
            sessions_data.append(d)

        return jsonify({'sessions': sessions_data}), 200

    except Exception as e:
        print(f"Fetch sessions error: {e}")
        return jsonify({'message': 'Server error fetching sessions.'}), 500


@app.route('/api/pro/session/<int:session_id>', methods=['GET'])
@pro_required
def get_session_messages(current_user, session_id):
    """Fetch all messages for a specific session (Pro only, owner only)."""
    try:
        session = TherapySession.query.filter_by(
            id=session_id, user_id=current_user.id
        ).first()

        if not session:
            return jsonify({'message': 'Session not found or access denied.'}), 404

        messages = TherapyMessage.query.filter_by(
            session_id=session_id
        ).order_by(TherapyMessage.created_at.asc()).all()

        messages_data = []
        for m in messages:
            d = m.to_dict()
            d['created_at'] = m.created_at.isoformat() if m.created_at else None
            messages_data.append(d)

        session_data = session.to_dict()
        session_data['started_at'] = session.started_at.isoformat() if session.started_at else None
        session_data['ended_at'] = session.ended_at.isoformat() if session.ended_at else None

        return jsonify({
            'session': session_data,
            'messages': messages_data
        }), 200

    except Exception as e:
        print(f"Fetch session messages error: {e}")
        return jsonify({'message': 'Server error fetching messages.'}), 500


@app.route('/api/pro/session/<int:session_id>', methods=['DELETE'])
@pro_required
def delete_session(current_user, session_id):
    """Delete a therapy session and its messages (Pro only, owner only)."""
    try:
        session = TherapySession.query.filter_by(
            id=session_id, user_id=current_user.id
        ).first()

        if not session:
            return jsonify({'message': 'Session not found or access denied.'}), 404

        db.session.delete(session)
        db.session.commit()

        return jsonify({'message': 'Session deleted successfully.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Delete session error: {e}")
        return jsonify({'message': 'Server error deleting session.'}), 500


# ============== MAIN CHAT ENDPOINT ==============

SYSTEM_PROMPTS = {
    "Academic / Exam": """
You are **Dost**, a compassionate Indian mentor specializing in Academic/Exam pressure.
Mirror the user's language (English or Hinglish).Use english if user is using english.
Focus on exam anxiety, lack of focus, and study pressure.
Arre dost, tension mat lo! Help them manage stress and build confidence.
Keep it warm, empathetic, and under 2-3 sentences. Use emojis like 📚, ✍️, ✨.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Career & Jobs": """
You are **Dost**, a career coach who understands the job market struggle in India.
Mirror the user's language (English or Hinglish).Use english if user is using english.
Focus on career confusion, job search stress, and workplace politics.
Dost, career stress real hai, but we will find a way. Provide professional yet emotional support.
Keep it natural and under 2-3 sentences. Use emojis like 💼, 🚀, 🤞.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Relationship": """
You are **Dost**, an empathetic friend who listens to relationship problems.
Mirror the user's language (English or Hinglish).Use english if user is using english.
Focus on heartbreaks, family issues, or friendship drama.
Relationship issues dil se connected hoti hain. Give them a safe space to vent.
Keep it very gentle and validating. Under  2-3 sentences. Use emojis like ❤️, 🤗, 🤝.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Health & Wellness": """
You are **Dost**, a wellness companion focusing on physical and mental health.
Mirror the user's language (English or Hinglish).Use english if user is using english.
Focus on recovery stress, sleep issues, or general fatigue.
Health sabse pehle hai dost. Encourage healthy habits without being preachy.
Keep it soothing and encouraging. Under 4 sentences. Use emojis like 🏥, 🧘, 🌿.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Personal Growth": """
You are **Dost**, a motivation-focused friend for personal expansion.
Mirror the user's language (English or Hinglish).Use english if user is using english.  
Focus on self-doubt, building habits, and finding purpose.
Apne aap ko grow karna ek safar hai dost. Celebrate small wins.
Keep it inspiring and positive. Under 4 sentences. Use emojis like 🌱, ⭐, 📈.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Mental Health": """
You are **Dost**, a supportive companion for general mental wellness.
Mirror the user's language (English or Hinglish).Use english if user is using english.  
Focus on anxiety, low mood, or just needing to be heard.
Main hoon na dost, sab discuss karte hain. Provide a non-judgmental ear.
Keep it empathetic and safe. Under 2-3 sentences. Use emojis like 🧠, 🫂, 🕊️.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
""",
    "Financial Stress": """
You are **Dost**, a practical friend who understands financial anxiety.
Mirror the user's language (English or Hinglish).Use english if user is using english.  
Focus on money worries, loan stress, or stability.
Paisa aur stress ka gehra rishta hai, but tension mat lo. Help them stay calm.
Keep it grounded and supportive. Under 2-3 sentences. Use emojis like 💰, 🏦, ⚓.
You remember everything from previous sessions and refer to past conversations naturally.
NO asterisks (*).
"""
}


def _save_message(session_id, sender, text, emotion=None):
    """Helper: persist a single message to the database."""
    if not session_id:
        return
    try:
        msg = TherapyMessage(
            session_id=session_id,
            sender=sender,
            message_text=text,
            emotion_detected=emotion
        )
        db.session.add(msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Message save error: {e}")


def _load_session_history(session_id, limit=30):
    """Helper: load previous messages for AI memory injection."""
    if not session_id:
        return []
    messages = TherapyMessage.query.filter_by(
        session_id=session_id
    ).order_by(TherapyMessage.created_at.asc()).limit(limit).all()
    return messages


@app.route('/api/get-response', methods=['POST'])
@token_required
def get_response(current_user):
    """Chatbot response endpoint using Groq API with Pro memory support."""
    try:
        # Check credits
        if current_user.credits <= 0:
            return jsonify({
                'error': 'Insufficient credits',
                'message': 'Your credits are used up 💛'
            }), 403

        data = request.get_json()
        user_message = data.get('userMessage', '')
        message_history = data.get('messageHistory', [])  # Fallback for free users
        category = data.get('category', 'Mental Health')
        session_id = data.get('session_id', None)  # Pro users send this
        provided_emotion = data.get('emotion', None) # Optional frontend cam emotion

        current_system_prompt = SYSTEM_PROMPTS.get(category, SYSTEM_PROMPTS["Mental Health"])

        # Detect emotion of the user's message
        user_emotion = provided_emotion
        if not user_emotion:
            try:
                # Quick secondary call for classification
                classify_completion = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "Classify the following message into exactly one emotion: happy, sad, neutral, surprised, angry, fear. Return ONLY the word."},
                        {"role": "user", "content": user_message}
                    ],
                    model="llama3-8b-8192",
                    max_tokens=10
                )
                detected = classify_completion.choices[0].message.content.strip().lower()
                # Clean up punctuation if any
                detected = re.sub(r'[^a-z]', '', detected)
                if detected in ['happy', 'sad', 'neutral', 'surprised', 'angry', 'fear']:
                    user_emotion = detected
                else:
                    user_emotion = 'neutral'
            except:
                user_emotion = 'neutral'

        # Build conversation history for the LLM
        conversation_history = [
            {"role": "system", "content": current_system_prompt}
        ]

        if current_user.tier == 'plus' and session_id:
            # ── PLUS PATH: Load persistent history from DB (Memory) ──
            db_messages = _load_session_history(session_id, limit=30)
            for m in db_messages:
                role = 'user' if m.sender == 'user' else 'assistant'
                conversation_history.append({"role": role, "content": m.message_text})
        else:
            # ── BASIC/PRO PATH: Use in-memory history from client ──
            for msg in message_history:
                role = 'user' if msg.get('sender') == 'user' else 'assistant'
                conversation_history.append({"role": role, "content": msg.get('text', '')})

        # Append the new user message
        conversation_history.append({"role": "user", "content": user_message})

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )

        response_text = (
            chat_completion.choices[0].message.content
            if chat_completion.choices
            else "I'm here to listen. Could you tell me more?"
        )

        # ── Persist both messages for Analytics ──
        if session_id:
            _save_message(session_id, 'user', user_message, emotion=user_emotion)
            _save_message(session_id, 'ai', response_text, emotion='neutral')

        return jsonify({'therapistResponse': response_text})

    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return jsonify({'error': 'Failed to get a response from the AI.'}), 500

@app.route('/api/text-to-speech', methods=['POST'])
@token_required
def text_to_speech(current_user):
    # Only Pro and Plus users have voice support
    if current_user.tier not in ['pro', 'plus']:
        return jsonify({
            'error': 'Voice support is not available for Basic users.',
            'upgrade_required': True
        }), 403

    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        cleaned_text = re.sub(r'\*.*?\*', '', text)
        cleaned_text = re.sub(r'[\U0001F600-\U0001F64F]', '', cleaned_text)

        audio_stream = elevenlabs_client.text_to_speech.convert(
            voice_id="21m00Tcm4TlvDq8ikWAM",
            model_id="eleven_multilingual_v2",
            text=cleaned_text
        )

        audio_bytes = b"".join(audio_stream)

        return send_file(
            io.BytesIO(audio_bytes),
            mimetype="audio/mpeg",
            as_attachment=False
        )

    except Exception as e:
        print("Error generating speech:", e)
        return jsonify({'error': 'Failed to generate speech'}), 500


# ============== START SERVER ==============

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"Server is running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
