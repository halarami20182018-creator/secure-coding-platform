import os, json
from flask import Blueprint, jsonify, abort
from models.auth import login_required

modules_bp = Blueprint('modules', __name__)
CONTENT_DIR = os.path.join(os.path.dirname(__file__), '..', 'content', 'modules')
MODULE_ORDER = ['sql-injection','xss','insecure-auth','path-traversal','buffer-overflow']

def load_module(mid):
    path = os.path.join(CONTENT_DIR, mid.replace('-','_') + '.json')
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as f:
        return json.load(f)

@modules_bp.route('/', methods=['GET'])
@login_required
def get_all_modules():
    modules = []
    for mid in MODULE_ORDER:
        m = load_module(mid)
        if m:
            modules.append({
                'id': m['id'], 'title': m['title'],
                'owasp_category': m['owasp_category'], 'cwe': m.get('cwe',[]),
                'difficulty': m['difficulty'], 'estimated_time': m['estimated_time'],
                'description': m['description'],
                'objective_count': len(m.get('learning_objectives',[])),
                'section_count': len(m.get('sections',[])),
                'quiz_count': len(m.get('quiz',[])),
            })
    return jsonify({'modules': modules, 'total': len(modules)})

@modules_bp.route('/<module_id>', methods=['GET'])
@login_required
def get_module(module_id):
    m = load_module(module_id)
    if not m:
        abort(404)
    return jsonify(m)
