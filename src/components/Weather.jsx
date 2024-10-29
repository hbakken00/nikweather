import React, { useRef, useState } from "react";
import "./Weather.css";
import search_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloudy_icon from "../assets/cloudy.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";
import wind_icon from "../assets/wind.png";
import humidity_icon from "../assets/humidity.png";

const allIcons = {
  "01d": clear_icon,
  "01n": clear_icon,
  "02d": cloudy_icon,
  "02n": cloudy_icon,
  "03d": cloudy_icon,
  "03n": cloudy_icon,
  "04d": cloudy_icon,
  "04n": cloudy_icon,
  "09d": drizzle_icon,
  "09n": drizzle_icon,
  "10d": rain_icon,
  "10n": rain_icon,
  "13d": snow_icon,
  "13n": snow_icon,
};

function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [extendedForecast, setExtendedForecast] = useState(null);
  const inputRef = useRef(null);
  const cities = ["Oslo", "Halden", "Lillestrøm", "Alanya", "London"];

  const getForecast = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${
          import.meta.env.VITE_APP_ID
        }&units=metric`
      );
      const data = await response.json();

      const groupedData = data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = {
            date: item.dt,
            temps: [],
            icons: [],
            rain: [],
          };
        }
        acc[date].temps.push(item.main.temp);
        acc[date].icons.push(item.weather[0].icon);
        acc[date].rain.push(item.rain ? item.rain["3h"] : 0);
        return acc;
      }, {});

      const processedData = Object.values(groupedData).map((day) => ({
        date: day.date,
        maxTemp: Math.max(...day.temps),
        minTemp: Math.min(...day.temps),
        icon: day.icons[Math.floor(day.icons.length / 2)],
        rainSum: day.rain.reduce((a, b) => a + b, 0),
      }));

      setExtendedForecast(processedData);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    }
  };

  const search = async (searchData) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchData}&appid=${
          import.meta.env.VITE_APP_ID
        }&units=metric`
      );
      const data = await response.json();

      if (data.cod === 200) {
        setWeatherData(data);
        getForecast(data.coord.lat, data.coord.lon);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const handleReset = () => {
    setWeatherData(null);
    setExtendedForecast(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="weather">
      <div className="search-container">
        {weatherData && (
          <button className="back-button" onClick={handleReset}>
            Back
          </button>
        )}
        <div className="searchbar">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search locations"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                search(inputRef.current?.value || "");
              }
            }}
          />
          <img
            src={search_icon}
            alt=""
            onClick={() => search(inputRef.current?.value || "")}
          />
        </div>
      </div>

      <div className="city-buttons">
        {cities.map((city) => (
          <button
            key={city}
            className="city-button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = city;
                search(city);
              }
            }}
          >
            {city}
          </button>
        ))}
      </div>

      {weatherData && (
        <>
          <div className="weather-info">
            <div className="temperature">
              <img src={allIcons[weatherData.weather[0].icon]} alt="" />
              <h1>{Math.round(weatherData.main.temp)}°C</h1>
            </div>
            <div className="description">
              <h2>{weatherData.name}</h2>
              <div className="weather-details">
                <div className="element">
                  <img src={humidity_icon} alt="" className="icon" />
                  <div className="data">
                    <div className="humidity-percent">
                      {Math.round(weatherData.main.humidity)}%
                    </div>
                    <div className="text">Humidity</div>
                  </div>
                </div>
                <div className="element">
                  <img src={wind_icon} alt="" className="icon" />
                  <div className="data">
                    <div className="wind-speed">
                      {Math.round(weatherData.wind.speed)} km/h
                    </div>
                    <div className="text">Wind Speed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {extendedForecast && (
            <div className="forecast-section">
              <h2>5-Day Forecast</h2>
              <div className="forecast-list">
                {extendedForecast.slice(0, 5).map((day, index) => (
                  <div key={index} className="forecast-item">
                    <div className="forecast-date">
                      {new Date(day.date * 1000).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <img
                      src={allIcons[day.icon]}
                      alt=""
                      className="forecast-icon"
                    />
                    <div className="forecast-temp">
                      <span className="max-temp">
                        {Math.round(day.maxTemp)}°
                      </span>
                      <span className="min-temp">
                        {Math.round(day.minTemp)}°
                      </span>
                    </div>
                    <div className="forecast-rain">
                      {day.rainSum > 0
                        ? `${day.rainSum.toFixed(1)}mm`
                        : "No rain"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Weather;
