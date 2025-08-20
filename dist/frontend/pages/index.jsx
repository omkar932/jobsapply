"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const recharts_1 = require("recharts");
function Home() {
    const [trends, setTrends] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        fetch(`http://localhost:4001/api/jobs/stats/trends`)
            .then((res) => res.json())
            .then((data) => setTrends(data))
            .catch((err) => console.error("Error fetching trends:", err));
    }, []);
    return (<div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Trends</h1>
      <recharts_1.LineChart width={800} height={400} data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <recharts_1.CartesianGrid strokeDasharray="3 3"/>
        <recharts_1.XAxis dataKey="date"/>
        <recharts_1.YAxis />
        <recharts_1.Tooltip />
        <recharts_1.Legend />
        <recharts_1.Line type="monotone" dataKey="totalJobs" stroke="#8884d8" name="Total Jobs"/>
        <recharts_1.Line type="monotone" dataKey="highScoringJobs" stroke="#82ca9d" name="High Scoring Jobs (≥75%)"/>
        <recharts_1.Line type="monotone" dataKey="averageScore" stroke="#ff7300" name="Average Score"/>
      </recharts_1.LineChart>
    </div>);
}
