from flask import Blueprint, jsonify, request

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/<module_id>', methods=['GET'])
def get_quiz(module_id):
    """Return quiz questions for a module."""
    return jsonify({'questions': [], 'module_id': module_id})

@quiz_bp.route('/submit', methods=['POST'])
def submit_quiz():
    """Accept quiz answers and return score."""
    data = request.get_json()
    return jsonify({'score': 0, 'feedback': []})
