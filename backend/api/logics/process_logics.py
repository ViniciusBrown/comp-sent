import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from api.models import get_db_connection, Tweet
from sqlalchemy import create_engine, text, select
from django.conf import settings
import json

def extract():
    engine, session = get_db_connection()
    data = pd.read_sql_query(str(select(Tweet)), engine)
    session.close()
    return data

def process_tweets_for_frontend(db_url=None, days=30, output_file='processed_companies_data.json'):
    """
    Process tweets from the database into the format needed for the frontend.
    
    Args:
        db_url (str): Database connection URL. If None, uses DATABASE_URL env variable.
        days (int): Number of days of data to process (default: 30)
        output_file (str): Path to save the processed JSON data (default: 'processed_companies_data.json')
        
    Returns:
        dict: Processed data in the format needed for the frontend
    """
    # Get database URL from environment if not provided
    if db_url is None:
        db_url = settings.DATABASE_URL
        if not db_url:
            raise ValueError("DATABASE_URL environment variable is not set")
    
    # Create database connection
    engine = create_engine(db_url)
    
    # Calculate the date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Query tweets from the database
    query = f"""
    SELECT * FROM tweets 
    WHERE created_at >= '{start_date.isoformat()}' 
    ORDER BY created_at DESC
    """
    
    # Load tweets into a DataFrame
    print(f"Loading tweets from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}...")
    df = pd.read_sql(query, engine)
    
    if len(df) == 0:
        print("No tweets found in the specified date range.")
        return []
    
    print(f"Loaded {len(df)} tweets. Processing data...")
    
    # Process the data for each company
    companies_data = []
    
    # Get unique companies
    unique_companies = df['company'].unique()
    
    for company in unique_companies:
        print(f"Processing data for {company}...")
        
        # Filter tweets for this company
        company_df = df[df['company'] == company].copy()
        
        # Get company logo URL (using the first tweet's user profile image as a placeholder)
        # In a real app, you would have a separate table for company info
        logo_url = company_df['user_profile_image_url'].iloc[0] if not company_df.empty else ""
        
        # Calculate sentiment trend (weekly averages)
        # Convert created_at to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(company_df['created_at']):
            company_df['created_at'] = pd.to_datetime(company_df['created_at'])
        
        # Create a date column for easier grouping
        company_df['date'] = company_df['created_at'].dt.floor('D')
        
        # Group by week and calculate averages
        company_df['week_start'] = company_df['created_at'].dt.to_period('W-MON').dt.start_time
        
        # Get weekly sentiment averages and tweet counts
        weekly_sentiment = company_df.groupby('week_start').agg(
            average_score=('sentiment_score', 'mean'),
            tweet_count=('id', 'count')
        ).reset_index()
        
        # Format the trend data
        sentiment_trend = []
        for _, row in weekly_sentiment.iterrows():
            sentiment_trend.append({
                'date': row['week_start'].strftime('%Y-%m-%d'),
                'average_score': round(row['average_score'], 2),
                'tweet_count': int(row['tweet_count'])
            })
        
        # Get top positive and negative tweets
        # Sort by a combination of sentiment score and engagement metrics
        
        company_df['engagement_score'] = (
            company_df['retweet_count'] * 2 + 
            company_df['like_count'] + 
            company_df['reply_count'] * 1.5 + 
            company_df['quote_count'] * 1.5
        )

        # Calculate sentiment summary
        total_tweets = len(company_df)
        positive_df = company_df[company_df['sentiment_label'] == 'positive']
        negative_df = company_df[company_df['sentiment_label'] == 'negative']
        
        positive_percentage = int(round(len(positive_df) / total_tweets * 100)) if total_tweets > 0 else 0
        negative_percentage = int(round(len(negative_df) / total_tweets * 100)) if total_tweets > 0 else 0
        neutral_percentage = 100 - positive_percentage - negative_percentage
        
        overall_score = round(company_df['sentiment_score'].mean(), 2) if not company_df.empty else 0
        
        # Get top positive tweets
        top_positive = positive_df.sort_values(
            by=['sentiment_score', 'engagement_score'], 
            ascending=[False, False]
        ).head(5)
        
        # Get top negative tweets
        top_negative = negative_df.sort_values(
            by=['sentiment_score', 'engagement_score'], 
            ascending=[True, False]
        ).head(5)
        
        # Format top tweets
        top_tweets = {
            'positive': [],
            'negative': []
        }
        
        # Helper function to extract hashtags from the hashtags string
        def extract_hashtags_list(hashtags_str):
            if not hashtags_str or pd.isna(hashtags_str):
                return []
            # Extract hashtags without the # symbol
            return [tag.strip('#') for tag in hashtags_str.split() if tag.startswith('#')]
        
        # Process positive tweets
        for _, tweet in top_positive.iterrows():
            # Extract hashtags from the hashtags string
            hashtags = extract_hashtags_list(tweet['hashtags'])
            
            # Format the tweet
            formatted_tweet = {
                'id': tweet['id'],
                'text': tweet['text'],
                'created_at': tweet['created_at'].isoformat(),
                'sentiment': {
                    'score': float(tweet['sentiment_score']),
                    'label': tweet['sentiment_label'],
                    'confidence': float(tweet['sentiment_confidence']) if pd.notna(tweet['sentiment_confidence']) else 0.9
                },
                'user': {
                    'username': tweet['user_username'],
                    'name': tweet['user_name'],
                    'profile_image_url': tweet['user_profile_image_url'],
                    'followers_count': int(tweet['user_followers_count'])
                },
                'metrics': {
                    'retweet_count': int(tweet['retweet_count']),
                    'reply_count': int(tweet['reply_count']),
                    'like_count': int(tweet['like_count']),
                    'quote_count': int(tweet['quote_count'])
                }
            }
            
            # Add entities if hashtags exist
            if hashtags:
                formatted_tweet['entities'] = {
                    'hashtags': hashtags
                }
            
            top_tweets['positive'].append(formatted_tweet)
        
        # Process negative tweets
        for _, tweet in top_negative.iterrows():
            # Extract hashtags from the hashtags string
            hashtags = extract_hashtags_list(tweet['hashtags'])
            
            # Format the tweet
            formatted_tweet = {
                'id': tweet['id'],
                'text': tweet['text'],
                'created_at': tweet['created_at'].isoformat(),
                'sentiment': {
                    'score': float(tweet['sentiment_score']),
                    'label': tweet['sentiment_label'],
                    'confidence': float(tweet['sentiment_confidence']) if pd.notna(tweet['sentiment_confidence']) else 0.9
                },
                'user': {
                    'username': tweet['user_username'],
                    'name': tweet['user_name'],
                    'profile_image_url': tweet['user_profile_image_url'],
                    'followers_count': int(tweet['user_followers_count'])
                },
                'metrics': {
                    'retweet_count': int(tweet['retweet_count']),
                    'reply_count': int(tweet['reply_count']),
                    'like_count': int(tweet['like_count']),
                    'quote_count': int(tweet['quote_count'])
                }
            }
            
            # Add entities if hashtags exist
            if hashtags:
                formatted_tweet['entities'] = {
                    'hashtags': hashtags
                }
            
            top_tweets['negative'].append(formatted_tweet)
        
        # Extract key topics from hashtags
        topics = []
        
        # Extract all hashtags from the company's tweets
        all_hashtags = []
        for hashtags_str in company_df['hashtags'].dropna():
            all_hashtags.extend(extract_hashtags_list(hashtags_str))
        
        # Count hashtag occurrences
        if all_hashtags:
            hashtag_counts = pd.Series(all_hashtags).value_counts()
            
            # Get top hashtags
            for hashtag, count in hashtag_counts.head(10).items():
                # Calculate average sentiment for tweets with this hashtag
                hashtag_tweets = company_df[company_df['hashtags'].str.contains(f"#{hashtag}", na=False)]
                avg_sentiment = hashtag_tweets['sentiment_score'].mean() if not hashtag_tweets.empty else 0.5
                
                topics.append({
                    'topic': hashtag,
                    'count': int(count),
                    'sentiment_score': round(float(avg_sentiment), 2)
                })
        
        # Fallback: Extract topics from tweet text if we don't have enough hashtags
        if len(topics) < 5:
            # Combine all tweet text
            all_text = ' '.join(company_df['text'].tolist())
            
            # Split into words and count occurrences
            words = all_text.lower().split()
            word_counts = pd.Series(words).value_counts()
            
            # Filter out common words and short words
            common_words = ['the', 'and', 'is', 'in', 'to', 'a', 'of', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'an', 'my', 'i', 'me', 'you', 'we', 'they', 'it', 'this', 'that']
            filtered_words = word_counts[~word_counts.index.isin(common_words)]
            filtered_words = filtered_words[filtered_words.index.str.len() > 3]
            
            # Get top words
            top_words = filtered_words.head(10)
            
            # Add to topics
            for word, count in top_words.items():
                # Calculate average sentiment for tweets containing this word
                word_tweets = company_df[company_df['text'].str.contains(word, case=False)]
                avg_sentiment = word_tweets['sentiment_score'].mean() if not word_tweets.empty else 0.5
                
                topics.append({
                    'topic': word.capitalize(),
                    'count': int(count),
                    'sentiment_score': round(float(avg_sentiment), 2)
                })
        
        # Ensure we have at least 5 topics
        if len(topics) < 5:
            # Add company name as a topic if we don't have enough
            if not any(t['topic'] == company for t in topics):
                topics.append({
                    'topic': company,
                    'count': total_tweets,
                    'sentiment_score': overall_score
                })
        
        # Limit to top 5 topics
        topics = topics[:5]
        
        # Create the company data object
        company_data = {
            'company': company,
            'logo_url': logo_url,
            'time_period': f"Last {days} days",
            'sentiment_summary': {
                'overall_score': overall_score,
                'positive_percentage': positive_percentage,
                'negative_percentage': negative_percentage,
                'neutral_percentage': neutral_percentage,
                'total_tweets': total_tweets
            },
            'sentiment_trend': sentiment_trend,
            'top_tweets': top_tweets,
            'key_topics': topics
        }
        
        companies_data.append(company_data)
    
    json_output = json.dumps(companies_data, indent=2)
    
    
    print(f"Processed data for {len(companies_data)} companies.")
    print(f"Data saved to {output_file}")
    
    return json_output


