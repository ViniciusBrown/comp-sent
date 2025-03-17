from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import mapped_column, sessionmaker, relationship, Mapped
from sqlalchemy import create_engine
from django.conf import settings
from datetime import datetime as dt
from typing import List
import os

Base = declarative_base()

class SocialMediaData(Base):
  __tablename__ = 'social_media_data'

  id = mapped_column(Integer, primary_key=True)
  username = mapped_column(String(100))
  gender = mapped_column(String(100))
  likes = mapped_column(Integer)
  text = mapped_column(String(1000))
  company = mapped_column(String(100))
  sentiment = mapped_column(String(100))
  score = mapped_column(Float)
  created_at = mapped_column(DateTime)


class SearchedCompanies(Base):
  __tablename__ = 'searched_companies'

  id = mapped_column(Integer, primary_key=True)
  author_id = mapped_column(Integer)
  company = mapped_column(String(100))
  response = mapped_column(JSON)
  created_at = mapped_column(DateTime, default=dt.now)


class CompanyProcessedData(Base):
  __tablename__ = 'company_processed_data'

  id = mapped_column(Integer, primary_key=True)
  company = mapped_column(String(100))
  likes = mapped_column(Integer)
  top_comments = mapped_column(String(1000))#relationship(SocialMediaData)
  created_at = mapped_column(DateTime, default=dt.now)


# Define Tweet model
class Tweet(Base):
    __tablename__ = 'tweets'

    id = Column(String, primary_key=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    company = Column(String, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    sentiment_label = Column(String, nullable=False)
    sentiment_confidence = Column(Float)
    
    # User information
    user_username = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    user_profile_image_url = Column(String)
    user_followers_count = Column(Integer)
    
    # Metrics
    retweet_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    quote_count = Column(Integer, default=0)
    
    # hashtags
    hashtags = Column(String, default="")

    def __repr__(self):
        return f"<Tweet(id='{self.id}', company='{self.company}', sentiment='{self.sentiment_label}')>"


# Database connection and session setup
def get_db_connection():
    # Get database connection details from environment variables
    # For Supabase, you'll need the connection string in this format:
    # postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
    
    db_url = settings.DATABASE_URL
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    
    return engine, Session


# Function to create tables if they don't exist
def create_tables():
    engine, _ = get_db_connection()
    Base.metadata.create_all(engine)
    print("Database tables created successfully")

