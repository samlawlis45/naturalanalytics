# NaturalAnalytics

> Analytics that feels natural

Transform your data into insights with natural language queries and beautiful visualizations. The future of analytics is here.

## 🚀 Features

- **Natural Language Queries**: Simply ask "Show me sales by region" and get instant, beautiful charts
- **Visual Query Builder**: Drag and drop to build complex dashboards without writing a single line of code
- **Instant Results**: Get answers in seconds, not hours. Our AI understands your data instantly
- **Multiple Data Sources**: Works with PostgreSQL, MySQL, BigQuery, Snowflake, and more
- **Enterprise Security**: Bank-grade security with role-based access control and data encryption
- **API First**: Integrate with your existing tools using our powerful REST API

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4 for natural language processing
- **Charts**: Recharts for data visualization
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel

## 🏗️ Project Structure

```
naturalanalytics/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── query/         # Natural language query endpoint
│   │   ├── demo/              # Demo page
│   │   ├── builder/           # Visual query builder
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable UI components
│   │   └── ui/                # Base UI components
│   └── lib/                   # Utility functions
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding
└── public/                    # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/naturalanalytics.git
   cd naturalanalytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/naturalanalytics"
   
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Stripe (optional)
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Usage

### Natural Language Queries

Visit `/demo` to try natural language queries:

- "Show me total sales by month"
- "How many customers do we have?"
- "What are our top selling products?"
- "Show me sales by country"

### Visual Query Builder

Visit `/builder` to use the visual query builder:

1. Select a data source (table)
2. Choose metrics to measure
3. Add dimensions for grouping
4. Set time ranges
5. Generate and execute queries

## 🗄️ Database Schema

The application uses a multi-tenant architecture with the following key entities:

- **Users**: Application users with authentication
- **Organizations**: Multi-tenant organizations
- **Data Sources**: Connected databases and data sources
- **Queries**: Natural language queries and their SQL translations
- **Dashboards**: Saved dashboard configurations
- **API Keys**: API access for integrations

## 🔌 API Endpoints

### Query API

**POST** `/api/query`

Convert natural language to SQL and execute queries.

```json
{
  "query": "Show me total sales by month"
}
```

Response:
```json
{
  "sqlQuery": "SELECT DATE_TRUNC('month', order_date) as month, SUM(total_amount) as total_sales FROM orders GROUP BY month ORDER BY month",
  "result": [...],
  "executionTime": 150,
  "status": "completed"
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🧪 Development

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
npx prisma db push --force-reset

# Generate new migration
npx prisma migrate dev --name your-migration-name
```

### Code Quality

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Core repository setup
- [x] Natural language query engine
- [x] Basic visualization components
- [x] Demo interface

### Phase 2: SaaS Features
- [ ] User authentication and authorization
- [ ] Multi-tenant organization support
- [ ] Billing and subscription management
- [ ] API key management

### Phase 3: Advanced Features
- [ ] Real database connections
- [ ] Advanced chart types
- [ ] Dashboard sharing and collaboration
- [ ] Data source management

### Phase 4: Ecosystem
- [ ] visualizations.app - Design-focused interface
- [ ] instantdashboards.ai - Speed-focused interface
- [ ] visibility.app - Monitoring-focused interface
- [ ] dashboardengine.ai - API infrastructure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@naturalanalytics.ai
- 📖 Documentation: [docs.naturalanalytics.ai](https://docs.naturalanalytics.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/naturalanalytics/issues)

## 🙏 Acknowledgments

- OpenAI for the GPT-4 API
- Vercel for the deployment platform
- The Next.js team for the amazing framework
- The open-source community for the incredible tools

---

**Built with ❤️ by the NaturalAnalytics team**