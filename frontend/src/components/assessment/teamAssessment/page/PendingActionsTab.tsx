import React from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  AlertCircle,
} from "lucide-react";
import { AssessmentWithHistory, AssessmentStatus } from "../../../../types/assessmentTypes";

interface Props {
  pendingAssessments: AssessmentWithHistory[];
  isLoading: boolean;
  handleWriteAssessment: (assessment: AssessmentWithHistory) => void;
  handleViewHistory: (assessment: AssessmentWithHistory) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  getStatusIcon: (status: AssessmentStatus) => React.ReactNode;
  formatDate: (date: string | Date) => string;
}

const PendingActionsTab: React.FC<Props> = ({
  pendingAssessments,
  isLoading,
  handleWriteAssessment,
  handleViewHistory,
  getStatusColor,
  getStatusIcon,
  formatDate,
}) => {
  console.log(pendingAssessments);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-lg text-gray-600">Loading pending actions...</p>
      </div>
    );
  }

  const leadWritingAssessments = pendingAssessments.filter(
    (a) =>
      a.status === AssessmentStatus.LEAD_WRITING ||
      a.status === AssessmentStatus.INITIATED
  );

  const rejectedAssessments = leadWritingAssessments.filter(
    (a) => a.wasRecentlyRejected
  );
  const newAssessments = leadWritingAssessments.filter(
    (a) => !a.wasRecentlyRejected
  );

  console.log(leadWritingAssessments,rejectedAssessments,newAssessments);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Pending Actions
      </h3>

      {leadWritingAssessments.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">No pending actions</p>
          <p className="text-sm text-gray-500">
            All assessments are up to date
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rejected Assessments */}
          {rejectedAssessments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <h4 className="text-base font-semibold text-red-700">
                  Requires Immediate Attention ({rejectedAssessments.length})
                </h4>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  REJECTED BY EMPLOYEE
                </span>
              </div>

              {rejectedAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-800">
                          {assessment.user?.name}
                        </h4>
                        <p className="text-sm text-red-600">
                          Assessment #{assessment.id} • Cycle{" "}
                          {assessment.currentCycle}
                        </p>
                      </div>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-300">
                      NEEDS REVISION
                    </span>
                  </div>

                  <div className="mb-4 p-4 bg-white rounded-md border border-red-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Employee Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700 bg-red-50 p-2 rounded border">
                          {assessment.rejectionReason ||
                            "Employee rejected the assessment scores"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm text-red-600">
                        <strong>Required Action:</strong> Review and revise the
                        assessment based on employee feedback
                      </p>
                      <p className="text-sm text-red-600">
                        Original Schedule:{" "}
                        {formatDate(
                          assessment.scheduledDate || assessment.requestedAt
                        )}
                      </p>
                      <p className="text-sm text-red-600">
                        Skills to reassess:{" "}
                        {assessment.detailedScores?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewHistory(assessment)}
                      className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View History
                    </button>
                    <button
                      onClick={() => handleWriteAssessment(assessment)}
                      className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1 font-medium"
                    >
                      <Edit className="h-4 w-4" />
                      Revise Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Assessments */}
          {newAssessments.length > 0 && (
            <div className="space-y-4">
              {rejectedAssessments.length > 0 && (
                <div className="flex items-center gap-2 pb-2 border-b border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <h4 className="text-base font-semibold text-yellow-700">
                    New Assessments ({newAssessments.length})
                  </h4>
                </div>
              )}

              {newAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{assessment.user?.name}</h4>
                        <p className="text-sm text-gray-500">
                          Assessment #{assessment.id}
                        </p>
                      </div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      ACTION REQUIRED
                    </span>
                  </div>

                  <div className="mb-4 p-3 bg-white rounded-md border">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Next Action:</strong>{" "}
                      {assessment.status === AssessmentStatus.INITIATED
                        ? "Assessment ready to start"
                        : "Write assessment for team member"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Scheduled:{" "}
                      {formatDate(
                        assessment.scheduledDate || assessment.requestedAt
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Skills to assess: {assessment.detailedScores?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className="font-medium">
                        {assessment.status.replace("_", " ")}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewHistory(assessment)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleWriteAssessment(assessment)}
                      className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      {assessment.status === AssessmentStatus.INITIATED
                        ? "Start Assessment"
                        : "Write Assessment"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingActionsTab;
