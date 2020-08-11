require('dotenv').config();
const express = require('express');
var cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const request = require('superagent');

app.use(cors());

const { 
    GEOCODE_API_KEY,
    WEATHER_API_KEY,
    HIKING_API_KEY,
    YELP_API_KEY,
} = process.env;

async function getLatLong(cityName) {
    const response = await request.get(`https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`);
   
    const city = response.body[0];

    return {
        formatted_query: city.display_name,
        latitude: city.lat,
        longitude: city.lon
    };
}

async function getWeather(lat, lon) {
    const response = await request.get(`https://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`);
    
    let data = response.body.data;
    data = data.slice(0, 9);
    
    const forecastArray = data.map((weatherItem) => {
        return {
            forecast: weatherItem.weather.description,
            time: new Date(weatherItem.ts * 1000),
        };
    
    });
    return forecastArray;
}

async function getTrails(lat, lon) {
    const response = await request.get(`https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=200&key=${HIKING_API_KEY}`);

    let data = response.body.trails;

    console.log(data);
    let hikeArray = data.map((hike) => {
        return {
            name: hike.name,
            location: hike.location,
            length: hike.length,
            stars: hike.stars,
            star_votes: hike.starVotes,
            summary: hike.summary,
            trail_url: hike.url,
            conditions: hike.conditionStatus,
            condition_date: hike.conditionDate
        };
    });
    return hikeArray;
}

async function getYelp(lat, lon) {
    const response = await request.get(`https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lon}`).set('Authorization', `Bearer ${YELP_API_KEY}`);

    let reviewData = response.body.businesses;
    let reviewArray = reviewData.map((review) => {
        return {
            name: review.name,
            image_url: review.image_url,
            price: review.price,
            rating: review.rating,
            url: review.url,
        };
    });
    return reviewArray;
}

app.get('/reviews', async(req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = await getYelp(userLat, userLon);
        res.json(mungedData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    } 
});

app.get('/location', async(req, res) => {
    try {
        const userInput = req.query.search;
    
        const mungedData = await getLatLong(userInput);

        res.json(mungedData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    } 
});

app.get('/weather', async(req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = await getWeather(userLat, userLon);
        res.json(mungedData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/trails', async(req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = await getTrails(userLat, userLon);
        res.json(mungedData);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});