import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX


df = pd.read_csv("reservations.csv")


df['datetime'] = pd.to_datetime(df['event_date'] + ' ' + df['event_time'])


df.set_index('datetime', inplace=True)


hourly = df.resample('h').size()
hourly = hourly.to_frame(name='reservations')

print("\n📊 Hourly Data:")
print(hourly.head())


model = SARIMAX(hourly['reservations'],
                order=(1,1,1),
                seasonal_order=(1,1,1,24)) 

results = model.fit()


forecast = results.forecast(steps=24)


forecast = forecast.clip(lower=0)

print("\n🔮 Forecast for next 24 hours:")
print(forecast)



peak_hour = forecast.idxmax()
peak_value = forecast.max()

print("\n🔥 Predicted Peak Hour:")
print(peak_hour)

print("\n📈 Expected Reservations:")
print(peak_value)



forecast_df = forecast.reset_index()
forecast_df.columns = ['datetime', 'predicted_reservations']

forecast_df.to_json("forecast.json", orient="records")

print("\n✅ Forecast saved to forecast.json")