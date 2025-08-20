import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TrendData {
  date: string;
  totalJobs: number;
  highScoringJobs: number;
  averageScore: number;
}

export default function Home() {
  const [trends, setTrends] = useState<TrendData[]>([]);

  useEffect(() => {
    fetch(`http://localhost:4001/api/jobs/stats/trends`)
      .then((res) => res.json())
      .then((data) => setTrends(data))
      .catch((err) => console.error("Error fetching trends:", err));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Trends</h1>
      <LineChart
        width={800}
        height={400}
        data={trends}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="totalJobs"
          stroke="#8884d8"
          name="Total Jobs"
        />
        <Line
          type="monotone"
          dataKey="highScoringJobs"
          stroke="#82ca9d"
          name="High Scoring Jobs (≥75%)"
        />
        <Line
          type="monotone"
          dataKey="averageScore"
          stroke="#ff7300"
          name="Average Score"
        />
      </LineChart>
    </div>
  );
}
