'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart3, MessageSquare, Zap, TrendingUp, Users, DollarSign, Calendar, ChevronRight, Play, Check, X, Clock, Database, Sparkles, LineChart, PieChart, Activity } from 'lucide-react';

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    setAnimateChart(true);
  }, []);

  const problemSolutionSteps = [
    {
      problem: "Your team spends hours writing SQL queries",
      solution: "Just ask in plain English",
      visual: "sql-to-natural"
    },
    {
      problem: "Waiting days for the data team to respond",
      solution: "Get instant answers, no dependencies",
      visual: "instant-response"
    },
    {
      problem: "Complex dashboards nobody understands",
      solution: "Beautiful, automatic visualizations",
      visual: "auto-viz"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">NaturalAnalytics</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#product" className="text-gray-600 hover:text-gray-900">Product</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900">See it work</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <button className="text-gray-600 hover:text-gray-900">Sign In</button>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">
                Try it free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Story Start: The Problem */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your data has answers.
              <br />
              <span className="text-gray-400">Getting them shouldn't be this hard.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Stop wrestling with SQL. Stop waiting for reports. Just ask your question and see the answer.
            </p>
          </div>

          {/* Visual: The Old Way vs New Way */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* The Old Way - Problem */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
              <div className="flex items-center space-x-2 mb-6">
                <X className="h-6 w-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">The old way</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Hours of waiting</p>
                      <p className="text-sm text-gray-600">Slack the data team, wait for response, iterate...</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start space-x-3">
                    <Database className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Complex SQL required</p>
                      <p className="text-sm text-gray-600">Need to know table schemas, joins, aggregations...</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Only experts can access</p>
                      <p className="text-sm text-gray-600">Most of your team is blocked from insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* The New Way - Solution */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
              <div className="flex items-center space-x-2 mb-6">
                <Check className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">With NaturalAnalytics</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Instant answers</p>
                      <p className="text-sm text-gray-600">Ask your question, get results in seconds</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Plain English queries</p>
                      <p className="text-sm text-gray-600">No SQL knowledge needed, just ask naturally</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Everyone can analyze</p>
                      <p className="text-sm text-gray-600">Empower your entire team with data access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Part 2: See It In Action */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Watch your question become insight
            </h2>
            <p className="text-xl text-gray-600">
              Type naturally. Get beautiful visualizations. Share instantly.
            </p>
          </div>

          {/* Interactive Demo Showcase */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-700 rounded px-3 py-1 text-sm text-gray-400">
                    app.naturalanalytics.com
                  </div>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-8 bg-white">
                {/* Query Input */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Ask your data anything</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5">
                    <p className="text-xl text-gray-900 font-medium">
                      "Show me revenue by product category for the last 6 months"
                    </p>
                  </div>
                </div>

                {/* Live Chart Result */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Revenue by Product Category</h3>
                      <p className="text-sm text-gray-600">Last 6 months • Updated just now</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Live data</span>
                    </div>
                  </div>

                  {/* Bar Chart Visualization */}
                  <div className="grid grid-cols-6 gap-4 items-end h-64 mb-4">
                    {[
                      { height: 65, label: 'Jan', value: '$245K', color: 'bg-blue-500' },
                      { height: 78, label: 'Feb', value: '$312K', color: 'bg-blue-500' },
                      { height: 72, label: 'Mar', value: '$289K', color: 'bg-blue-500' },
                      { height: 85, label: 'Apr', value: '$358K', color: 'bg-blue-500' },
                      { height: 90, label: 'May', value: '$389K', color: 'bg-blue-500' },
                      { height: 95, label: 'Jun', value: '$425K', color: 'bg-blue-500' }
                    ].map((bar, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="relative w-full" style={{ height: '100%' }}>
                          <div 
                            className={`${bar.color} rounded-t-lg w-full absolute bottom-0 transition-all duration-1000 hover:opacity-80 cursor-pointer`}
                            style={{ 
                              height: animateChart ? `${bar.height}%` : '0%',
                              transitionDelay: `${idx * 100}ms`
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                              {bar.value}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">{bar.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                        <PieChart className="h-4 w-4" />
                        <span>Change chart type</span>
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                    <span className="text-xs text-green-600 font-semibold">⚡ Generated in 0.6s</span>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">AI Insight</p>
                      <p className="text-sm text-gray-700">Revenue is trending up 23% month-over-month. Electronics category shows strongest growth at 41%.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Examples - Multiple Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              One platform, endless questions
            </h2>
            <p className="text-xl text-gray-600">
              From executive dashboards to ad-hoc analysis, get answers to any question
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Example 1: Sales Dashboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">Sales Performance</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">"What's our sales team performance this quarter?"</p>
                
                {/* Mini Dashboard Preview */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total Revenue</span>
                    <span className="text-lg font-bold text-gray-900">$2.4M</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 rounded-full h-2" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600">78% to goal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-gray-600">Deals</p>
                      <p className="text-sm font-bold text-gray-900">156</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-gray-600">Avg Size</p>
                      <p className="text-sm font-bold text-gray-900">$15.4K</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-gray-600">Win Rate</p>
                      <p className="text-sm font-bold text-green-600">64%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <span>View full dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Example 2: Customer Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Customer Insights</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">"Which customers are at risk of churning?"</p>
                
                {/* Mini Table Preview */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {[
                    { company: 'Acme Corp', risk: 'High', value: '$45K' },
                    { company: 'TechStart', risk: 'Medium', value: '$32K' },
                    { company: 'DataCo', risk: 'High', value: '$58K' }
                  ].map((customer, idx) => (
                    <div key={idx} className="bg-white rounded p-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-900">{customer.company}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full font-semibold ${
                          customer.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {customer.risk}
                        </span>
                        <span className="text-gray-600">{customer.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <span>See all insights</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Example 3: Marketing Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Marketing ROI</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">"What's our best performing marketing channel?"</p>
                
                {/* Mini Chart Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {[
                      { channel: 'Email', roi: 420, width: '90%' },
                      { channel: 'Social', roi: 280, width: '65%' },
                      { channel: 'Search', roi: 350, width: '78%' },
                      { channel: 'Display', roi: 150, width: '38%' }
                    ].map((channel, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{channel.channel}</span>
                          <span className="text-xs font-bold text-gray-900">{channel.roi}% ROI</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-2"
                            style={{ width: channel.width }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <span>Explore metrics</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Journey: How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              From question to insight in 3 steps
            </h2>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ask in plain English</h3>
                <p className="text-lg text-gray-600 mb-4">
                  No SQL required. Just type your question naturally, like you'd ask a colleague.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 italic">"Show me customers who haven't purchased in 3 months"</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">AI creates the perfect visualization</h3>
                <p className="text-lg text-gray-600 mb-4">
                  Our AI understands your data and automatically generates the best chart or table for your question.
                </p>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">AI is analyzing...</span>
                      </div>
                      <div className="bg-white/60 rounded h-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Share and collaborate</h3>
                <p className="text-lg text-gray-600 mb-4">
                  One click to share insights with your team. Everyone stays on the same page with live data.
                </p>
                <div className="flex items-center space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                    Share dashboard
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50">
                    Export to PDF
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50">
                    Schedule report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof with Results */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Real teams, real results
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-5xl font-bold text-blue-600 mb-2">92%</div>
              <p className="text-gray-600 mb-4">reduction in time to insights</p>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-900 font-semibold">TechCorp</p>
                <p className="text-xs text-gray-600">Series B SaaS Company</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-5xl font-bold text-blue-600 mb-2">$125K</div>
              <p className="text-gray-600 mb-4">saved annually consolidating tools</p>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-900 font-semibold">DataFlow</p>
                <p className="text-xs text-gray-600">Enterprise Analytics Team</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-5xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-gray-600 mb-4">more employees using data daily</p>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-900 font-semibold">Innovate Inc</p>
                <p className="text-xs text-gray-600">Fast-Growing Startup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start getting answers today
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            Free forever plan. No credit card required. Connect your data in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-white text-blue-600 px-10 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg">
              <span>Start free trial</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-white text-white px-10 py-4 rounded-lg hover:bg-white/10 font-semibold text-lg flex items-center justify-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Watch demo</span>
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>5 minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-white">NaturalAnalytics</span>
            </div>
            <div className="flex space-x-8 text-sm">
              <a href="#" className="hover:text-white">Product</a>
              <a href="#" className="hover:text-white">Pricing</a>
              <a href="#" className="hover:text-white">Documentation</a>
              <a href="#" className="hover:text-white">Support</a>
              <a href="#" className="hover:text-white">Privacy</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 NaturalAnalytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}