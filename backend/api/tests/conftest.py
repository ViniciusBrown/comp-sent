import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from ..models import SocialMediaData, SearchedCompanies, Tweet, Base, get_db_connection
from datetime import datetime

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user(db):
    user = User.objects.create_user(
        username='testuser@example.com',
        email='testuser@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    return user

@pytest.fixture
def auth_client(api_client, test_user):
    token = AccessToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client

@pytest.fixture
def test_db_session():
    engine, Session = get_db_connection()
    # Create tables
    Base.metadata.create_all(engine)
    # Create session
    session = Session()
    
    yield session
    
    # Cleanup after tests
    session.close()
    Base.metadata.drop_all(engine)

@pytest.fixture
def sample_tweet(test_db_session):
    tweet = Tweet(
        id="test_tweet_1",
        text="Test tweet content",
        created_at=datetime.now(),
        company="TestCo",
        sentiment_score=0.8,
        sentiment_label="positive",
        sentiment_confidence=0.9,
        user_username="testuser",
        user_name="Test User",
        user_profile_image_url="http://example.com/image.jpg",
        user_followers_count=100,
        retweet_count=10,
        reply_count=5,
        like_count=20,
        quote_count=2,
        hashtags="test,tweet"
    )
    test_db_session.add(tweet)
    test_db_session.commit()
    return tweet

@pytest.fixture
def sample_social_media_data(test_db_session):
    data = SocialMediaData(
        username="testuser",
        gender="unknown",
        likes=10,
        text="Test social media content",
        company="TestCo",
        sentiment="positive",
        score=0.8,
        created_at=datetime.now()
    )
    test_db_session.add(data)
    test_db_session.commit()
    return data

@pytest.fixture
def sample_searched_company(test_db_session, test_user):
    company = SearchedCompanies(
        author_id=test_user.id,
        company="TestCo",
        response={"test": "data"},
        created_at=datetime.now()
    )
    test_db_session.add(company)
    test_db_session.commit()
    return company