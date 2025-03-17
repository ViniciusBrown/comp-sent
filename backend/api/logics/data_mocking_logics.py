import pandas as pd
import numpy as np
import json
import random
from datetime import datetime, timedelta
import uuid
from api.models import get_db_connection, Tweet, create_tables
from sqlalchemy.types import JSON
from sqlalchemy import text
import os

# Set random seed for reproducibility
np.random.seed(42)

# Define companies
companies = [
    {
        "name": "Apple Inc.",
        "hashtags": ["Apple", "iPhone", "MacBook", "iOS", "iPad", "AirPods", "AppleWatch"],
        "topics": ["iPhone 14", "iOS 16", "MacBook Pro", "Apple Watch", "AirPods"],
        "positive_phrases": [
            "love my new {product}",
            "amazing experience with {product}",
            "best {product} ever",
            "{product} is incredible",
            "impressed with the {product}",
            "customer service is top notch",
            "worth every penny",
            "can't believe how good {product} is",
            "exceeded my expectations",
            "game changer"
        ],
        "negative_phrases": [
            "disappointed with {product}",
            "terrible experience with {product}",
            "{product} keeps crashing",
            "overpriced for what you get",
            "customer service was unhelpful",
            "wouldn't recommend {product}",
            "waste of money",
            "having issues with my {product}",
            "expected better from {company}",
            "going back to the competition"
        ]
    },
    {
        "name": "Tesla, Inc.",
        "hashtags": ["Tesla", "ElonMusk", "EV", "ModelY", "ModelS", "ModelX", "Model3", "Cybertruck", "FSD"],
        "topics": ["Model Y", "Full Self-Driving", "Elon Musk", "Cybertruck", "Supercharger"],
        "positive_phrases": [
            "love my new {product}",
            "autopilot is amazing",
            "best car I've ever owned",
            "supercharger network is fantastic",
            "software update improved everything",
            "acceleration is mind-blowing",
            "saving so much on gas",
            "best decision I ever made",
            "the future of driving",
            "zero emissions and loving it"
        ],
        "negative_phrases": [
            "service center delays are frustrating",
            "quality control issues with my {product}",
            "FSD still not fully working",
            "panel gaps on my new {product}",
            "waiting too long for repairs",
            "range anxiety is real",
            "autopilot disengaged unexpectedly",
            "price increases are ridiculous",
            "delivery was delayed again",
            "software update broke features"
        ]
    },
    {
        "name": "Microsoft",
        "hashtags": ["Microsoft", "Windows11", "Office365", "Teams", "Xbox", "Azure", "Surface"],
        "topics": ["Windows 11", "Microsoft Teams", "Xbox", "Office 365", "Azure"],
        "positive_phrases": [
            "Windows 11 is a great improvement",
            "Teams has transformed our workflow",
            "Xbox Game Pass is the best value in gaming",
            "Office 365 makes collaboration so easy",
            "Azure services are rock solid",
            "Surface laptop is beautifully designed",
            "PowerBI has changed how we use data",
            "Microsoft's accessibility features are industry-leading",
            "seamless integration between services",
            "Microsoft has really turned things around"
        ],
        "negative_phrases": [
            "Windows 11 update broke my computer",
            "Teams keeps crashing during meetings",
            "too many bugs in the latest release",
            "customer support couldn't solve my issue",
            "forced updates are so annoying",
            "subscription model is too expensive",
            "OneDrive sync issues are frustrating",
            "Windows search is still terrible",
            "too many service outages lately",
            "privacy concerns with data collection"
        ]
    }
]

# Define user profile image URLs from Unsplash
profile_images = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=100&auto=format&fit=crop"
]

# Generate random usernames
def generate_username():
    adjectives = ["happy", "tech", "digital", "social", "cyber", "online", "web", "cloud", "smart", "future"]
    nouns = ["user", "fan", "guru", "ninja", "expert", "enthusiast", "lover", "pro", "master", "geek"]
    numbers = ["", str(random.randint(1, 999)), str(random.randint(1, 99))]
    return random.choice(adjectives) + random.choice(nouns) + random.choice(numbers)

# Generate random names
def generate_name():
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", 
                   "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah", "Thomas", "Karen", "Charles", "Nancy",
                   "Emma", "Olivia", "Noah", "Liam", "Sophia", "Ava", "Jackson", "Aiden", "Lucas", "Chloe"]
    last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
                  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
                  "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright"]
    return f"{random.choice(first_names)} {random.choice(last_names)}"

