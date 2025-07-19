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
import WeeklyForecast from './WeeklyForecast';

// --- NEW: (if you want a UV icon, add one, else just use ☀️ below)
// import uv_icon from "../assets/uv.png"; 

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
  const cities = ["Oslo", "Halden", "Lillestrøm", "Side", "Gan", "New York"];
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState('');
  const [hasShownModal, setHasShownModal] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoritesCities');
    return saved ? JSON.parse(saved) : ["Oslo", "Halden", "Lillestrøm"];
  });

  // --- NEW: Add UV index state
  const [uvIndex, setUvIndex] = useState(null);
  const [uvAlert, setUvAlert] = useState('');

  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);
    };
    if (document.readyState === 'complete') {
      setIsLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
    }
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !hasShownModal) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
        setHasShownModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasShownModal]);

  // --- NEW: UV index fetcher
  const fetchUVIndex = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?appid=${import.meta.env.VITE_APP_ID}&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (typeof data.value !== "undefined") {
        setUvIndex(data.value);
        setUvAlert('');
      } else {
        setUvAlert("UV-data ikke tilgjengelig.");
        setUvIndex(null);
      }
    } catch (error) {
      setUvAlert("Feil ved henting av UV-indeks.");
      setUvIndex(null);
    }
  };

  const getForecast = async (lat, lon) => {
    try {
      // Hent 5 dagers forecast
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      // Hent daglig UV (One Call API)
      const uvUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${import.meta.env.VITE_APP_ID}&units=metric`;
      const uvResponse = await fetch(uvUrl);
      const uvData = await uvResponse.json();

      // Gruppér forecast per dag (samme logikk som før)
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

      const processedData = Object.values(groupedData).map((day, idx) => ({
        date: day.date,
        maxTemp: Math.max(...day.temps),
        minTemp: Math.min(...day.temps),
        icon: day.icons[Math.floor(day.icons.length / 2)],
        rainSum: day.rain.reduce((a, b) => a + b, 0),
        uvi: uvData.daily && uvData.daily[idx] ? uvData.daily[idx].uvi : null,
      }));

      setExtendedForecast(processedData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching forecast:", error);
    }
  };

  const search = async (searchData) => {
    setIsLoading(true);
    setAlert('');
    setUvIndex(null); // --- NEW: Clear UV on search
    setUvAlert('');

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
        fetchUVIndex(data.coord.lat, data.coord.lon); // --- NEW: fetch UV
      } else {
        setAlert(`Byen "${searchData}" ble ikke funnet. Prøv igjen med et mer kjent sted eller bynavn nære deg.`);
        setWeatherData(null);
        setExtendedForecast(null);
        setUvIndex(null);
        setUvAlert('');
      }
    } catch (error) {
      setAlert(`Feil ved henting av vær for "${searchData}". Vennligst prøv igjen.`);
      setWeatherData(null);
      setExtendedForecast(null);
      setUvIndex(null);
      setUvAlert('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWeatherData(null);
    setExtendedForecast(null);
    setUvIndex(null); // --- NEW: reset UV
    setUvAlert('');
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUseLocation = () => {
    setShowLocationModal(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${
                import.meta.env.VITE_APP_ID
              }&units=metric`
            );
            const data = await response.json();

            if (data.cod === 200) {
              setWeatherData(data);
              getForecast(latitude, longitude);
              fetchUVIndex(latitude, longitude); // --- NEW: fetch UV
            }
          } catch (error) {
            console.error("Error fetching weather data:", error);
            setUvIndex(null);
            setUvAlert('');
          }
          setShowLocationModal(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setShowLocationModal(false);
          setUvIndex(null);
          setUvAlert('');
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
      setUvIndex(null);
      setUvAlert('');
    }
  };

  const handleManualSearch = () => {
    setShowLocationModal(false);
  };

  const toggleFavorite = (cityName) => {
    if (!cityName) return;
    setFavorites(prev => {
      const newFavorites = prev.includes(cityName)
        ? prev.filter(city => city !== cityName)
        : [...prev, cityName];
      localStorage.setItem('favoritesCities', JSON.stringify(newFavorites));
      return newFavorites;
    });
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
            {favorites.map((city) => (
              <div key={city} className="favorite-city-container">
                <button
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
                <button 
                  className="remove-favorite"
                  onClick={() => toggleFavorite(city)}
                >
                  ×
                </button>
              </div>
            ))}
            {weatherData && (
              <button
                className="add-favorite"
                onClick={() => toggleFavorite(weatherData.name)}
                disabled={favorites.includes(weatherData.name)}
              >
                {favorites.includes(weatherData.name) ? '★' : '☆'} 
                {favorites.includes(weatherData.name) ? 'I favoritter' : 'Legg til i favoritter'}
              </button>
            )}
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
                    {/* --- NEW: UV Index block */}
                    <div className="element">
                      {/* <img src={uv_icon} alt="" className="icon" /> */}
                      <span className="icon" role="img" aria-label="UV">☀️</span>
                      <div className="data">
                        <div className="uv-index">
                          {uvIndex !== null ? uvIndex : "—"}
                        </div>
                        <div className="text">UV-indeks</div>
                      </div>
                    </div>
                  </div>
                  {uvAlert && <div className="alert">{uvAlert}</div>}
                </div>
              </div>
              <WeeklyForecast forecastData={extendedForecast} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Weather;
