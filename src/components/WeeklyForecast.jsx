import React, { useEffect, useState } from 'react';
import './WeeklyForecast.css';
import clear_icon from "../assets/clear.png";
import cloudy_icon from "../assets/cloudy.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";

function WeeklyForecast({ location }) {
  const [forecastData, setForecastData] = useState(null);

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

  useEffect(() => {
    const getForecast = async () => {
      if (!location) return;
      
      try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();

        // Get one forecast per day (every 8 items = 24 hours)
        const dailyData = data.list.filter((item, index) => index % 8 === 0);
        setForecastData(dailyData);
      } catch (error) {
        console.error("Error fetching forecast:", error);
      }
    };

    getForecast();
  }, [location]);

  if (!forecastData) return null;

  return (
    <div className="weekly-forecast">
      <h2>5-Dagers Værmelding</h2>
      <div className="forecast-container">
        {forecastData.map((day, index) => (
          <div key={index} className="forecast-day">
            <p className="day">
              {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <img 
              src={allIcons[day.weather[0].icon]} 
              alt="" 
              className="forecast-icon"
            />
            <p className="temp">{Math.round(day.main.temp)}°C</p>
            <p className="rain">
              {(day.rain && day.rain['3h']) ? 
                `${Math.round(day.rain['3h'])} mm` : 
                'Ingen nedbør'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyForecast; 