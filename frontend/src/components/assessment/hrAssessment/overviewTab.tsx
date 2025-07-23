import { AssessmentWithHistory, AssessmentCycle } from "@/types/assessmentTypes";
import React from "react";

export const OverviewTab: React.FC<{
  assessments: AssessmentWithHistory[];
  cycles: AssessmentCycle[];
  statistics: any;
}> = ({ assessments, cycles, statistics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Recent Assessment Activity</h3>
          <div className="space-y-3">
            {assessments.slice(0, 5).map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{assessment.user?.name}</p>
                  <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {assessment.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Cycles */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Active Assessment Cycles</h3>
          <div className="space-y-3">
            {cycles.filter(c => c.status === "ACTIVE").slice(0, 5).map((cycle) => (
              <div key={cycle.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cycle.title}</p>
                  <p className="text-sm text-gray-500">{cycle.totalAssessments} assessments</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {cycle.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};