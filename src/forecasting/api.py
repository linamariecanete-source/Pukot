from flask import Flask, jsonify
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_forecast():
    df = pd.read_csv("reservations.csv")

    df['datetime'] = pd.to_datetime(df['event_date'] + ' ' + df['event_time'])
    df.set_index('datetime', inplace=True)

    hourly = df.resample('h').size()
    hourly = hourly.to_frame(name='reservations')

    model = SARIMAX(hourly['reservations'],
                    order=(1,1,1),
                    seasonal_order=(1,1,1,24))

    results = model.fit()

    forecast = results.forecast(steps=24)
    forecast = forecast.clip(lower=0).round()

    peak_time = forecast.idxmax()
    peak_value = forecast.max()

    return forecast, peak_time, peak_value



@app.route("/")
def home():
    return "Forecast API is running!"
@app.route('/forecast', methods=['GET'])
def forecast_api():
    forecast, peak_time, peak_value = get_forecast()

    forecast_dict = {
        str(k): float(v)
        for k, v in forecast.items()
    }

    staffing = recommend_staff(forecast)

    result = {
        "forecast": forecast_dict,
        "staffing_plan": staffing,  # 🔥 NEW
        "peak_hour": str(peak_time),
        "expected_reservations": float(peak_value)
    }

    return jsonify(result)

def recommend_staff(forecast):
    staff_plan = []

    for time, value in forecast.items():
        if value <= 2:
            staff = 1
        elif value <= 5:
            staff = 2
        else:
            staff = 4

        staff_plan.append({
            "time": str(time),
            "expected_reservations": float(value),
            "recommended_staff": staff
        })

    return staff_plan

if __name__ == '__main__':
    app.run(debug=True)