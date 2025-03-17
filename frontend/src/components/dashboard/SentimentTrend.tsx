import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySentiment } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import apiService from '@/lib/api';

interface SentimentTrendProps {
  company?: string; // Optional company to fetch specific data
  data?: CompanySentiment; // Optional data passed directly
}

export function SentimentTrend({ company, data: propData }: SentimentTrendProps) {
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

  if (loading) {
    return (
      <Card className="h-[100%] w-[50%]">
        <CardHeader>
          <CardTitle>Loading sentiment trend...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[100%] w-[50%]">
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
      <Card className="h-[100%] w-[50%]">
        <CardHeader>
          <CardTitle>No data available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { sentiment_trend, time_period } = data;
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    // Use different date formats based on the time period
    if (time_period === 'Last 24 hours') {
      return format(date, 'HH:mm');
    } else if (time_period === 'Last 7 days') {
      return format(date, 'EEE');
    } else if (time_period === 'Last 30 days') {
      return format(date, 'MMM dd');
    } else if (time_period === 'Last 6 months') {
      return format(date, 'MMM yyyy');
    } else if (time_period === 'Last 12 months') {
      return format(date, 'MMM yyyy');
    }
    
    return format(date, 'MMM dd');
  };
  
  const chartData = sentiment_trend.map(item => ({
    ...item,
    date: formatDate(item.date),
  }));

  // Determine if we need to show every label or skip some
  const getTickInterval = () => {
    if (chartData.length <= 10) return 0; // Show all labels
    if (chartData.length <= 20) return 1; // Show every other label
    return 2; // Show every third label
  };

  return (
    <Card className="h-[100%] w-[50%]">
      <CardHeader>
        <CardTitle>Sentiment Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartData.length > 1 ? (
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  interval={getTickInterval()}
                  angle={chartData.length > 20 ? -45 : 0}
                  textAnchor={chartData.length > 20 ? "end" : "middle"}
                  height={chartData.length > 20 ? 60 : 30}
                />
                <YAxis yAxisId="left" domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} />
                <Tooltip 
                  formatter={(value: number | string, name) => {
                    if (name === 'average_score') return [typeof value === 'number' ? value.toFixed(2) : value, 'Sentiment Score'];
                    if (name === 'tweet_count') return [typeof value === 'number' ? value.toLocaleString() : value, 'Tweet Count'];
                    return [value, name];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="average_score"
                  stroke="#10b981"
                  fill="rgba(16, 185, 129, 0.2)"
                  name="average_score"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="tweet_count"
                  stroke="#6366f1"
                  fill="rgba(99, 102, 241, 0.2)"
                  name="tweet_count"
                />
              </AreaChart>
            ) : (
              // Single data point display
              <div className="flex h-full items-center justify-center flex-col">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {chartData.length === 0 ? 'No data available' : `Data for ${chartData[0].date}`}
                  </div>
                  {chartData.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">Sentiment Score</span>
                        <span className="text-2xl font-bold text-emerald-500">
                          {chartData[0].average_score.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">Tweet Count</span>
                        <span className="text-2xl font-bold text-indigo-500">
                          {chartData[0].tweet_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-4 space-x-8">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-sm">Sentiment Score</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
            <span className="text-sm">Tweet Volume</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
