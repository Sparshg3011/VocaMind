import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as RechartsPrimitive from 'recharts';

const getSentimentEmoji = (score: number) => {
  if (score > 5) return "😃";
  if (score < -5) return "😡";
  if (score >= -5 && score <= 5) return "😐";
};

const getSentimentLabel = (score: number) => {
  if (score > 5) return "Positive";
  if (score < -5) return "Negative";
  return "Neutral";
};

type ImpactfulWord = { word: string; type: "positive" | "negative"; freq?: number; score?: number };

interface SentimentAnalysisCardProps {
  callId?: string;
  selectedCall?: any;
}

export default function SentimentAnalysisCard({ callId, selectedCall }: SentimentAnalysisCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSentimentAnalysis = async () => {
      setLoading(true);
      setError("");
      
      try {
        let url = "http://localhost:5050/api/sentiment-test"; // fallback
        
        if (callId) {
          url = `http://localhost:5050/api/sentiment-analysis/${callId}`;
        } else if (selectedCall?._id) {
          url = `http://localhost:5050/api/sentiment-analysis/${selectedCall._id}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch sentiment analysis");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
        // If specific call analysis fails, fallback to test endpoint
        if (callId || selectedCall) {
          try {
            const fallbackRes = await fetch("http://localhost:5050/api/sentiment-test");
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              setData(fallbackJson);
              setError(""); // Clear error since fallback worked
            }
          } catch (fallbackErr) {
            // Keep original error
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentAnalysis();
  }, [callId, selectedCall]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-100 to-blue-50 animate-pulse">
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Analyzing transcript sentiment...</CardDescription>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="bg-red-50">
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent className="text-red-700">{error}</CardContent>
      </Card>
    );
  }

  const { sentiment, text } = data;
  const score = sentiment.score;
  const label = getSentimentLabel(score);
  const emoji = getSentimentEmoji(score);
  const positiveWords: string[] = sentiment.positive || [];
  const negativeWords: string[] = sentiment.negative || [];
  const posCount = positiveWords.length;
  const negCount = negativeWords.length;
  const neutralCount = sentiment.tokens.length - posCount - negCount;

  // Prepare chart data
  const chartData = [
    { name: "Positive", value: posCount },
    { name: "Negative", value: negCount },
    { name: "Neutral", value: neutralCount },
  ];

  // Extract impactful words from the calculation array
  const impactfulWords: ImpactfulWord[] = [];
  const wordSeen = new Set<string>();
  sentiment.calculation.forEach((item: any) => {
    const word = Object.keys(item)[0];
    const score = item[word];
    if (
      (score >= 2 || score <= -2) && // Only strong sentiment words
      !wordSeen.has(word) &&
      word !== "prospect" && // Filter out contextually neutral words
      word !== "risk"
    ) {
      impactfulWords.push({
        word,
        type: score > 0 ? "positive" : "negative",
        freq: sentiment.tokens.filter((t: string) => t === word).length,
        score,
      });
      wordSeen.add(word);
    }
  });
  impactfulWords.sort(
    (a, b) =>
      Math.abs(b.score ?? 0) - Math.abs(a.score ?? 0) ||
      (b.freq ?? 0) - (a.freq ?? 0)
  );
  const topWords = impactfulWords.slice(0, 10);

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-tr-full"></div>
      
      <CardHeader className="relative z-10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl font-bold text-gray-800">
              <div className="text-4xl lg:text-5xl animate-pulse">{emoji}</div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Sentiment Analysis
              </span>
            </CardTitle>
            <CardDescription className="text-base lg:text-lg text-gray-600">
              Overall sentiment is{" "}
              <span className={`font-bold text-lg px-3 py-1 rounded-full ${
                label === "Positive" 
                  ? "bg-green-100 text-green-700" 
                  : label === "Negative" 
                  ? "bg-red-100 text-red-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {label}
              </span>
              {" "}with a confidence score of{" "}
              <span className="font-mono font-bold text-gray-800">{score}</span>
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-center lg:items-end">
            <div className={`relative px-6 py-3 rounded-2xl font-bold text-xl shadow-lg transform transition-all duration-300 hover:scale-105 ${
              label === "Positive" 
                ? "bg-gradient-to-r from-green-400 to-green-500 text-white" 
                : label === "Negative" 
                ? "bg-gradient-to-r from-red-400 to-red-500 text-white" 
                : "bg-gradient-to-r from-amber-400 to-yellow-500 text-white"
            }`}>
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <span className="relative z-10">{label}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Sentiment Score</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enhanced Chart */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-800">Word Distribution</h3>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-white/50">
              <ChartContainer
                config={{ 
                  Positive: { color: "#10b981" }, 
                  Negative: { color: "#ef4444" }, 
                  Neutral: { color: "#f59e0b" } 
                }}
              >
                <RechartsPrimitive.BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <RechartsPrimitive.XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                                     <RechartsPrimitive.YAxis 
                     allowDecimals={false} 
                     tick={{ fontSize: 12, fill: '#6b7280' }}
                     axisLine={{ stroke: '#e5e7eb' }}
                   />
                   <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <RechartsPrimitive.Bar 
                    dataKey="value" 
                    name="Count" 
                    radius={[12, 12, 4, 4]}
                    className="drop-shadow-sm"
                  >
                    {chartData.map((entry, idx) => (
                      <RechartsPrimitive.Cell 
                        key={`cell-${idx}`} 
                        fill={
                          entry.name === "Positive" 
                            ? "url(#positiveGradient)" 
                            : entry.name === "Negative" 
                            ? "url(#negativeGradient)" 
                            : "url(#neutralGradient)"
                        } 
                      />
                    ))}
                  </RechartsPrimitive.Bar>
                  <defs>
                    <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                </RechartsPrimitive.BarChart>
              </ChartContainer>
              <div className="text-xs text-gray-500 mt-3 text-center font-medium">
                Distribution of sentiment across analyzed words
              </div>
            </div>
          </div>
          
          {/* Enhanced Impactful Words */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-800">Key Sentiment Indicators</h3>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-white/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topWords.map((w, i) => (
                  <div
                    key={w.word + i}
                    className={`group relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default ${
                      w.type === "positive" 
                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-l-4 border-green-400" 
                        : "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-l-4 border-red-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{w.word}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          w.type === "positive" ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                        }`}>
                          {w.freq}×
                        </span>
                        <span className="text-xs opacity-75">
                          {w.type === "positive" ? "+" : ""}{w.score}
                        </span>
                      </div>
                    </div>
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                      w.type === "positive" ? "bg-green-400" : "bg-red-400"
                    }`}></div>
                  </div>
                ))}
              </div>
              {topWords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm">No significant sentiment indicators found</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Analysis Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{posCount}</div>
              <div className="text-xs text-gray-600 font-medium">Positive Words</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{negCount}</div>
              <div className="text-xs text-gray-600 font-medium">Negative Words</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">{neutralCount}</div>
              <div className="text-xs text-gray-600 font-medium">Neutral Words</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{sentiment.tokens.length}</div>
              <div className="text-xs text-gray-600 font-medium">Total Words</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 