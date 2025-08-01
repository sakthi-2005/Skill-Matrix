import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import {SkillStats,DashboardStatsProps} from "../../types/dashboardTypes";

const DashboardStats = ({
  stats,
  pendingRequests,
  title,
}: DashboardStatsProps) => {
  const skillLevels = [
    { level: "Basic", 
      count: stats.basic, 
      color: "bg-gray-100 text-gray-800" 
    },
    { level: "Low", 
      count: stats.low, 
      color: "bg-red-100 text-red-800"
    },
    {
      level: "Medium",
      count: stats.medium,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      level: "High",
      count: stats.high,
      color: "bg-blue-100 text-blue-800",
    },
    { level: "Expert", 
      count: stats.expert, 
      color: "bg-green-100 text-green-800" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {skillLevels.map((skill) => (
          <Card key={skill.level} className="hover:shadow-md transition-shadow">
            <CardHeader
              className={`flex flex-row items-center justify-between space-y-0 pb-2 ${skill.color}`}
            >
              <CardTitle className={`text-sm font-medium`}>
                {skill.level} Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skill.count}</div>
              <p className="text-xs text-muted-foreground">
                skills at123 {skill.level.toLowerCase()} level
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingRequests !== undefined && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {pendingRequests}
            </div>
            <p className="text-sm text-orange-700">
              requests awaiting your review
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
