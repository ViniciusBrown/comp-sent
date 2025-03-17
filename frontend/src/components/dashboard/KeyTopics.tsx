import React, { useEffect, useState } from 'react';
import { CompanySentiment } from '@/types';
import apiService from '@/lib/api';

interface KeyTopicsProps {
  company?: string; // Optional company to fetch specific data
  data?: CompanySentiment; // Optional data passed directly
}

export function KeyTopics({ company, data: propData }: KeyTopicsProps) {
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

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.5) return 'bg-green-400';
    if (score >= 0.4) return 'bg-yellow-500';
    if (score >= 0.3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading key topics...
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

  return (
    <div className="space-y-4">
      {data.key_topics.length > 0 ? (
        data.key_topics.map((topic, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getSentimentColor(topic.sentiment_score)}`} />
              <span className="font-medium">{topic.topic}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{topic.count.toLocaleString()}</span>
              <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${getSentimentColor(topic.sentiment_score)}`} 
                  style={{ width: `${topic.sentiment_score * 100}%` }}
                />
              </div>
              <span className="text-sm">{topic.sentiment_score.toFixed(2)}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No topics available for this time period
        </div>
      )}
    </div>
  );
}
