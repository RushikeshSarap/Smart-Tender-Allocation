from app import app
import json

app.testing = True
client = app.test_client()

print("--- SMART TENDER ALLOCATION SYSTEM LOGS ---")
print("Initializing test case with 5 tailored bidders...")
print("Inputs: delay_cost_per_month=50000, expected_overrun=15%, daily_public_loss=5000\n")

bids = [
    {
        "bidder_id": "Bidder A (High Delay, Low Cost)",
        "base_cost": 80000,
        "bidder_history_score": 0.4, # Poor history -> High delay/risk
    },
    {
        "bidder_id": "Bidder B (Low Delay, Slightly Higher Cost)",
        "base_cost": 95000,
        "bidder_history_score": 1.4, # Excellent history -> Low delay/risk
    },
    {
        "bidder_id": "Bidder C (Average Profile)",
        "base_cost": 90000,
        "bidder_history_score": 1.0, 
    },
    {
        "bidder_id": "Bidder D (Super High Cost, Medium Delay)",
        "base_cost": 150000,
        "bidder_history_score": 0.9, 
    },
    {
        "bidder_id": "Bidder E (Low Cost, Average History)",
        "base_cost": 85000,
        "bidder_history_score": 1.1,
    }
]

results = []

for idx, bid in enumerate(bids):
    print(f"[EVALUATING] Bidder {idx+1}: {bid['bidder_id']}")
    response = client.post('/predict_true_cost', json=bid)
    data = json.loads(response.data)
    results.append(data)
    
    print(json.dumps(data, indent=2))
    print("-" * 50)

# Find Winner (L1 True Cost Logic)
winner = min(results, key=lambda x: x['true_cost'])

print("\n--- SELECTION RESULTS ---")
print(f"Winner Selected: {winner['bidder_id']}")
print(f"Winning True Cost: ${winner['true_cost']:,.2f}")
print(f"Winning Base Cost: ${winner['base_cost']:,.2f}")

# Sort results to present L1 Table
sorted_results = sorted(results, key=lambda x: x['true_cost'])
print("\n--- L1 TABULATION (Ranked by True Cost) ---")
for idx, res in enumerate(sorted_results):
    print(f"Rank {idx+1}: {res['bidder_id']} => True Cost: ${res['true_cost']:,.2f} (Base: ${res['base_cost']:,.2f})")
