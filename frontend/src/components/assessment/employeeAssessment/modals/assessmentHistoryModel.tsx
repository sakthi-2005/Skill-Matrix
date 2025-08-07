import {XCircle} from "lucide-react";
import {
  AssessmentWithHistory,
  DetailedScore,
  AuditEntry,
} from "@/types/assessmentTypes";
import { useState } from "react";

export const AssessmentHistoryModal: React.FC<{
  assessment: AssessmentWithHistory;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}> = ({ assessment, onClose, formatDate }) => {

  let scoreUpdated = [];
  const [showSkills,setShowSkills] = useState(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assessment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Assessment #{assessment.id} - Cycle {assessment.currentCycle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{assessment.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2 font-medium">{assessment.currentCycle}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDate(assessment.requestedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Scheduled:</span>
                <span className="ml-2">{formatDate(assessment.scheduledDate || assessment.requestedAt)}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores */}
          {assessment.detailedScores && assessment.detailedScores.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Skill Assessment</h3>
              <div className="space-y-3">
                {assessment.detailedScores.map((score: DetailedScore) => (
                  <div key={score.skillId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <span className="font-medium">{score.Skill?.name}</span>
                    <div className="flex items-center gap-2">
                      {score.score !== null && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          Lead: {score.score}/5
                        </span>
                      )}
                      {score.score === null && (
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-sm">
                          Not assessed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <h3 className="font-medium mb-3">Assessment History</h3>
          <div>
            {assessment.history?.map((audit: AuditEntry, index: number) => {

              const isRejected = audit.auditType.toLowerCase().includes("rejected");
              const isApproved =
                audit.auditType.toLowerCase().includes("approved") ||
                audit.auditType.toLowerCase().includes("completed");
              const circleColor = isApproved
                ? "bg-green-500"
                : isRejected
                ? "bg-red-500"
                : "bg-blue-500";

              // Count rejections before this step for indentation
              const rejectedCount = assessment.history
                .slice(0, index)
                .filter((h) => h.auditType.toLowerCase().includes("rejected")).length;

              const indent = `ml-${rejectedCount * 8}`; // Tailwind spacing (ml-4, ml-8...)
              const isLast=index===assessment.history.length-1;

              if(audit.auditType.toLowerCase().includes("score")){
                scoreUpdated.push(audit);
                return;
              }
              if(scoreUpdated.length !== 0){
                let temp_count = scoreUpdated.length;
                let print_scoreUpdated = scoreUpdated;
                scoreUpdated = [];
                return(
                  <div key={index} className={`relative py-4 ${indent}`}>
                    {/* Line connector */}
                    {!isRejected && !isLast &&(
                      <div className="absolute left-11 top-[28px] bottom-[-16px] w-px bg-gray-300 z-0"></div>
                    )}
                    <span
                      className={`absolute left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center ${circleColor} z-10`}
                      onClick={()=>setShowSkills(e=> e === audit.id ? null : audit.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div className="ml-16 flex flex-col md:flex-row md:justify-between md:items-center">
                      <span className="font-semibold text-gray-800">
                        SCORE UPDATED
                      </span>
                      <span className="text-sm text-gray-500 mt-1 md:mt-0">
                        {formatDate(print_scoreUpdated[0]?.auditedAt || print_scoreUpdated[0]?.createdAt)}
                      </span>
                    </div>
                    {showSkills !== audit.id ? (
                      <p className="ml-16 text-sm text-gray-600 mt-1 italic">“Score Updated for {temp_count} Skills”</p>
                    ) : 
                    <>
                      <div className="space-y-3 w-[70%] ml-10 pl-10 mt-2">
                        {print_scoreUpdated.map((score) => (
                          <div key={score.skillId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                            <span className="font-medium">{score.skillName}</span>
                            <div className="flex items-center gap-2">
                              {score.currentScore !== null && (
                                <>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {Number(score.previousScore) || 0}
                                  </span>
                                  &nbsp;
                                  &rarr;
                                  &nbsp;
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {Number(score.currentScore)}
                                  </span>
                                </>
                              )}
                              {score.score === null && (
                                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-sm">
                                  Not assessed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                    }
                    
                  </div>
                )
              }

              return (
                <div key={index} className={`relative py-4 ${indent}`}>
                  {/* Line connector */}
                  {!isRejected && !isLast &&(
                    <div className="absolute left-11 top-[28px] bottom-[-16px] w-px bg-gray-300 z-0"></div>
                  )}

                  {/* Circle */}
                  <span
                    className={`absolute left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center ${circleColor} z-10`}
                  >
                    {isRejected ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 8.586L13.536 5.05a1 1 0 111.414 1.414L11.414 10l3.536 3.536a1 1 0 11-1.414 1.414L10 11.414l-3.536 3.536a1 1 0 01-1.414-1.414L8.586 10 5.05 6.464a1 1 0 111.414-1.414L10 8.586z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>

                  {/* Text content */}
                  <div className="ml-16 flex flex-col md:flex-row md:justify-between md:items-center">
                    <span className="font-semibold text-gray-800">
                      {audit.auditType.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-500 mt-1 md:mt-0">
                      {formatDate(audit.auditedAt || audit.createdAt)}
                    </span>
                  </div>
                  {audit.comments && (
                    <p className="ml-16 text-sm text-gray-600 mt-1 italic">“{audit.comments}”</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};