from flask import Flask, request, jsonify
from flask_cors import CORS
# Note: we will use a more robust ML model later. For now, a simple mock or naive logic.

app = Flask(__name__)
CORS(app)

import random

@app.route('/predict_true_cost', methods=['POST'])
def predict_true_cost():
    data = request.json
    try:
        bidder_id = data.get('bidder_id', 'unknown')
        base_cost = float(data.get('base_cost') or data.get('quoted_bid', 0))
        
        # We'll use mock logic or rule-based estimation to simulate ML inference using history
        bidder_history_score = float(data.get('bidder_history_score', random.uniform(0.5, 1.5))) 
        
        # 1. Delay Cost = predicted delay (months) * cost per month
        predicted_delay_months = max(0, 4.0 - (bidder_history_score * 2.5))
        cost_per_month = float(data.get('cost_per_month', 50000))
        delay_cost = predicted_delay_months * cost_per_month
        
        # 2. Overrun Cost = probability of overrun * expected overrun amount
        overrun_prob = max(0, min(1.0, 0.6 - (bidder_history_score * 0.3)))
        expected_overrun = base_cost * 0.15 
        overrun_cost = overrun_prob * expected_overrun
        
        # 3. Maintenance Cost = estimated future repair/maintenance cost
        maintenance_cost = base_cost * 0.05 * max(0.5, (2.0 - bidder_history_score))
        
        # 4. Social Impact Cost = daily public loss * expected delay days
        daily_public_loss = float(data.get('daily_public_loss', 5000))
        expected_delay_days = predicted_delay_months * 30
        social_cost = daily_public_loss * expected_delay_days
        
        # 5. Risk Penalty = score derived from bidder past performance
        risk_penalty = base_cost * max(0, 0.1 * (1.5 - bidder_history_score))
        
        true_cost = base_cost + delay_cost + overrun_cost + maintenance_cost + social_cost + risk_penalty

        return jsonify({
            "bidder_id": bidder_id,
            "base_cost": round(base_cost, 2),
            "delay_cost": round(delay_cost, 2),
            "overrun_cost": round(overrun_cost, 2),
            "maintenance_cost": round(maintenance_cost, 2),
            "social_cost": round(social_cost, 2),
            "risk_penalty": round(risk_penalty, 2),
            "true_cost": round(true_cost, 2)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)
