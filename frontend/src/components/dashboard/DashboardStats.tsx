import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { SkillStats, DashboardStatsProps } from "../../types/dashboardTypes";
import { MousePointer2 } from "lucide-react";

const DashboardStats = ({
  stats,
  pendingRequests,
  title,
  onSkillLevelClick,
}: DashboardStatsProps) => {
  const skillLevels = [
    { 
      level: "Basic", 
      key: "basic" as const,
      count: stats.basic, 
      color: "bg-gray-100 text-gray-800" 
    },
    { 
      level: "Low", 
      key: "low" as const,
      count: stats.low, 
      color: "bg-red-100 text-red-800"
    },
    {
      level: "Medium",
      key: "medium" as const,
      count: stats.medium,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      level: "High",
      key: "high" as const,
      count: stats.high,
      color: "bg-blue-100 text-blue-800",
    },
    { 
      level: "Expert", 
      key: "expert" as const,
      count: stats.expert, 
      color: "bg-green-100 text-green-800" 
    },
  ];

  const handleCardClick = (skillKey: 'basic' | 'low' | 'medium' | 'high' | 'expert') => {
    if (onSkillLevelClick) {
      onSkillLevelClick(skillKey);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {skillLevels.map((skill) => (
          <Card 
            key={skill.level} 
            className={`hover:shadow-md transition-all duration-200 ${
              onSkillLevelClick && skill.count > 0 
                ? 'cursor-pointer hover:scale-105 hover:shadow-lg border-2 hover:border-blue-300' 
                : ''
            }`}
            onClick={() => skill.count > 0 && handleCardClick(skill.key)}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between space-y-0 pb-2 ${skill.color}`}
            >
              <CardTitle className={`text-sm font-medium`}>
                {skill.level} Skills
              </CardTitle>
              {onSkillLevelClick && skill.count > 0 && (
                <MousePointer2 className="h-3 w-3 opacity-60" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skill.count}</div>
              <p className="text-xs text-muted-foreground">
                skills at {skill.level.toLowerCase()} level
                {onSkillLevelClick && skill.count > 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingRequests !== undefined}
    </div>
  );
};

export default DashboardStats;
