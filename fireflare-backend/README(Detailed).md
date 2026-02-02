# Fireflare Backend

Welcome to Fireflare's backend - a comprehensive wildfire monitoring and air quality tracking system.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB Atlas account
- API Keys (see Environment Setup)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables (see Environment Setup section)
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Running the Server

```bash
# Development server
python3 backend.py

# Production server (using gunicorn)
gunicorn --bind 0.0.0.0:8080 backend:app
```

Server will be available at `http://localhost:8080`

### Testing

```bash
# Run all tests
python run_tests.py

# Run specific test categories
python run_tests.py --unit --clustering
python run_tests.py --api  # Requires server to be running

# Quick testing (skip manual tests)
python run_tests.py --quick
```

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
# MongoDB Configuration
MONGO_CLUSTER_URL=your_mongodb_connection_string

# API Keys
MAP_KEY=your_mapbox_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
OPEN_AQ_API_KEY=your_openaq_api_key

# API Base URLs
OPEN_AQ_BASE=https://api.openaq.org/v3

# Server Configuration (optional)
PORT=8080
```

## 📊 Core Features

### 🔥 NASA Wildfire Data Integration
- Real-time wildfire data from NASA FIRMS API
- Intelligent clustering to reduce payload size by up to 97%
- Dual storage architecture (original + clustered data)
- Configurable clustering distance (currently 1.4km)
- Geographic coverage: North America (-140°W to -50°W, 24°N to 72°N)

### 🌬️ Air Quality Monitoring
- Multi-source AQI data (OpenWeather + OpenAQ)
- EPA-standard AQI calculations (0-500 scale)
- Geographic grid-based sampling with wildfire risk prioritization
- Real-time PM2.5 to AQI conversion
- Coverage expanded to include Canada and Alaska

### 👥 User & Report Management  
- User authentication and profile management
- Community wildfire reporting system
- Moderator approval workflow
- Real-time notifications via Server-Sent Events
- Geographic proximity-based alerts

## 📡 API Endpoints

### Wildfire Data
```javascript
// Get clustered wildfire data (optimized for frontend)
GET /wildfires/nasa

// Get original complete data (for analysis)
GET /wildfires/nasa/original

// Force refresh from NASA API
POST /wildfires/nasa/refresh

// Get clustering statistics
GET /wildfires/clustering/stats

// Configure clustering
GET/POST /wildfires/clustering/config
```

### Air Quality Data
```javascript
// Latest OpenWeather AQI data
GET /aq/openweather/latest

// OpenAQ data with filtering
GET /aq/openaq/latest?bbox=minLon,minLat,maxLon,maxLat&min_aqi=50

// PM2.5 to AQI conversion
POST /aq/convert/pm25
```

### User Management
```javascript
// User operations
POST /users/create
PATCH /users/update
GET /users/check/{user_id}

// Report management  
POST /reports/create
POST /reports/approve
GET /reports/all
GET /reports/{user_id}

