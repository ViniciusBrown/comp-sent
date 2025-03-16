from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import mapped_column
from sqlalchemy import create_engine
from django.conf import settings
from sqlalchemy.orm import sessionmaker
from datetime import datetime as dt

Base = declarative_base()

class SocialMediaData(Base):
  __tablename__ = 'social_media_data'

  id = mapped_column(Integer, primary_key=True)
  username = mapped_column(String(100))
  text = mapped_column(String(1000))
  company = mapped_column(String(100))
  sentiment = mapped_column(String(100))
  created_at = mapped_column(DateTime)


class SearchedCompanies(Base):
  __tablename__ = 'searched_companies'

  id = mapped_column(Integer, primary_key=True)
  author_id = mapped_column(Integer)
  company = mapped_column(String(100))
  response = mapped_column(JSON)
  created_at = mapped_column(DateTime, default=dt.now)

engine = create_engine(settings.DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)