# SenTrack Backend API 🚀

A powerful Django-based backend API that processes and serves sentiment analysis data for the Twitter Sentiment Dashboard.

## 📊 Overview

The backend system handles data processing, storage, and API endpoints for sentiment analysis of tweets about major companies. Built with Django and Django REST Framework, it provides a robust foundation for the sentiment analysis dashboard.

## ✨ Key Features

- **RESTful API Endpoints**: Complete CRUD operations for tweet data
- **Sentiment Analysis Processing**: Advanced sentiment scoring system
- **Efficient Data Management**: Optimized database operations with PostgreSQL
- **Batch Processing**: Handles large datasets efficiently
- **Authentication System**: Secure API access with token-based authentication
- **Data Validation**: Comprehensive input validation and sanitization

## 🏗️ Technical Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Django         │────▶│  PostgreSQL     │────▶│  Django REST    │
│  Models         │     │  Database       │     │  Framework      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🛠️ Technology Stack

- **Python**: Primary programming language
- **Django**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Database
- **Pandas**: Data processing
- **python-dotenv**: Environment management

## 📦 Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── api/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
└── backend/
    ├── __init__.py
    ├── settings.py
    ├── urls.py
    └── wsgi.py
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL
- Virtual environment (recommended)

### Installation

1. Create and activate virtual environment:
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
# Create .env file in backend directory
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5432/sentrack
SECRET_KEY=your-secret-key
DEBUG=True
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start development server:
```bash
python manage.py runserver
```

## 📡 API Endpoints

### Tweet Data
- `GET /api/tweets/` - List all tweets
- `GET /api/tweets/{id}/` - Retrieve specific tweet
- `POST /api/tweets/` - Create new tweet
- `PUT /api/tweets/{id}/` - Update tweet
- `DELETE /api/tweets/{id}/` - Delete tweet

### Analytics
- `GET /api/analytics/sentiment/` - Get sentiment statistics
- `GET /api/analytics/companies/` - Get company-wise analysis
- `GET /api/analytics/trending/` - Get trending topics

## 🔐 Authentication

The API uses token-based authentication:

```bash
# Request format
curl -X POST http://localhost:8000/api/token/ \
    -H "Content-Type: application/json" \
    -d '{"username": "user", "password": "pass"}'
```

## 📊 Database Schema

### Tweet Model
```python
class Tweet(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    text = models.TextField()
    created_at = models.DateTimeField()
    company = models.CharField(max_length=255)
    sentiment_score = models.FloatField()
    sentiment_label = models.CharField(max_length=20)
    sentiment_confidence = models.FloatField()
    user_username = models.CharField(max_length=255)
    user_name = models.CharField(max_length=255)
    user_profile_image_url = models.URLField()
    user_followers_count = models.IntegerField()
    retweet_count = models.IntegerField()
    reply_count = models.IntegerField()
    like_count = models.IntegerField()
    quote_count = models.IntegerField()
    entities = models.JSONField()
```

## 🧪 Testing Framework

### Setting Up Tests
```bash
# Install test dependencies
pip install pytest pytest-django pytest-cov

# Run all tests with pytest
pytest

# Run tests with verbose output
pytest -v

# Run specific test module
pytest api/tests/test_auth.py
pytest api/tests/test_models.py
pytest api/tests/test_social_media.py

# Run tests and generate coverage report
pytest --cov=api
pytest --cov=api --cov-report=html  # Generates HTML coverage report

# Run tests matching specific pattern
pytest -k "test_auth"  # Runs all tests with "test_auth" in the name

# Run tests and show local variables on failures
pytest -l

# Run tests and break on first failure
pytest -x
```

### Test Structure
```
api/tests/
├── conftest.py          # Test configurations and fixtures
├── test_auth.py         # Authentication tests
├── test_models.py       # Data model tests
└── test_social_media.py # Social media integration tests
```

### Test Coverage
- **Models**: 95%+ coverage
  - Tweet model validation
  - Data integrity checks
  - Field constraints
  - Custom methods

- **Views**: 90%+ coverage
  - API endpoint functionality
  - Authentication/authorization
  - Error handling
  - Response formats

- **Business Logic**: 95%+ coverage
  - Sentiment analysis processing
  - Data aggregation
  - Time series calculations
  - Company statistics

### Testing Best Practices
- Use of pytest fixtures for test data
- Mocking external services
- Database transaction management
- Comprehensive assertion patterns
- Performance testing for batch operations

## 📦 Deployment

Recommended deployment process:

1. Set up production environment variables
2. Collect static files:
```bash
python manage.py collectstatic
```

3. Configure WSGI server (e.g., Gunicorn):
```bash
gunicorn backend.wsgi:application
```

## 📝 License

This project is licensed under the MIT License.