# Generate a tweet
def generate_tweet(company, sentiment, date):
    # Replace placeholders in phrases
    if sentiment == "positive":
        base_text = random.choice(company["positive_phrases"])
    else:
        base_text = random.choice(company["negative_phrases"])
    
    # Replace placeholders
    product = random.choice(company["topics"])
    text = base_text.replace("{product}", product).replace("{company}", company["name"])
    
    # Add hashtags (30% chance)
    if random.random() < 0.3:
        hashtags = random.sample(company["hashtags"], k=random.randint(1, 3))
        hashtag_text = " " + " ".join([f"#{tag}" for tag in hashtags])
        text += hashtag_text
    else:
        hashtag_text = ''
    
    # Generate sentiment score
    if sentiment == "positive":
        score = round(random.uniform(0.7, 0.95), 2)
        confidence = round(random.uniform(0.85, 0.98), 2)
    else:
        score = round(random.uniform(0.05, 0.3), 2)
        confidence = round(random.uniform(0.8, 0.95), 2)
    
    # Generate user data
    username = generate_username()
    name = generate_name()
    profile_image = random.choice(profile_images)
    followers = random.randint(100, 10000)
    
    # Generate metrics
    if sentiment == "positive":
        like_base = random.randint(50, 300)
    else:
        like_base = random.randint(30, 200)
    
    retweet_count = int(like_base * random.uniform(0.1, 0.5))
    reply_count = int(like_base * random.uniform(0.05, 0.3))
    quote_count = int(like_base * random.uniform(0.02, 0.1))
    
    # Create tweet object
    tweet = {
        "id": str(uuid.uuid4()),
        "text": text,
        "created_at": date.isoformat(),
        "company": company["name"],
        "hashtags": hashtag_text,
        "sentiment": {
            "score": score,
            "label": sentiment,
            "confidence": confidence
        },
        "user": {
            "username": username,
            "name": name,
            "profile_image_url": profile_image,
            "followers_count": followers
        },
        "metrics": {
            "retweet_count": retweet_count,
            "reply_count": reply_count,
            "like_count": like_base,
            "quote_count": quote_count
        },
        
    }
    
    return tweet

# Generate tweets for all companies
def generate_all_tweets(num_tweets_per_company=5000, days=365):
    all_tweets = []
    now = datetime.now()
    
    for company in companies:
        print(f"Generating tweets for {company['name']}...")
        
        # Generate positive tweets (65%)
        positive_count = int(num_tweets_per_company * 0.65)
        for _ in range(positive_count):
            days_ago = random.randint(0, days)
            tweet_date = now - timedelta(days=days_ago, 
                                        hours=random.randint(0, 23),
                                        minutes=random.randint(0, 59),
                                        seconds=random.randint(0, 59))
            all_tweets.append(generate_tweet(company, "positive", tweet_date))
        
        # Generate negative tweets (35%)
        negative_count = num_tweets_per_company - positive_count
        for _ in range(negative_count):
            days_ago = random.randint(0, days)
            tweet_date = now - timedelta(days=days_ago,
                                        hours=random.randint(0, 23),
                                        minutes=random.randint(0, 59),
                                        seconds=random.randint(0, 59))
            all_tweets.append(generate_tweet(company, "negative", tweet_date))
    
    # Convert to DataFrame for easier manipulation
    df = pd.DataFrame(all_tweets)
    
    # Add created_at as datetime for sorting
    df['datetime'] = pd.to_datetime(df['created_at'])
    
    # Sort by date
    df = df.sort_values('datetime', ascending=False)
    
    # Drop the datetime column used for sorting
    df = df.drop('datetime', axis=1)
    
    return df


