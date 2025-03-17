import pytest
from datetime import datetime, timedelta
from ..models import SocialMediaData, Tweet
from rest_framework import status

@pytest.mark.django_db
class TestSocialMediaViews:
    def test_get_social_media_data(self, api_client, test_db_session, sample_social_media_data):
        response = api_client.get('/api/social-media-data/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
        data = response.json()[0]
        assert data['username'] == sample_social_media_data.username
        assert data['company'] == sample_social_media_data.company
        assert data['sentiment'] == sample_social_media_data.sentiment

    def test_get_social_media_data_by_company(self, api_client, test_db_session, sample_social_media_data):
        response = api_client.get(f'/api/social-media-data/by-company/{sample_social_media_data.company}/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
        data = response.json()[0]
        assert data['company'] == sample_social_media_data.company
        assert data['sentiment'] == sample_social_media_data.sentiment
        assert data['score'] == sample_social_media_data.score

    def test_get_social_media_data_by_nonexistent_company(self, api_client):
        response = api_client.get('/api/social-media-data/by-company/NonexistentCo/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 0

class TestDatabaseOperations:
    def test_create_tweet(self, test_db_session):
        tweet = Tweet(
            id="test_tweet_2",
            text="Another test tweet",
            created_at=datetime.now(),
            company="TestCo",
            sentiment_score=0.6,
            sentiment_label="neutral",
            sentiment_confidence=0.8,
            user_username="testuser2",
            user_name="Test User 2",
            user_profile_image_url="http://example.com/image2.jpg",
            user_followers_count=200,
            retweet_count=5,
            reply_count=2,
            like_count=15,
            quote_count=1,
            hashtags="test2,tweet2"
        )
        test_db_session.add(tweet)
        test_db_session.commit()

        # Verify tweet was created
        saved_tweet = test_db_session.query(Tweet).filter(Tweet.id == "test_tweet_2").first()
        assert saved_tweet is not None
        assert saved_tweet.text == "Another test tweet"
        assert saved_tweet.sentiment_score == 0.6

    def test_create_social_media_data(self, test_db_session):
        data = SocialMediaData(
            username="testuser2",
            gender="female",
            likes=20,
            text="Another test content",
            company="TestCo2",
            sentiment="negative",
            score=0.3,
            created_at=datetime.now()
        )
        test_db_session.add(data)
        test_db_session.commit()

        # Verify data was created
        saved_data = test_db_session.query(SocialMediaData).filter(
            SocialMediaData.username == "testuser2"
        ).first()
        assert saved_data is not None
        assert saved_data.company == "TestCo2"
        assert saved_data.sentiment == "negative"

    def test_filter_social_media_data(self, test_db_session):
        # Create multiple records
        companies = ["CompanyA", "CompanyB", "CompanyA"]
        sentiments = ["positive", "negative", "neutral"]
        
        for i, (company, sentiment) in enumerate(zip(companies, sentiments)):
            data = SocialMediaData(
                username=f"user{i}",
                gender="unknown",
                likes=10 * i,
                text=f"Test content {i}",
                company=company,
                sentiment=sentiment,
                score=0.5,
                created_at=datetime.now() - timedelta(days=i)
            )
            test_db_session.add(data)
        test_db_session.commit()

        # Test filtering by company
        company_a_data = test_db_session.query(SocialMediaData).filter(
            SocialMediaData.company == "CompanyA"
        ).all()
        assert len(company_a_data) == 2

        # Test filtering by sentiment
        positive_data = test_db_session.query(SocialMediaData).filter(
            SocialMediaData.sentiment == "positive"
        ).all()
        assert len(positive_data) == 1

        # Test ordering by date
        ordered_data = test_db_session.query(SocialMediaData).order_by(
            SocialMediaData.created_at.desc()
        ).all()
        assert ordered_data[0].username == "user0"
        assert ordered_data[-1].username == f"user{len(companies)-1}"