// Notifications
GET /notifications/stream?userID={id}
GET /notifications/unseen/{user_id}
```

### Utilities
```javascript
// Health check
GET /health
```

## 🗂️ Database Collections

- **NasaWildfires**: Wildfire data with dual storage (original + clustered)
- **openWeatherAQIData**: Air quality readings from grid sampling
- **Reports**: Community wildfire reports
- **Users**: User profiles and authentication data
- **Moderators**: Moderator accounts and permissions
- **Notifications**: Real-time user notifications

## 🏗️ Architecture

### Data Processing Pipeline
1. **Grid Generation**: Dynamic point density based on wildfire risk zones
2. **API Integration**: Batch processing with rate limiting
3. **Data Storage**: Dual storage for performance and data integrity
4. **Clustering Algorithm**: Haversine distance-based point grouping
5. **Real-time Updates**: 4-hour refresh cycle with manual override

### Clustering System
- **Algorithm**: Geographic clustering using Haversine distance
- **Performance**: ~97% payload reduction (18.9MB → 598KB)
- **Flexibility**: Configurable distance thresholds
- **Data Integrity**: Original data always preserved

## 📊 Air Quality Data Sources

### OpenWeather (Primary)
OpenWeather provides reliable air quality data, but requires point-specific requests. Our solution:

- **Grid Sampling**: Intelligent geographic grid with variable density
- **Risk-Based Density**: More points in high wildfire risk areas (CA forests, Pacific Northwest, Northern Rockies)
- **EPA AQI Conversion**: PM2.5 concentrations converted to standard 0-500 AQI scale
- **Batch Processing**: Optimized API calls with rate limiting
- **MongoDB Storage**: GeoJSON format for efficient spatial queries

### OpenAQ (Secondary)
OpenAQ provides supplementary data but has limitations:
- Inconsistent geographic coverage in North America
- Variable point locations that change daily
- Requires complex data transformation for civilian-readable metrics

The hybrid approach ensures comprehensive coverage while maintaining data quality.

## 🧪 Testing Framework

Comprehensive testing suite with multiple categories:

- **Unit Tests**: Core backend functionality (`tests/tests.py`)
- **Clustering Tests**: Algorithm validation (`tests/clustering/test_clustering.py`)  
- **Integration Tests**: Data flow validation (`tests/integration/test_dual_storage.py`)
- **API Tests**: Live endpoint testing (`tests/api/test_api_endpoints.py`)

See [`TESTING.md`](TESTING.md) for detailed testing documentation.

## 📁 Project Structure

```
fireflare-backend/
├── backend.py              # Main Flask application
├── requirements.txt        # Python dependencies
├── .env.local             # Environment variables (create from .env.example)
├── scripts/
│   └── fetchAQI.py        # AQI data collection script
├── utils/
│   ├── externalapi.py     # API integration utilities
│   ├── geo.py             # Geographic and clustering functions
│   ├── boundaries.py      # Wildfire risk zone definitions
│   └── calculate.py       # Mathematical utilities
├── tests/                 # Comprehensive test suite
├── docs/
│   ├── TESTING.md         # Testing documentation
│   └── CLUSTERING_README.md # Clustering implementation details
└── migration_scripts/     # Database migration utilities
```

## 🔄 Deployment

### Development
```bash
python3 backend.py
```

### Production
```bash
# Using gunicorn (recommended)
gunicorn --bind 0.0.0.0:8080 --workers 4 backend:app

# Using Docker (if Dockerfile available)
docker build -t fireflare-backend .
docker run -p 8080:8080 fireflare-backend
```

## 📈 Performance Metrics

- **Clustering Efficiency**: 97% payload reduction on average
- **API Response Time**: Sub-second for clustered data endpoints
- **Data Freshness**: 4-hour automatic refresh cycle
- **Geographic Coverage**: Complete North American wildfire zones
- **AQI Processing**: Real-time PM2.5 to EPA AQI conversion

## 🤝 Contributing

1. Create feature branch from `main`
2. Run comprehensive tests: `python run_tests.py --all`
3. Ensure API tests pass with server running
4. Submit pull request with detailed description

## 📚 Additional Resources

- **Clustering Documentation**: [`CLUSTERING_README.md`](CLUSTERING_README.md)
- **Testing Guide**: [`TESTING.md`](TESTING.md)  
- **API Reference**: See endpoint documentation in `backend.py`
- **NASA FIRMS API**: [NASA Fire Information for Resource Management System](https://firms.modaps.eosdis.nasa.gov/)
- **OpenWeather AQI**: [OpenWeather Air Pollution API](https://openweathermap.org/api/air-pollution) 


## Air Quality Data

Air quality data was originally sourced from OpenAQ, a free online API sourcing air quality data. OpenAQ provided enough data for its purpose: it demonstrated that air quality data is contextually critical and useful to measure when considering wildfires, but not enough data for it to be a viable solution. I realized this early on, but could no seek out a more consistent reliable source in such a short time crunch. I knew that there would have to be a significant effort taken to integrate air quality data in. This was refactored and enhanced in early 2026 to source data from open weather instead.

# Open AQ

OpenAQ provides free data, but this data doesn't cover North America, rather it only polls specific random points around the United States. The random points are inconsistent and can move around every single day. It also requries us to do several costly computations to convert data into a interpretable air quality metric, consistent with civilian-facing weather data. 

# OpenWeather

OpenWeather provides a generous endpoint for air quality, but it is only pollable for specific points. I decided to create a helper function to generate a grid of points. Point density changes depending on the geographical region of the United States. More points are polled in areas with a higher risk of wildfires, such as the forests of California, the Pacific Northwest, the Northern Rockies, etc. We process batches of these points to fetch data from the Open Weather API, and then finally store the results into MongoDB. 