import pytest
from ..models import (
    Base, get_db_connection, create_tables,
    Tweet, SocialMediaData, SearchedCompanies, CompanyProcessedData
)
from sqlalchemy.exc import OperationalError
from datetime import datetime

class TestDatabaseConnection:
    def test_get_db_connection(self, monkeypatch):
        # Mock environment variable
        monkeypatch.setenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/testdb')
        
        engine, Session = get_db_connection()
        assert engine is not None
        assert Session is not None

    def test_get_db_connection_missing_url(self, monkeypatch):
        # Remove DATABASE_URL from environment
        monkeypatch.delenv('DATABASE_URL', raising=False)
        
        with pytest.raises(ValueError, match="DATABASE_URL environment variable is not set"):
            get_db_connection()

class TestModelDefinitions:
    def test_tweet_model_creation(self, test_db_session):
        tweet = Tweet(
            id="test123",
            text="Test tweet",
            created_at=datetime.now(),
            company="TestCompany",
            sentiment_score=0.75,
            sentiment_label="positive",
            sentiment_confidence=0.85,
            user_username="testuser",
            user_name="Test User",
            user_profile_image_url="http://example.com/image.jpg",
            user_followers_count=1000,
            retweet_count=5,
            reply_count=2,
            like_count=10,
            quote_count=1,
            hashtags="test,tweet"
        )
        test_db_session.add(tweet)
        test_db_session.commit()

        # Test string representation
        assert str(tweet) == "<Tweet(id='test123', company='TestCompany', sentiment='positive')>"

        # Test relationships and cascading
        loaded_tweet = test_db_session.query(Tweet).filter_by(id="test123").first()
        assert loaded_tweet.sentiment_score == 0.75
        assert loaded_tweet.user_username == "testuser"

    def test_social_media_data_model(self, test_db_session):
        data = SocialMediaData(
            username="testuser",
            gender="male",
            likes=100,
            text="Test post",
            company="TestCompany",
            sentiment="positive",
            score=0.8,
            created_at=datetime.now()
        )
        test_db_session.add(data)
        test_db_session.commit()

        loaded_data = test_db_session.query(SocialMediaData).filter_by(username="testuser").first()
        assert loaded_data.company == "TestCompany"
        assert loaded_data.sentiment == "positive"
        assert loaded_data.score == 0.8

    def test_searched_companies_model(self, test_db_session):
        company = SearchedCompanies(
            author_id=1,
            company="TestCompany",
            response={"key": "value"},
            created_at=datetime.now()
        )
        test_db_session.add(company)
        test_db_session.commit()

        loaded_company = test_db_session.query(SearchedCompanies).filter_by(company="TestCompany").first()
        assert loaded_company.author_id == 1
        assert loaded_company.response == {"key": "value"}

    def test_company_processed_data_model(self, test_db_session):
        data = CompanyProcessedData(
            company="TestCompany",
            likes=500,
            top_comments="Test comments",
            created_at=datetime.now()
        )
        test_db_session.add(data)
        test_db_session.commit()

        loaded_data = test_db_session.query(CompanyProcessedData).filter_by(company="TestCompany").first()
        assert loaded_data.likes == 500
        assert loaded_data.top_comments == "Test comments"

class TestDatabaseOperations:
    def test_create_tables(self, monkeypatch):
        monkeypatch.setenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/testdb')
        engine, _ = get_db_connection()
        
        # Drop all tables first
        Base.metadata.drop_all(engine)
        
        # Test table creation
        create_tables()
        
        # Verify tables exist
        inspector = engine.dialect.inspector
        table_names = inspector.get_table_names()
        
        assert 'tweets' in table_names
        assert 'social_media_data' in table_names
        assert 'searched_companies' in table_names
        assert 'company_processed_data' in table_names

    def test_session_management(self, test_db_session):
        # Test basic session operations
        tweet = Tweet(
            id="session_test",
            text="Session test tweet",
            created_at=datetime.now(),
            company="TestCompany",
            sentiment_score=0.5,
            sentiment_label="neutral",
            sentiment_confidence=0.7,
            user_username="testuser",
            user_name="Test User",
            user_profile_image_url="http://example.com/image.jpg",
            user_followers_count=100,
        )
        
        # Test adding
        test_db_session.add(tweet)
        test_db_session.commit()
        
        # Test querying
        loaded_tweet = test_db_session.query(Tweet).filter_by(id="session_test").first()
        assert loaded_tweet is not None
        
        # Test updating
        loaded_tweet.sentiment_score = 0.8
        test_db_session.commit()
        
        # Verify update
        updated_tweet = test_db_session.query(Tweet).filter_by(id="session_test").first()
        assert updated_tweet.sentiment_score == 0.8
        
        # Test deleting
        test_db_session.delete(loaded_tweet)
        test_db_session.commit()
        
        # Verify deletion
        deleted_tweet = test_db_session.query(Tweet).filter_by(id="session_test").first()
        assert deleted_tweet is None