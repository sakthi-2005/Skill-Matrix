import { AssessmentCycle } from "@/types/assessmentTypes";
import React, {useState} from "react";
import { AssessmentsTab } from "./new";

export const CyclesTab: React.FC<{ cycles: AssessmentCycle[]; formatDate: (date: string | Date) => string; userSummaries:any[]}> = ({ cycles, formatDate, userSummaries }) => {
  console.log(cycles);
  const [assessmentId,setAssessmentId] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      { assessmentId === null ?
        <>
          <h3 className="text-lg font-semibold">Assessments</h3>
          <div className="grid grid-cols-1 gap-4">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md" onClick={()=>setAssessmentId(cycle.id)}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{cycle.title}</h4>
                  {/* {new Date(cycle?.deadlineDate) < new Date() ? "overdue" : "still active" } */}
                  <div className="flex gap-5">
                    { new Date(cycle?.deadlineDate) < new Date() &&
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      Deadline Ended
                    </span>
                    }
                    <span className={`px-2 py-1 rounded text-xs ${
                      cycle.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                      cycle.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                      ""
                    }`}>
                      {cycle.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Assessments:</span>
                    <span className="ml-2 font-medium">{cycle.totalAssessments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2 font-medium">{cycle.completedAssessments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{formatDate(cycle.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <span className="ml-2">{Math.round((cycle.completedAssessments / cycle.totalAssessments) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </> :
        <>
          <AssessmentsTab
          setAssessmentId={setAssessmentId}
          assessments={cycles.find(e=>e.id===assessmentId).assessments}
          formateDate={formatDate}
          />
        </>
      }
    </div>
  );
};