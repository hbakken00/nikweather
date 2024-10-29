import React, { useRef, useState, useEffect } from "react";
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

const LocationModal = ({ onUseLocation, onManualSearch }) => {
  return (
    <div className="location-modal">
      <div className="modal-content">
        <h2>Posisjonstilgang</h2>
        <p>Vil du bruke din nåværende posisjon for værinformasjon?</p>
        <div className="modal-buttons">
          <button 
            className="modal-button primary"
            onClick={onUseLocation}
          >
            Bruk Min Posisjon
          </button>
          <button 
            className="modal-button"
            onClick={onManualSearch}
          >
            Søk etter steder i hele verden
          </button>
        </div>
      </div>
    </div>
  );
};

function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [extendedForecast, setExtendedForecast] = useState(null);
  const inputRef = useRef(null);
  const cities = ["Oslo", "Halden", "Lillestrøm", "Side", "Gan", "New York", "Sørumsand", "Tønsberg", "Horten"];
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState('');

  useEffect(() => {
    window.addEventListener('load', () => {
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('load', () => {
        setIsLoading(false);
      });
    };
  }, []);

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
    setIsLoading(true);
    setAlert('');
    
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
      } else {
        setAlert(`Byen "${searchData}" ble ikke funnet. Prøv igjen med et mer kjent sted eller bynavn nære deg.`);
        setWeatherData(null);
        setExtendedForecast(null);
      }
    } catch (error) {
      setAlert(`Feil ved henting av vær for "${searchData}". Vennligst prøv igjen.`);
      setWeatherData(null);
      setExtendedForecast(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWeatherData(null);
    setExtendedForecast(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Fetch weather data using coordinates
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${
                import.meta.env.VITE_APP_ID
              }&units=metric`
            );
            const data = await response.json();

            if (data.cod === 200) {
              setWeatherData(data);
              // Also fetch forecast data
              getForecast(latitude, longitude);
            }
          } catch (error) {
            console.error("Error fetching weather data:", error);
          }

          setShowLocationModal(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setShowLocationModal(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setShowLocationModal(false);
    }
  };

  const handleManualSearch = () => {
    setShowLocationModal(false);
    // You can optionally focus the search input here
  };

  return (
    <div className={`weather ${!isLoading ? 'loaded' : ''}`}>
      {isLoading ? (
        <div className="loading-spinner">
          Laster...
        </div>
      ) : (
        <>
          {showLocationModal && (
            <LocationModal 
              onUseLocation={handleUseLocation}
              onManualSearch={handleManualSearch}
            />
          )}
          <div className="search-container">
            <button className="back-button" onClick={handleReset}>
              Tilbake
            </button>
            <div className="searchbar">
              <input
                ref={inputRef}
                type="text"
                placeholder="Søk etter steder"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    search(inputRef.current?.value || "");
                  }
                }}
              />
              <img
                src={search_icon}
                alt="Search"
                onClick={() => search(inputRef.current?.value || "")}
              />
            </div>
          </div>

          {alert && (
            <div className="alert">
              {alert}
            </div>
          )}

          <div className="location-button-container">
            <button
              className="city-button"
              onClick={handleUseLocation}
            >
              Hent Min Posisjon
            </button>
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
                        <div className="text">Luftfuktighet</div>
                      </div>
                    </div>
                    <div className="element">
                      <img src={wind_icon} alt="" className="icon" />
                      <div className="data">
                        <div className="wind-speed">
                          {Math.round(weatherData.wind.speed)} km/h
                        </div>
                        <div className="text">Vindhastighet</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {extendedForecast && (
                <div className="forecast-section">
                  <h2>5-Dag Forecast</h2>
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
                            : "Ingen regn"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Weather;
