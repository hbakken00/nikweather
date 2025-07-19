import React from 'react';
import './WeeklyForecast.css';
import clear_icon from "../assets/clear.png";
import cloudy_icon from "../assets/cloudy.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";

const allIcons = {
  "01d": clear_icon,
  "01n": clear_icon,
  "02d": cloudy_icon,
  "02n": cloudy_icon,
  "03d": cloudy_icon,
  "03n": cloudy_icon,
  "04d": drizzle_icon,
  "04n": drizzle_icon,
  "09d": rain_icon,
  "09n": rain_icon,
  "10d": rain_icon,
  "10n": rain_icon,
  "13d": snow_icon,
  "13n": snow_icon,
};

function WeeklyForecast({ forecastData }) {
  if (!forecastData) return null;

  return (
    <div className="weekly-forecast">
      <h2>5 day forecast</h2>
      <div className="forecast-container">
        {forecastData.map((day, index) => (
          <div key={index} className="forecast-day">
            <p className="day">
              {new Date(day.date * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <img 
              src={allIcons[day.icon]} 
              alt="" 
              className="forecast-icon"
            />
            <p className="temp">{Math.round(day.maxTemp)}°C</p>
            <p className="min-temp">{Math.round(day.minTemp)}°C</p>
            <p className="description">{day.description}</p>
            <p className="rain">
              {day.rainSum > 0
                ? `${day.rainSum.toFixed(1)} mm`
                : 'Ingen nedbør'}
            </p>
            <p className="uv">
              UV: {day.uvi !== null && day.uvi !== undefined ? day.uvi : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyForecast;

// WeeklyForecast.jsx