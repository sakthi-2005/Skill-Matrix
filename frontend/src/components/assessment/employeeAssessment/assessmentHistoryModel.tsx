import {XCircle} from "lucide-react";
import {
  AssessmentWithHistory,
  DetailedScore,
  AuditEntry,
} from "@/types/assessmentTypes";

export const AssessmentHistoryModal: React.FC<{
  assessment: AssessmentWithHistory;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}> = ({ assessment, onClose, formatDate }) => {
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
          <div>
            <h3 className="font-medium mb-3">Assessment History</h3>
            <div className="space-y-3">
              {assessment.history?.map((audit: AuditEntry, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{audit.auditType.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(audit.auditedAt || audit.createdAt)}
                    </span>
                  </div>
                  {audit.comments && (
                    <p className="text-sm text-gray-600 mt-1">{audit.comments}</p>
                  )}
                </div>
              ))}
            </div>
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