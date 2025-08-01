import {
  XCircle,
  FileText,
} from "lucide-react";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  DetailedScore,
} from "@/types/assessmentTypes";

export const UserHistoryModal: React.FC<{
  userName: string;
  assessmentHistory: AssessmentWithHistory[];
  isOpen: boolean;
  onClose: () => void;
  onShowScoreHistory: (assessmentId: number) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  formatDate: (date: string | Date) => string;
}> = ({ userName, assessmentHistory, isOpen, onClose, onShowScoreHistory, getStatusColor, formatDate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assessment History - {userName}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Total assessments: {assessmentHistory.length}
          </p>
        </div>

        <div className="p-6">
          {assessmentHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No assessment history found</p>
              <p className="text-sm text-gray-500">This user has no assessment records</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentHistory.map((assessment, index) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Assessment #{assessment.id}</h4>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(assessment.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                      {assessment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">{assessment.status.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cycle:</span>
                      <span className="ml-2">{assessment.currentCycle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Skills:</span>
                      <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Score Changes:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {assessment.history?.filter(h => h.auditType?.includes('SCORE')).length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-2">{assessment.completedAt ? formatDate(assessment.completedAt) : 'Not completed'}</span>
                    </div>
                  </div>

                  {/* Show skills and scores if available */}
                  {assessment.detailedScores && assessment.detailedScores.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-700">Skills Assessment:</h5>
                        <button
                          onClick={() => onShowScoreHistory(assessment.id)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          View Score Changes
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {assessment.detailedScores.map((score: DetailedScore) => (
                          
                          <div key={score.skillId} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                            
                            <span className="text-gray-700">{score.Skill?.name}</span>
                            {score.score !== null ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {score.score}/5
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Not scored</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assessment.history.map((audit, auditIndex) => {
                    const isScoreChange = audit.auditType?.includes("SCORE");
                    const isApproval = audit.auditType?.includes("APPROVED");
                    const isRejection = audit.auditType?.includes("REJECTED");

                    const color = isApproval
                      ? "bg-green-500"
                      : isRejection
                      ? "bg-red-500"
                      : "bg-blue-500";

                    const textColor = isApproval
                      ? "text-green-700"
                      : isRejection
                      ? "text-red-700"
                      : isScoreChange
                      ? "text-blue-700"
                      : "text-gray-700";

                    const rejectedCount = assessment.history
                      .slice(0, auditIndex)
                      .filter(h => h.auditType?.includes("REJECTED")).length;
                    const isLast=index===assessment.history.length-1;

                    const indentStyle = { marginLeft: rejectedCount * 24 + "px" };
                    return (
                      
                      <div key={auditIndex} className="relative pl-10" style={indentStyle}>
                        
                        {/* Vertical line */}
                        {auditIndex !== assessment.history.length - 1 && !isLast && !isRejection &&(
                          <div className="absolute left-3.5 top-[28px] bottom-[-32px]  w-px bg-gray-300 z-0"></div>
                        )}

                        {/* Circle with icon */}
                        <span
                          className={`absolute left-0 top-4 w-7 h-7 rounded-full flex items-center justify-center ${color} z-10`}
                        >
                          {isRejection ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 8.586l3.536-3.535a1 1 0 111.415 1.414L11.414 10l3.536 3.535a1 1 0 01-1.415 1.415L10 11.414l-3.535 3.536a1 1 0 01-1.415-1.415L8.586 10 5.05 6.464a1 1 0 111.415-1.414L10 8.586z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 text-white"
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

                        {/* Content block */}
                        <div className="bg-white rounded px-4 py-4 shadow-sm mb-4 ml-4">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${textColor}`}>
                                {audit.auditType?.replace(/_/g, " ") || "Unknown Action"}
                              </span>
                              <span className="text-gray-500">
                                by {(audit as any).editorName || "System"}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs whitespace-nowrap">
                              {formatDate(audit.auditedAt || audit.createdAt)}
                            </span>
                          </div>
                          {audit.comments && (
                            <p className="text-sm text-gray-600 mt-1 italic border-l border-gray-300 pl-2">
                              “{audit.comments}”
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};