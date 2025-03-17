<div align="center">
  <img src="https://images.unsplash.com/photo-1611605698335-8b1569810432?q=80&w=2274&auto=format&fit=crop" alt="Twitter Sentiment Dashboard" width="400"/>
  <p><em>A powerful dashboard for analyzing company sentiment on Twitter</em></p>
</div>

## 📊 Overview

Twitter Sentiment Dashboard is a modern web application that analyzes and visualizes sentiment data from tweets about major companies. The dashboard provides real-time insights into public perception, helping businesses understand their social media presence and make data-driven decisions.

## ✨ Features

- **Real-time Sentiment Analysis**: Track positive and negative sentiment about companies
- **Interactive Visualizations**: Explore sentiment trends over time with interactive charts
- **Top Tweets Display**: View the most impactful tweets for each company
- **Key Topics Analysis**: Identify trending topics and hashtags
- **Company Comparison**: Compare sentiment across multiple companies
- **Responsive Design**: Seamless experience across desktop and mobile devices

## 🖼️ Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/72639100-39c2-42be-8fa8-4e630e3edf4e" alt="Dashboard Overview" width="800"/>
  <p><em>Main Dashboard View</em></p>
  
  <img src="https://github.com/user-attachments/assets/05f003db-fb12-40a4-bc92-bfb28897a612" alt="Top Tweets" width="800"/>
  <p><em>Signup/Login</em></p>
</div>

## 🏗️ Architecture

### System Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Mock Tweet     │────▶│  PostgreSQL     │────▶│  React          │
│  Generator      │     │  Database       │     │  Dashboard      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│                 │                           │                 │
│  Pandas         │                           │  Data           │
│  Processing     │                           │  Visualization  │
│                 │                           │                 │
└─────────────────┘                           └─────────────────┘
```

### Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  1. Tweet Generation                                          │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│     │             │     │             │     │             │   │
│     │  Generate   │────▶│  Process    │────▶│  DataFrame  │   │
│     │  Mock Data  │     │  Sentiment  │     │  Creation   │   │
│     │             │     │             │     │             │   │
│     └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                 │             │
└─────────────────────────────────────────────────┼─────────────┘
                                                  │
                                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  2. Database Integration                                      │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│     │             │     │             │     │             │   │
│     │  Flatten    │────▶│  Batch      │────▶│  Upsert     │   │
│     │  DataFrame  │     │  Processing │     │  Operation  │   │
│     │             │     │             │     │             │   │
│     └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                 │             │
└─────────────────────────────────────────────────┼─────────────┘
                                                  │
                                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  3. Frontend Visualization                                    │
│     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│     │             │     │             │     │             │   │
│     │  API        │────▶│  React      │────▶│  Interactive│   │
│     │  Endpoints  │     │  Components │     │  Dashboard  │   │
│     │             │     │             │     │             │   │
│     └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 🚀 Performance Optimization Strategies

### 1. Data Generation and Processing

- **Pandas DataFrame-Centric Approach**: Using Pandas for all data operations instead of JSON processing
- **Vectorized Operations**: Leveraging Pandas' vectorized operations for faster data manipulation
- **Memory Optimization**: Generating data in memory without unnecessary disk I/O
- **Efficient Date Handling**: Using optimized datetime operations for time-series data

### 2. Database Operations

- **Batch Processing**: Processing tweets in configurable batches to manage memory usage
- **Temporary Tables**: Using PostgreSQL temporary tables for efficient upsert operations
- **Optimized SQL**: Crafting efficient SQL queries for database operations
- **Connection Pooling**: Reusing database connections to reduce overhead
- **Transaction Management**: Proper transaction handling for data integrity

### 3. Frontend Performance

- **Component Virtualization**: Rendering only visible elements for large lists
- **Memoization**: Caching expensive calculations with React's useMemo and useCallback
- **Code Splitting**: Loading components on-demand to reduce initial bundle size
- **Optimized Charts**: Using efficient rendering strategies and dynamic label spacing for data visualization
- **Responsive Design**: Adapting to different screen sizes without performance penalties
- **Layout Optimization**: Balanced component sizing with Sentiment Trend taking 75% width for better data visualization and Sentiment Summary using 25% width for compact information display

### 4. Testing Strategy

- **Unit Tests**: Comprehensive test suite for all components using Jest and React Testing Library
  - `SentimentTrend.test.tsx`: Tests for chart rendering, data loading, and dynamic label spacing
  - `SentimentSummary.test.tsx`: Tests for summary statistics and responsive layout
  - `CompanySearch.test.tsx`: Tests for search functionality and auto-complete
  - `TopTweets.test.tsx`: Tests for tweet list rendering and interaction
  - `KeyTopics.test.tsx`: Tests for topic analysis and tag cloud rendering

- **Test Coverage**: Ensuring high test coverage for critical components
  - Data visualization components: 90%+ coverage
  - User interaction components: 85%+ coverage
  - Utility functions: 95%+ coverage

- **Testing Best Practices**:
  - Mock data patterns for consistent test scenarios
  - Snapshot testing for UI consistency
  - Integration tests for component interactions
  - Performance testing for chart rendering

## 🛠️ Technical Stack

### Backend
- **Python**: Core language for data processing and API
- **Pandas**: Data manipulation and analysis
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Database for storing tweet data
- **Supabase**: Hosted PostgreSQL service with additional features

### Frontend
- **TypeScript**: Type-safe JavaScript for frontend development
- **React**: UI library for building the interface
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **Recharts**: Composable charting library
- **date-fns**: Date utility library
- **cmdk**: Command menu component
- **Lucide React**: Icon library

## 📦 Data Processing Pipeline

The project includes a sophisticated data processing pipeline for generating mock tweet data and loading it into a PostgreSQL database:

### Option 1: Two-Step Process

1. **Generate Mock Data**:
   ```bash
   python generate_mock_tweets.py
   ```
   This creates CSV and JSON files with mock tweet data.

2. **Load Data into Database**:
   ```bash
   python load_tweets_to_db.py
   ```
   This loads the generated data into PostgreSQL with efficient upsert operations.

### Option 2: Direct Process

For maximum efficiency, generate and load in a single step:
```bash
python direct_to_db.py
```

This approach:
- Generates mock tweets directly as a Pandas DataFrame
- Loads them into the database without saving to disk
- Avoids unnecessary I/O operations

## 📊 Database Schema

The tweets are stored in a table with the following structure:

| Column                 | Type      | Description                           |
|------------------------|-----------|---------------------------------------|
| id                     | String    | Unique identifier (Primary Key)       |
| text                   | String    | Tweet content                         |
| created_at             | DateTime  | Creation timestamp                    |
| company                | String    | Company the tweet is about            |
| sentiment_score        | Float     | Sentiment score (0-1)                 |
| sentiment_label        | String    | Sentiment label (positive/negative)   |
| sentiment_confidence   | Float     | Confidence in sentiment analysis      |
| user_username          | String    | Twitter username                      |
| user_name              | String    | Display name                          |
| user_profile_image_url | String    | Profile image URL                     |
| user_followers_count   | Integer   | Number of followers                   |
| retweet_count          | Integer   | Number of retweets                    |
| reply_count          | Integer   | Number of replies                     |
| like_count             | Integer   | Number of likes                       |
| quote_count            | Integer   | Number of quote tweets                |
| entities               | JSON      | Additional entities (hashtags, etc.)  |

## 🔍 Example Queries

```sql
-- Get all tweets for Tesla with positive sentiment
SELECT * FROM tweets 
WHERE company = 'Tesla, Inc.' AND sentiment_label = 'positive'
ORDER BY created_at DESC;

