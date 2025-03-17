import { CompanySentiment } from '@/types';

export const mockCompanies: CompanySentiment[] = [
  {
    company: "Apple",
    logo_url: "https://logo.clearbit.com/apple.com",
    sentiment_summary: {
      overall_score: 0.75,
      positive_percentage: 65,
      negative_percentage: 15,
      neutral_percentage: 20,
      total_tweets: 15000
    },
    sentiment_trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      average_score: 0.6 + Math.random() * 0.3,
      tweet_count: Math.floor(400 + Math.random() * 200)
    })),
    key_topics: [
      { topic: "iPhone", count: 5000, sentiment_score: 0.8 },
      { topic: "MacBook", count: 3000, sentiment_score: 0.75 },
      { topic: "iOS", count: 2500, sentiment_score: 0.7 },
      { topic: "Apple Watch", count: 2000, sentiment_score: 0.85 },
      { topic: "iPad", count: 1800, sentiment_score: 0.78 }
    ],
    top_tweets: {
      positive: [
        {
          id: "1",
          text: "Just got my new iPhone - absolutely loving it! The camera is incredible! #Apple",
          created_at: new Date().toISOString(),
          sentiment: {
            score: 0.95,
            label: "positive",
            confidence: 0.92
          },
          user: {
            username: "techie123",
            name: "Tech Enthusiast",
            profile_image_url: "https://randomuser.me/api/portraits/men/1.jpg",
            followers_count: 1200
          },
          metrics: {
            retweet_count: 45,
            reply_count: 12,
            like_count: 180,
            quote_count: 5
          },
          entities: {
            hashtags: ["Apple", "iPhone"]
          }
        },
        {
          id: "2",
          text: "MacBook Pro performance is mind-blowing. Best laptop I've ever owned! #Apple",
          created_at: new Date().toISOString(),
          sentiment_score: 0.92
        }
      ],
      negative: [
        {
          id: "3",
          text: "Customer service wait times are getting longer #Apple",
          created_at: new Date().toISOString(),
          sentiment_score: 0.2
        },
        {
          id: "4",
          text: "Battery life could be better on the new iPhone #Apple",
          created_at: new Date().toISOString(),
          sentiment_score: 0.3
        }
      ]
    }
  },
  {
    company: "Microsoft",
    logo_url: "https://logo.clearbit.com/microsoft.com",
    sentiment_summary: {
      overall_score: 0.72,
      positive_percentage: 62,
      negative_percentage: 18,
      neutral_percentage: 20,
      total_tweets: 12000
    },
    sentiment_trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      average_score: 0.55 + Math.random() * 0.3,
      tweet_count: Math.floor(350 + Math.random() * 150)
    })),
    key_topics: [
      { topic: "Windows", count: 4500, sentiment_score: 0.7 },
      { topic: "Xbox", count: 3200, sentiment_score: 0.8 },
      { topic: "Office 365", count: 2800, sentiment_score: 0.75 },
      { topic: "Azure", count: 2300, sentiment_score: 0.82 },
      { topic: "Teams", count: 2000, sentiment_score: 0.68 }
    ],
    top_tweets: {
      positive: [
        {
          id: "5",
          text: "Azure's new features are game-changing for our business! #Microsoft",
          created_at: new Date().toISOString(),
          sentiment_score: 0.94
        },
        {
          id: "6",
          text: "Xbox Game Pass is the best value in gaming! #Xbox #Microsoft",
          created_at: new Date().toISOString(),
          sentiment_score: 0.91
        }
      ],
      negative: [
        {
          id: "7",
          text: "Windows updates are still causing issues #Microsoft",
          created_at: new Date().toISOString(),
          sentiment_score: 0.25
        },
        {
          id: "8",
          text: "Teams needs better performance optimization #Microsoft",
          created_at: new Date().toISOString(),
          sentiment_score: 0.35
        }
      ]
    }
  }
];