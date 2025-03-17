import React, { useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tweet, CompanySentiment } from '@/types';
import { MessageSquare, Repeat, Heart, Share } from 'lucide-react';
import apiService from '@/lib/api';

interface TopTweetsProps {
  company?: string; // Optional company to fetch specific data
  data?: CompanySentiment; // Optional data passed directly
  type: 'positive' | 'negative'; // Which type of tweets to display
}

export function TopTweets({ company, data: propData, type }: TopTweetsProps) {
  const [data, setData] = useState<CompanySentiment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!propData);

  useEffect(() => {
    // If data is provided through props, use it
    if (propData) {
      setData(propData);
      setLoading(false);
      return;
    }

    // Otherwise, fetch data if company is provided
    if (company) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await apiService.getCompanySentimentData(company);
          setData(response);
        } catch (err) {
          setError(apiService.handleError(err).message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [company, propData]);

  const getSentimentBadgeVariant = (label: string) => {
    switch (label) {
      case 'positive':
        return 'positive';
      case 'negative':
        return 'negative';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading tweets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No data available
      </div>
    );
  }

  const tweets = type === 'positive' ? data.top_tweets.positive : data.top_tweets.negative;

  return (
    <div className="space-y-4">
      {tweets.length > 0 ? (
        tweets.map((tweet) => (
          <div key={tweet.id} className="rounded-lg border p-4">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={tweet.user.profile_image_url} alt={tweet.user.name} />
                <AvatarFallback>{tweet.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tweet.user.name}</p>
                    <p className="text-sm text-muted-foreground">@{tweet.user.username}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSentimentBadgeVariant(tweet.sentiment.label)}>
                      {tweet.sentiment.score.toFixed(2)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(new Date(tweet.created_at * 1000).toISOString()), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{tweet.text}</p>
                
                {tweet.entities?.hashtags && tweet.entities.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tweet.entities.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-blue-500">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center text-muted-foreground">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    <span className="text-xs">{tweet.metrics.reply_count}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Repeat className="mr-1 h-4 w-4" />
                    <span className="text-xs">{tweet.metrics.retweet_count}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Heart className="mr-1 h-4 w-4" />
                    <span className="text-xs">{tweet.metrics.like_count}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Share className="mr-1 h-4 w-4" />
                    <span className="text-xs">{tweet.metrics.quote_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No tweets available for this time period
        </div>
      )}
    </div>
  );
}