-- Get average sentiment by company
SELECT company, AVG(sentiment_score) as avg_sentiment
FROM tweets
GROUP BY company;

-- Get tweet counts by company and sentiment
SELECT company, sentiment_label, COUNT(*) as tweet_count
FROM tweets
GROUP BY company, sentiment_label;

-- Get trending hashtags for Apple
SELECT 
  e->>'hashtags' as hashtag,
  COUNT(*) as count
FROM tweets, 
  jsonb_array_elements(entities) e
WHERE company = 'Apple Inc.'
GROUP BY hashtag
ORDER BY count DESC
LIMIT 10;
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database (or Supabase account)

## Running the Application

### Backend Setup

1. Set up Python virtual environment:
   ```bash
   cd backend
   python -m venv env
   source env/bin/activate  # On Windows: .\env\Scripts\activate
   pip install -r requirements.txt
   ```

2. Configure backend environment:
   ```bash
   # Create .env file in backend directory
   echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/sentrack
   SECRET_KEY=your-secret-key
   DEBUG=True" > .env
   ```

3. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure frontend environment:
   ```bash
   # Create .env file in frontend directory
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Running Tests

### Frontend Tests

1. Install test dependencies:
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```

2. Run tests:
   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm test -- --watch

   # Run tests with coverage
   npm test -- --coverage

   # Run specific test file
   npm test -- SentimentTrend.test.tsx

   # Run tests matching a pattern
   npm test -- -t "sentiment"
   ```

3. View test coverage:
   ```bash
   npm test -- --coverage --watchAll=false
   # Coverage report will be available in coverage/lcov-report/index.html
   ```

## Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Unsplash](https://unsplash.com) for the profile images used in mock data
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Recharts](https://recharts.org/) for the charting library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
