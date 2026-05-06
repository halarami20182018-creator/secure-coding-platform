import os, json
from flask import Blueprint, jsonify, request, abort
from models.auth import login_required

challenges_bp = Blueprint('challenges', __name__)

CHALLENGES_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'content', 'challenges', 'challenges.json'
)


def load_challenges():
    if not os.path.exists(CHALLENGES_FILE):
        return []
    with open(CHALLENGES_FILE, encoding='utf-8') as f:
        return json.load(f)


@challenges_bp.route('/', methods=['GET'])
@login_required
def get_challenges():
    challenges = load_challenges()
    summaries = []
    for c in challenges:
        summaries.append({
            'id':             c['id'],
            'module_id':      c['module_id'],
            'title':          c['title'],
            'difficulty':     c['difficulty'],
            'estimated_time': c['estimated_time'],
            'description':    c['description'],
            'language':       c['language'],
        })
    return jsonify({'challenges': summaries})


@challenges_bp.route('/<challenge_id>', methods=['GET'])
@login_required
def get_challenge(challenge_id):
    challenges = load_challenges()
    challenge  = next((c for c in challenges if c['id'] == challenge_id), None)
    if not challenge:
        abort(404)
    # Strip solution keywords before sending to client
    safe = {k: v for k, v in challenge.items() if k != 'solution_keywords'}
    return jsonify(safe)


@challenges_bp.route('/submit', methods=['POST'])
@login_required
def submit_challenge():
    data         = request.get_json() or {}
    challenge_id = data.get('challenge_id', '')
    user_code    = data.get('code', '').strip()

    if not user_code:
        return jsonify({'error': 'No code submitted.'}), 400

    challenges = load_challenges()
    challenge  = next((c for c in challenges if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'error': 'Challenge not found.'}), 404

    keywords = challenge.get('solution_keywords', [])
    matched  = [kw for kw in keywords if kw.lower() in user_code.lower()]
    score    = round((len(matched) / len(keywords)) * 100) if keywords else 0
    passed   = score >= 75

    return jsonify({
        'passed':      passed,
        'score':       score,
        'matched':     matched,
        'total':       len(keywords),
        'explanation': challenge.get('explanation', ''),
        'feedback': (
            'Well done! Your solution uses the key secure coding patterns.'
            if passed else
            f'Not quite — make sure your solution includes: '
            f'{", ".join(kw for kw in keywords if kw not in matched)}.'
        ),
    })
