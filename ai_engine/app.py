from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import re
import os
import shutil
import tempfile
import json
from pypdf import PdfReader
from mistralai import Mistral
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f'[AI ENGINE] Loaded environment from {env_path}')
else:
    load_dotenv() # Fallback to local .env

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
mistral_client = Mistral(api_key=MISTRAL_API_KEY) if MISTRAL_API_KEY else None

from pdf2image import convert_from_path
import pytesseract

# If Tesseract is installed but not available on PATH, set the executable path explicitly.
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
]
for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

# If Poppler is installed but not available on PATH, set the executable path explicitly.
POPPLER_PATH = os.getenv('POPPLER_PATH')
if not POPPLER_PATH:
    POPPLER_PATHS = [
        r"C:\Users\rushi\Downloads\poppler-25.12.0\Library\bin",
        r"C:\Program Files\poppler-23.05.0\Library\bin",
        r"C:\Program Files\poppler\Library\bin",
        r"C:\Program Files\poppler\bin",
        r"C:\Program Files (x86)\poppler\Library\bin",
        r"C:\Program Files (x86)\poppler\bin"
    ]
    for path in POPPLER_PATHS:
        if os.path.exists(path):
            POPPLER_PATH = path
            break

print(f'[AI ENGINE] Tesseract path = {pytesseract.pytesseract.tesseract_cmd}', flush=True)
print(f'[AI ENGINE] Poppler path = {POPPLER_PATH}', flush=True)

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'tesseract': pytesseract.pytesseract.tesseract_cmd,
        'poppler_path': POPPLER_PATH
    })

PROJECT_TYPE_MAINTENANCE_FACTORS = {
    'roads': 0.15,
    'building': 0.10,
    'bridge': 0.16,
    'pipeline': 0.14,
    'railway': 0.13,
    'utility': 0.11,
    'infrastructure': 0.14,
    'civil engineering': 0.12,
    'civil': 0.12,
    'default': 0.09
}

IMPORTANCE_DAILY_LOSS = {
    'high': 18000,
    'medium': 8500,
    'low': 3200,
    'default': 6500
}

PROJECT_TYPE_IMPORTANCE = {
    'roads': 'high',
    'bridge': 'high',
    'infrastructure': 'high',
    'building': 'medium',
    'utility': 'medium',
    'railway': 'medium',
    'civil engineering': 'medium',
    'civil': 'medium',
    'pipeline': 'low',
    'default': 'medium'
}


