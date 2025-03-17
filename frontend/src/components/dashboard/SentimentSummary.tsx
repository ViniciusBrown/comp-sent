import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySentiment } from '@/types';
import apiService from '@/lib/api';

interface SentimentSummaryProps {
  company?: string; // Optional company to fetch specific data
  data?: CompanySentiment; // Optional data passed directly
}

export function SentimentSummary({ company, data: propData }: SentimentSummaryProps) {
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
    if (score >= 0.7) return 'text-green-500';
    if (score >= 0.5) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-500';
    if (score >= 0.3) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <Card className='min-h-full w-[50%]'>
        <CardHeader>
          <CardTitle>Loading sentiment data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='min-h-full w-[50%]'>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className='min-h-full w-[50%]'>
        <CardHeader>
          <CardTitle>No data available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { sentiment_summary } = data;

  return (
    <Card className='min-h-full w-[50%]'>
      <CardHeader>
        <CardTitle>Sentiment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Overall Score</span>
            <span className={`text-3xl font-bold ${getSentimentColor(sentiment_summary.overall_score)}`}>
              {sentiment_summary.overall_score.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Positive</span>
            <span className="text-3xl font-bold text-green-500">
              {sentiment_summary.positive_percentage}%
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Neutral</span>
            <span className="text-3xl font-bold text-yellow-500">
              {sentiment_summary.neutral_percentage}%
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Negative</span>
            <span className="text-3xl font-bold text-red-500">
              {sentiment_summary.negative_percentage}%
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground mb-1">Total Tweets</span>
            <span className="text-3xl font-bold">
              {sentiment_summary.total_tweets.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="mt-6 w-full bg-muted rounded-full h-4 overflow-hidden">
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${sentiment_summary.positive_percentage}%` }}
            />
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${sentiment_summary.neutral_percentage}%` }}
            />
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${sentiment_summary.negative_percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
