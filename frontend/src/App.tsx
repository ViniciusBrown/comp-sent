import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CompanyHeader } from '@/components/dashboard/CompanyHeader';
import { SentimentSummary } from '@/components/dashboard/SentimentSummary';
import { SentimentTrend } from '@/components/dashboard/SentimentTrend';
import { TopTweets } from '@/components/dashboard/TopTweets';
import { KeyTopics } from '@/components/dashboard/KeyTopics';
import { CompanySearch } from '@/components/dashboard/CompanySearch';
import apiService, { SentimentData } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { Tweet, CompanySentiment } from '@/types';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/ui/loading';
import { companies as mockCompanies } from '@/data/companies';

function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(mockCompanies[0].id);
  // Store data for all time periods
  const [sentimentDataCache, setSentimentDataCache] = useState<Record<string, SentimentData>>({});
  const [timeFilter, setTimeFilter] = useState("month");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeFilters = ["day", "week", "month", "sixMonths", "year"];
  const { isAuthenticated } = useAuth();

  // Fetch sentiment data for all time periods
  const fetchSentimentData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch data for all time periods in parallel
      const promises = timeFilters.map(filter =>
        apiService.getCompanySentimentData(selectedCompanyId, filter)
      );
      
      const results = await Promise.all(promises);
      
      // Create cache object with data for each time period
      const newCache = timeFilters.reduce((cache, filter, index) => ({
        ...cache,
        [filter]: results[index]
      }), {});
      
      setSentimentDataCache(newCache);
    } catch (err) {
      setError('Failed to load sentiment data');
      console.error('Error fetching sentiment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
  }, [selectedCompanyId]); // Only fetch when company changes

  // Get time period label
  const getTimePeriodLabel = () => {
    switch (timeFilter) {
      case 'day': return 'Last 24 hours';
      case 'week': return 'Last 7 days';
      case 'month': return 'Last 30 days';
      case 'sixMonths': return 'Last 6 months';
      case 'year': return 'Last 12 months';
      default: return 'Last 30 days';
    }
  };

  // Combine company and sentiment data for current time filter
  const getCompanyWithSentiment = () => {
    const currentData = sentimentDataCache[timeFilter];
    if (!currentData) return null;

    const selectedCompany = mockCompanies.find(c => c.id === selectedCompanyId);
    if (!selectedCompany) return null;

    return {
      ...selectedCompany,
      ...currentData,
      time_period: getTimePeriodLabel()
    };
  };

  const combinedData = getCompanyWithSentiment();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Twitter Sentiment Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[280px]">
              <CompanySearch 
                onSelectCompany={setSelectedCompanyId}
                currentCompanyId={selectedCompanyId}
              />
            </div>
            <UserMenu onLoginClick={() => setIsAuthDialogOpen(true)} />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          {combinedData && <CompanyHeader data={combinedData} />}
          
          <Tabs 
            defaultValue="month" 
            className="space-y-6"
            value={timeFilter}
            onValueChange={setTimeFilter}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <TabsList>
                <TabsTrigger value="year">Year</TabsTrigger>
                <TabsTrigger value="sixMonths">6 Months</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </div>
            
            {combinedData && (
              <div className="space-y-6">
                <div className="flex flex-row py-5 space-x-4 items-stretch">
                  <SentimentTrend data={combinedData} />
                  <SentimentSummary data={combinedData} />                
                </div>
              
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-4">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4">Key Topics</h3>
                      <KeyTopics data={combinedData} />
                    </CardContent>
                  </Card>
                  
                  <Card className="lg:col-span-8">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Top Positive Tweets</h3>
                          <Separator className="my-2" />
                          <TopTweets data={combinedData} type="positive" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Top Negative Tweets</h3>
                          <Separator className="my-2" />
                          <TopTweets data={combinedData} type="negative" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </main>
      
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onClose={() => setIsAuthDialogOpen(false)} 
      />
    </div>
  );
}

export default App;