def clean_text(raw_text):
    text = re.sub(r'[^\x00-\x7F]+', ' ', raw_text)
    text = re.sub(r'[\t\r]+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def parse_field(patterns, text, default=''):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return default


def normalize_project_type(value):
    if not value:
        return 'default'
    lower = value.lower()
    for key in PROJECT_TYPE_MAINTENANCE_FACTORS.keys():
        if key in lower:
            return key
    return 'default'


def importance_for_project(project_type):
    return PROJECT_TYPE_IMPORTANCE.get(project_type, 'medium')


def estimate_cost_per_month(total_budget):
    if total_budget <= 100000:
        return total_budget * 0.05
    if total_budget <= 500000:
        return total_budget * 0.04
    if total_budget <= 2000000:
        return total_budget * 0.03
    return total_budget * 0.02


def estimate_predicted_delay(proposed_timeline, avg_delay_days, success_rate, rating_score):
    timeline_factor = max(0.8, min(2.2, proposed_timeline / 90))
    performance_penalty = max(0, (0.75 - success_rate) * 0.9 + (avg_delay_days / 60) * 0.12 + max(0, 4.5 - rating_score) * 0.08)
    delay = max(0.0, min(8.0, timeline_factor * 2.5 + performance_penalty * 4.2))
    return delay


def estimate_overrun_probability(success_rate, avg_delay_days, rating_score, bid_amount, budget):
    base_probability = 0.16
    success_adjust = (1.0 - success_rate) * 0.24
    delay_adjust = min(avg_delay_days / 90, 0.18)
    rating_adjust = max(0.0, (5.0 - rating_score) * 0.05)
    budget_adjust = min(0.12, (bid_amount / max(budget, bid_amount, 1)) * 0.13)
    probability = base_probability + success_adjust + delay_adjust + rating_adjust + budget_adjust
    return max(0.02, min(0.92, probability))


def estimate_risk_score(success_rate, avg_delay_days, rating_score):
    score = 1.0 + (0.6 - success_rate) + (avg_delay_days / 90) + max(0, (4.5 - rating_score) * 0.22)
    return max(0.2, min(2.0, score))


def parse_numeric(value):
    if value is None or value == '':
        return 0.0
    cleaned = re.sub(r'[^0-9\.]', '', str(value))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def format_indian_currency(amount, use_shorthand=False):
    """Formats a number in the Indian currency system (e.g., 1,23,45,678.90 or 1.23 Cr)"""
    if use_shorthand:
        if amount >= 10000000:
            cr_amount = amount / 10000000
            return f"{cr_amount:,.2f} Cr"
        if amount >= 100000:
            lakh_amount = amount / 100000
            return f"{lakh_amount:,.2f} Lakh"
    
    s = f"{abs(int(amount))}"
    decimal_part = f"{amount:.2f}".split('.')[1]
    
    if len(s) <= 3:
        return f"{'-' if amount < 0 else ''}{s}.{decimal_part}"

    last_three = s[-3:]
    remaining = s[:-3]
    
    out = []
    while len(remaining) > 2:
        out.append(remaining[-2:])
        remaining = remaining[:-2]
    out.append(remaining)
    
    formatted_int = ",".join(out[::-1]) + "," + last_three
    return f"{'-' if amount < 0 else ''}{formatted_int}.{decimal_part}"


@app.route('/predict_true_cost', methods=['POST'])
def predict_true_cost():
    print('[AI ENGINE] /predict_true_cost request received')
    data = request.json or {}
    print('[AI ENGINE] predict request body:', data)
    try:
        base_cost = parse_numeric(data.get('base_cost') or data.get('quoted_bid') or 0)
        proposed_timeline = parse_numeric(data.get('proposed_timeline') or data.get('estimated_completion_days') or 90)
        budget = parse_numeric(data.get('project_budget') or data.get('budget') or base_cost)
        project_type = normalize_project_type(data.get('project_type') or '')
        importance = importance_for_project(project_type)

        total_projects = int(parse_numeric(data.get('total_projects') or 0))
        success_rate = parse_numeric(data.get('success_rate') or 0.78)
        avg_delay_days = parse_numeric(data.get('avg_delay_days') or 18)
        rating_score = parse_numeric(data.get('rating_score') or 4.1)

        predicted_delay = estimate_predicted_delay(proposed_timeline, avg_delay_days, success_rate, rating_score)
        overrun_probability = estimate_overrun_probability(success_rate, avg_delay_days, rating_score, base_cost, budget)
        risk_score = estimate_risk_score(success_rate, avg_delay_days, rating_score)

        cost_per_month = estimate_cost_per_month(budget)
        delay_cost = predicted_delay * cost_per_month
        expected_overrun_amount = base_cost * 0.18
        overrun_cost = overrun_probability * expected_overrun_amount
        maintenance_factor = PROJECT_TYPE_MAINTENANCE_FACTORS.get(project_type, PROJECT_TYPE_MAINTENANCE_FACTORS['default'])
        maintenance_cost = base_cost * maintenance_factor
        daily_public_loss = IMPORTANCE_DAILY_LOSS.get(importance, IMPORTANCE_DAILY_LOSS['default'])
        social_cost = daily_public_loss * (predicted_delay * 30)
        risk_penalty = base_cost * min(0.25, 0.08 * risk_score * ((1.2 - success_rate) + (avg_delay_days / 90)))

        true_cost = base_cost + delay_cost + overrun_cost + maintenance_cost + social_cost + risk_penalty

        explanation_parts = [
            f"Evaluated true cost for Bidder {data.get('bidder_id', 'N/A')}."
        ]

        if predicted_delay > 0.5:
            explanation_parts.append(f"Predicted delay of {predicted_delay:.1f} months due to historical performance and timeline factors, adding ₹{format_indian_currency(delay_cost, True)} in overhead.")
        
        if overrun_probability > 0.3:
            explanation_parts.append(f"High overrun risk ({overrun_probability*100:.0f}%) identified based on bidder success rate and budget variance.")

        explanation_parts.append(f"Maintenance cost set at {maintenance_factor*100:.0f}% of base bid for '{project_type}' project.")

        if importance == 'high':
            explanation_parts.append(f"High public impact penalty (₹{format_indian_currency(social_cost, True)}) applied due to project importance and timeline risks.")

        if risk_penalty > (base_cost * 0.05):
            explanation_parts.append(f"Significant risk penalty (₹{format_indian_currency(risk_penalty, True)}) applied due to combination of low success rate and high average delays.")

        explanation = " ".join(explanation_parts)

        return jsonify({
            'predicted_delay': round(predicted_delay, 2),
            'overrun_probability': round(overrun_probability, 2),
            'risk_score': round(risk_score, 2),
            'delay_cost': round(delay_cost, 2),
            'overrun_cost': round(overrun_cost, 2),
            'maintenance_cost': round(maintenance_cost, 2),
            'social_cost': round(social_cost, 2),
            'risk_penalty': round(risk_penalty, 2),
            'base_cost': round(base_cost, 2),
            'true_cost': round(true_cost, 2),
            'explanation': explanation,
            'components': {
                'base_cost': round(base_cost, 2),
                'delay_cost': round(delay_cost, 2),
                'overrun_cost': round(overrun_cost, 2),
                'maintenance_cost': round(maintenance_cost, 2),
                'social_cost': round(social_cost, 2),
                'risk_penalty': round(risk_penalty, 2)
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


def extract_text_from_pdf(pdf_path):
    """Extracts all text from a PDF file using pypdf."""
    try:
        reader = PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        return full_text.strip()
    except Exception as e:
        print(f"[AI ENGINE] pypdf extraction failed: {e}")
        return ""


@app.route('/extract_tender', methods=['POST'])
def extract_tender():
    print('[AI ENGINE] /extract_tender request received')
    if 'file' not in request.files:
        print('[AI ENGINE] extract_tender missing file')
        return jsonify({'error': 'PDF file is required'}), 400

    file = request.files['file']
    if file.filename == '':
        print('[AI ENGINE] extract_tender empty filename')
        return jsonify({'error': 'PDF file is required'}), 400

    if not MISTRAL_API_KEY:
        return jsonify({'error': 'MISTRAL_API_KEY not configured in .env'}), 500

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)
        print('[AI ENGINE] saved PDF to', file_path, flush=True)

        try:
            # 1. Extract text from PDF
            print('[AI ENGINE] Extracting text from PDF...', flush=True)
            document_text = extract_text_from_pdf(file_path)
            
            if not document_text or len(document_text) < 50:
                print('[AI ENGINE] fallback to Tesseract OCR (PDF might be image-based)', flush=True)
                # Fallback to OCR if pypdf returns no text (scanned PDF)
                convert_args = {'dpi': 200}
                if POPPLER_PATH:
                    convert_args['poppler_path'] = POPPLER_PATH
                pages = convert_from_path(file_path, **convert_args)
                document_text = ""
                for page in pages:
                    document_text += pytesseract.image_to_string(page) + "\n"

            if not document_text:
                return jsonify({'error': 'Could not extract text from the PDF.'}), 400

            # 2. Preparation for Mistral
            prompt = f"""
            You are an expert procurement assistant. Extract the following tender details from the provided document text.
            Return the result ENTIRELY as a valid JSON object with the following keys:
            - title: The name or title of the tender.
            - description: A concise summary of the project/tender.
            - estimated_budget: The numeric budget value (extract only the number).
            - deadline: The submission deadline date (YYYY-MM-DD format if possible, else as found).
            - required_experience: Minimum years or specific experience required.
            - project_type: One word category (roads, building, bridge, pipeline, railway, utility, infrastructure, civil).

            Document Text:
            ---
            {document_text[:6000]} 
            ---
            
            JSON format only, no other text.
            """

            print('[AI ENGINE] Sending request to Mistral AI...', flush=True)
            messages = [{"role": "user", "content": prompt}]
            
            chat_response = mistral_client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
                response_format={"type": "json_object"}
            )
            
            extracted_json = chat_response.choices[0].message.content
            print(f'[AI ENGINE] Mistral Response: {extracted_json}', flush=True)
            
            result = json.loads(extracted_json)
            
            # Ensure keys exist
            final_data = {
                'title': result.get('title', ''),
                'description': result.get('description', ''),
                'estimated_budget': str(result.get('estimated_budget', '')),
                'deadline': result.get('deadline', ''),
                'required_experience': result.get('required_experience', ''),
                'project_type': result.get('project_type', ''),
                'raw_text': document_text[:500] + "..." # Just for debugging
            }

            return jsonify(final_data)

        except Exception as e:
            print(f'[AI ERROR] Extraction failed: {str(e)}', flush=True)
            return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
