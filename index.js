const express = require('express');
var cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const weatherData = require('./data/weather.js');
const request = require('superagent');

app.use(cors());

const { GEOCODE_API_KEY } = process.env;

async function getLatLong(cityName) {
    const response = await request.get(`https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`);
   
    const city = response.body[0];

    return {
        formatted_query: city.display_name,
        latitude: city.lat,
        longitude: city.lon
    };
}

function getWeather(lat, lon) {
    const data = weatherData.data;

    const forecastArray = data.map((weatherItem) => {
        return {
            forecast: weatherItem.weather.description,
            time: new Date(weatherItem.ts * 1000),
        };
    
    });
    return forecastArray;
}

app.get('/location', async(req, res) => {
    try {
        const userInput = req.query.search;
    
        const mungedData = await getLatLong(userInput);

        res.json(mungedData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    } 
});

app.get('/weather', (req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = getWeather(userLat, userLon);
        res.json(mungedData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});