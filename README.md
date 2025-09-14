# Motia Content Creation App

A comprehensive content creation pipeline built with Motia that automates the entire process from topic research to multi-platform publishing.

## 🚀 Features

- **Topic Research**: Automated web research using DuckDuckGo and web scraping
- **AI Content Generation**: OpenAI-powered content creation for multiple platforms
- **Quality Assurance**: Automated fact-checking, plagiarism detection, and brand compliance
- **Manual Review**: Human-in-the-loop review process for content approval
- **Multi-Platform Publishing**: Automated publishing to WordPress, LinkedIn, Twitter, and Medium
- **Performance Tracking**: Analytics and insights for content performance
- **Strategy Optimization**: AI-driven content strategy recommendations

## 🏗️ Architecture

The app follows an event-driven architecture with the following pipeline:

```
Content Request → Topic Research → AI Generation → Quality Assurance → Manual Review → Publishing → Performance Tracking
```

### Steps Overview

| Step | Type | Description |
|------|------|-------------|
| `content-request` | API | Entry point for content creation requests |
| `topic-research` | Event | Web research and topic analysis |
| `ai-content-generator` | Event | AI-powered content generation |
| `quality-assurance` | Event | Automated quality checks |
| `manual-review` | Event | Human review and approval |
| `multi-platform-publisher` | Event | Multi-platform content publishing |
| `performance-tracker` | Event | Performance analytics |
| `strategy-optimizer` | Cron | Daily strategy optimization |

## 🛠️ Tech Stack

- **Framework**: Motia (Event-driven workflow engine)
- **Languages**: TypeScript, Python
- **AI**: OpenAI GPT models
- **Web Scraping**: DuckDuckGo Search, BeautifulSoup, Requests
- **Validation**: Zod schemas
- **UI**: React with Motia Workbench

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Motia-contentCreation-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Python environment**
   ```bash
   python -m venv python_modules
   python_modules\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file
   OPENAI_API_KEY=your_openai_api_key
   ```

## 🚀 Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the Workbench**
   - Open `http://localhost:3000` in your browser
   - View the content creation pipeline flow

3. **Create content**
   ```bash
   # PowerShell
   Invoke-WebRequest -Uri "http://localhost:3000/api/content-request" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"topic": "AI automation for small businesses", "targetPlatforms": ["blog", "twitter", "linkedin"], "urgency": "normal", "audience": {"persona": "small business owner", "language": "en", "readingLevel": "beginner"}}'
   ```

## 📋 API Endpoints

### Content Request
- **POST** `/api/content-request`
- **Body**: Content request with topic, platforms, audience
- **Response**: Trace ID and request status

### Manual Review
- **POST** `/api/manual-review`
- **Body**: Review action (approve/reject) with trace ID
- **Response**: Review status

## 🔧 Configuration

### Content Request Schema
```typescript
{
  topic: string;
  sourceUrl?: string;
  targetPlatforms: ['blog', 'twitter', 'linkedin', 'newsletter'];
  urgency: 'low' | 'normal' | 'high';
  audience: {
    persona: string;
    language: string;
    readingLevel: 'beginner' | 'intermediate' | 'expert';
  };
}
```

### Platform Content Schema
```typescript
{
  blog?: string;
  twitter?: string[];
  linkedin?: string;
  newsletter?: string;
}
```

## 🎯 Usage Examples

### Basic Content Request
```json
{
  "topic": "AI automation for small businesses",
  "targetPlatforms": ["blog", "twitter", "linkedin"],
  "urgency": "normal",
  "audience": {
    "persona": "small business owner",
    "language": "en",
    "readingLevel": "beginner"
  }
}
```

### Advanced Content Request
```json
{
  "topic": "Machine Learning in Healthcare",
  "sourceUrl": "https://example.com/article",
  "targetPlatforms": ["blog", "twitter", "linkedin", "newsletter"],
  "urgency": "high",
  "audience": {
    "persona": "healthcare professional",
    "language": "en",
    "readingLevel": "expert"
  }
}
```

## 🔍 Monitoring & Debugging

### Logs
The app provides detailed logging for each step:
- Content request processing
- Research progress
- AI generation status
- Quality check results
- Review decisions
- Publishing outcomes

### Workbench
- Visual pipeline representation
- Real-time step execution
- Error tracking and debugging
- Manual intervention points

## 🚀 Deployment

### Production Setup
1. Configure production environment variables
2. Set up external services (OpenAI, publishing platforms)
3. Deploy using Motia Cloud or self-hosted deployment
4. Configure monitoring and alerting

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
WORDPRESS_API_URL=your_wordpress_api_url
LINKEDIN_API_KEY=your_linkedin_api_key
TWITTER_API_KEY=your_twitter_api_key
MEDIUM_API_KEY=your_medium_api_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Motia Documentation](https://www.motia.dev/docs)
- Open an issue in this repository
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete content creation pipeline
- Multi-platform publishing
- Quality assurance system
- Manual review process
- Performance tracking
- Strategy optimization
