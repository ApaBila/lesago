import functions_framework
from flask import jsonify
from google.cloud import firestore
import re
import firebase_admin
from firebase_admin import auth
from functools import wraps
import heapq

firebase_admin.initialize_app()
db = firestore.Client()


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }


def require_auth(f):
    @wraps(f)
    def decorated_function(request):
        if request.method == 'OPTIONS':
            return '', 204, get_cors_headers()
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                raise ValueError('Missing or invalid Authorization header')
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            request.user_email = decoded_token['email']
        except Exception as e:
            return 'Unauthorized', 401, get_cors_headers()
        return f(request)
    return decorated_function


@firestore.transactional
def update_word_count(transaction, doc_ref, word):
    snapshot = doc_ref.get(transaction=transaction)
    if not snapshot.exists:
        transaction.set(doc_ref, {'counts': {word: 1}})
        return
    counts_map = snapshot.get('counts')
    if not isinstance(counts_map, dict):
        counts_map = {}
    new_count = counts_map.get(word, 0) + 1
    transaction.update(doc_ref, {f'counts.{word}': new_count})


@functions_framework.http
@require_auth
def addSubmission(request):
    user_email = request.user_email
    data = request.get_json(silent=True)
    if not data or 'text' not in data or not data['text'].strip():
        return 'Invalid input', 400, get_cors_headers()

    text = data['text'].strip().lower()
    if len(re.findall(r'\b\w+\b', text)) != 1:
        return 'Input must be a single word', 400, get_cors_headers()

    submission_ref = db.collection('submissions').document()
    submission_ref.set({
        'text': text,
        'timestamp': firestore.SERVER_TIMESTAMP,
        'email': user_email
    })

    aggregate_ref = db.collection('aggregates').document('word_counts')
    transaction = db.transaction()
    update_word_count(transaction, aggregate_ref, text)

    return jsonify({'status': 'success'}), 200, get_cors_headers()


@functions_framework.http
@require_auth
def getMySubmission(request):
    user_email = request.user_email
    query = db.collection('submissions').where('email', '==', user_email).order_by(
        'timestamp', direction=firestore.Query.DESCENDING).limit(1)
    docs = query.stream()
    last_submission = next(docs, None)
    submission_text = ''

    if last_submission:
        submission_data = last_submission.to_dict()
        if submission_data:
            submission_text = submission_data.get('text', '')

    return jsonify({'text': submission_text}), 200, get_cors_headers()


@functions_framework.http
def getWordCloud(request):
    if request.method == 'OPTIONS':
        return '', 204, get_cors_headers()

    aggregate_ref = db.collection('aggregates').document('word_counts')
    word_counts_doc = aggregate_ref.get()

    word_list = []
    if word_counts_doc.exists:
        doc_dict = word_counts_doc.to_dict()
        all_counts = doc_dict.get('counts', {}) if doc_dict else {}
        if all_counts:
            top_words = heapq.nlargest(
                100, all_counts.items(), key=lambda item: item[1])
            word_list = [[word, count] for word, count in top_words]

    return jsonify(word_list), 200, get_cors_headers()