# Function to upsert tweets from a DataFrame
def upsert_tweets_from_df(df):
    engine, _ = get_db_connection()
    try:
        # Process DataFrame in batches to avoid memory issues
        batch_size = 1000
        total_tweets = len(df)
        processed = 0
        
        # Flatten the nested structures in the DataFrame
        flattened_df = pd.DataFrame()
        
        # Copy basic columns
        flattened_df['id'] = df['id']
        flattened_df['text'] = df['text']
        flattened_df['created_at'] = pd.to_datetime(df['created_at'])
        flattened_df['company'] = df['company']
        
        # Extract sentiment columns
        flattened_df['sentiment_score'] = df['sentiment'].apply(lambda x: x['score'])
        flattened_df['sentiment_label'] = df['sentiment'].apply(lambda x: x['label'])
        flattened_df['sentiment_confidence'] = df['sentiment'].apply(lambda x: x.get('confidence'))
        
        # Extract user columns
        flattened_df['user_username'] = df['user'].apply(lambda x: x['username'])
        flattened_df['user_name'] = df['user'].apply(lambda x: x['name'])
        flattened_df['user_profile_image_url'] = df['user'].apply(lambda x: x['profile_image_url'])
        flattened_df['user_followers_count'] = df['user'].apply(lambda x: x['followers_count'])
        
        # Extract metrics columns
        flattened_df['retweet_count'] = df['metrics'].apply(lambda x: x['retweet_count'])
        flattened_df['reply_count'] = df['metrics'].apply(lambda x: x['reply_count'])
        flattened_df['like_count'] = df['metrics'].apply(lambda x: x['like_count'])
        flattened_df['quote_count'] = df['metrics'].apply(lambda x: x['quote_count'])
        flattened_df['hashtags'] = df['hashtags']

        # Process in batches
        for i in range(0, total_tweets, batch_size):
            batch_df = flattened_df.iloc[i:i+batch_size]
            
            # Use to_sql with method='multi' for better performance
            # The 'replace' method doesn't work for upserts, so we'll use a custom function
            temp_table_name = 'temp_tweets'
            batch_df.to_sql(temp_table_name, engine, if_exists='replace', index=False)
            # Perform the upsert using a SQL query
            with engine.connect() as conn:
                # Start a transaction
                trans = conn.begin()
                try:
                    if i == 0:
                        conn.execute(text(f"TRUNCATE tweets"))
                    # Perform the upsert
                    conn.execute(text(f"""
                        INSERT INTO tweets (
                            id, text, created_at, company, 
                            sentiment_score, sentiment_label, sentiment_confidence,
                            user_username, user_name, user_profile_image_url, user_followers_count,
                            retweet_count, reply_count, like_count, quote_count, hashtags
                        )
                        SELECT 
                            id, text, created_at, company, 
                            sentiment_score, sentiment_label, sentiment_confidence,
                            user_username, user_name, user_profile_image_url, user_followers_count,
                            retweet_count, reply_count, like_count, quote_count, hashtags
                        FROM {temp_table_name}
                        ON CONFLICT (id) DO UPDATE SET
                            text = EXCLUDED.text,
                            created_at = EXCLUDED.created_at,
                            company = EXCLUDED.company,
                            sentiment_score = EXCLUDED.sentiment_score,
                            sentiment_label = EXCLUDED.sentiment_label,
                            sentiment_confidence = EXCLUDED.sentiment_confidence,
                            user_username = EXCLUDED.user_username,
                            user_name = EXCLUDED.user_name,
                            user_profile_image_url = EXCLUDED.user_profile_image_url,
                            user_followers_count = EXCLUDED.user_followers_count,
                            retweet_count = EXCLUDED.retweet_count,
                            reply_count = EXCLUDED.reply_count,
                            like_count = EXCLUDED.like_count,
                            quote_count = EXCLUDED.quote_count,
                            hashtags = EXCLUDED.hashtags
                    """))
                    
                    # Drop the temporary table
                    conn.execute(text(f"DROP TABLE {temp_table_name}"))
                    
                    # Commit the transaction
                    trans.commit()
                except Exception as e:
                    # Rollback in case of error
                    trans.rollback()
                    raise e
            
            processed += len(batch_df)
            print(f"Processed {processed}/{total_tweets} tweets")
        
        print("All tweets have been successfully upserted into the database")
        return total_tweets
        
    except Exception as e:
        print(f"Error upserting tweets: {str(e)}")
        raise


def erase_tweets_table():
     engine, _ = get_db_connection()
     with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        try:
            # Drop the table
            conn.execute(text(f"DROP TABLE tweets"))

        except Exception as e:
            # Rollback in case of error
            trans.rollback()
            raise e


# Function to load tweets from a DataFrame and upsert them
def load_and_upsert_df(df):
    # Create tables if they don't exist
    create_tables()

    
    
    # Upsert tweets from the DataFrame
    return upsert_tweets_from_df(df)

def create_mocked_data_and_update_db():
    print("Generating mock tweet data...")
    tweets_df = generate_all_tweets(num_tweets_per_company=5000)
    print(f"Generated {len(tweets_df)} tweets.")
    print(tweets_df.head(3))
    
    print("Starting to load tweets directly into the database...")
    try:
        count = load_and_upsert_df(tweets_df)
        print(f"Successfully loaded {count} tweets into the database.")
    except Exception as e:
        print(f"Error loading tweets: {str(e)}")
