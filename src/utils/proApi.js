import { API_BASE_URL } from './apiConfig';

const BASE_URL = API_BASE_URL;

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});


// ── Session lifecycle ──────────────────────────────────────────────────────

/**
 * Create a new therapy session (Pro users get a real session_id; free users get null).
 * @param {string} category  e.g. "Mental Health"
 * @returns {{ session_id: number|null, is_pro: boolean }}
 */
export async function createSession(category = 'Mental Health') {
    const res = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ category, session_title: `${category} Session` }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
}

/**
 * Mark a session as ended on the server.
 * @param {number} sessionId
 */
export async function endSession(sessionId) {
    if (!sessionId) return;
    await fetch(`${BASE_URL}/api/session/${sessionId}/end`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

// ── Pro history ────────────────────────────────────────────────────────────

/**
 * Fetch all past therapy sessions for the current Pro user.
 * @returns {{ sessions: Array }}
 */
export async function fetchProSessions() {
    const res = await fetch(`${BASE_URL}/api/pro/sessions`, {
        headers: authHeaders(),
    });
    if (res.status === 403) throw new Error('PRO_REQUIRED');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
}

/**
 * Fetch all messages for a specific past session.
 * @param {number} sessionId
 * @returns {{ session: object, messages: Array }}
 */
export async function fetchSessionMessages(sessionId) {
    const res = await fetch(`${BASE_URL}/api/pro/session/${sessionId}`, {
        headers: authHeaders(),
    });
    if (res.status === 403) throw new Error('PRO_REQUIRED');
    if (!res.ok) throw new Error('Failed to fetch session messages');
    return res.json();
}

/**
 * Delete a specific therapy session.
 * @param {number} sessionId
 */
export async function deleteSession(sessionId) {
    const res = await fetch(`${BASE_URL}/api/pro/session/${sessionId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (res.status === 403) throw new Error('PRO_REQUIRED');
    if (!res.ok) throw new Error('Failed to delete session');
    return res.json();
}

// ── Upgrade ────────────────────────────────────────────────────────────────

/**
 * Upgrade the current user to Pro (call after payment confirmation).
 * @returns {{ user: object }}
 */
export async function upgradeToPro() {
    const res = await fetch(`${BASE_URL}/api/pro/upgrade`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Upgrade failed');
    return res.json();
}
