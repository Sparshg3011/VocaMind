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

export default function SentimentAnalysisCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5050/api/sentiment-test")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sentiment analysis");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-3 text-3xl">
            {emoji} <span>Sentiment Analysis</span>
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Overall sentiment is <span className={`font-bold ${label === "Positive" ? "text-green-600" : label === "Negative" ? "text-red-600" : "text-yellow-600"}`}>{label}</span> (score: {score})
          </CardDescription>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-lg px-4 py-2 rounded-full font-semibold shadow ${label === "Positive" ? "bg-green-100 text-green-700" : label === "Negative" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <ChartContainer
              config={{ Positive: { color: "#22c55e" }, Negative: { color: "#ef4444" }, Neutral: { color: "#facc15" } }}
            >
              <RechartsPrimitive.BarChart data={chartData}>
                <RechartsPrimitive.XAxis dataKey="name" />
                <RechartsPrimitive.YAxis allowDecimals={false} />
                <RechartsPrimitive.Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <RechartsPrimitive.Cell key={`cell-${idx}`} fill={entry.name === "Positive" ? "#22c55e" : entry.name === "Negative" ? "#ef4444" : "#facc15"} />
                  ))}
                </RechartsPrimitive.Bar>
              </RechartsPrimitive.BarChart>
            </ChartContainer>
            <div className="text-xs text-muted-foreground mt-2">Word sentiment distribution</div>
          </div>
          {/* Impactful Words */}
          <div>
            <div className="font-semibold mb-2">Most Impactful Words</div>
            <div className="flex flex-wrap gap-2">
              {topWords.map((w, i) => (
                <span
                  key={w.word + i}
                  className={`px-2 py-1 rounded-full text-sm font-medium shadow ${w.type === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {w.word} <span className="text-xs">({w.freq})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Transcript Text */}
        <div className="mt-6">
          <div className="font-semibold mb-1">Analyzed Transcript</div>
          <ScrollArea className="max-h-40 border rounded p-3 bg-white/80 text-sm">
            {text}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
} 