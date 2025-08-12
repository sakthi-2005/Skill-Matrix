import React from "react";
import { XCircle, AlertTriangle, Users, Clock, Calendar } from "lucide-react";

interface OverdueDetailsModalProps {
  overdueAssessments: any[];
  formatDate: (date: string | Date) => string;
  onClose: () => void;
}

export const OverdueDetailsModal: React.FC<OverdueDetailsModalProps> = ({
  overdueAssessments,
  formatDate,
  onClose
}) => {
  const getDaysOverdue = (deadlineDate: string) => {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diffTime = now.getTime() - deadline.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverdueSeverity = (daysOverdue: number) => {
    if (daysOverdue <= 3) return { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    if (daysOverdue <= 7) return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    return { color: "text-red-800", bg: "bg-red-100", border: "border-red-300" };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-800">
                Overdue Assessments ({overdueAssessments.length})
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            These assessments have passed their deadline and require immediate attention from the assigned users.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {overdueAssessments.map((summary) => {
              const daysOverdue = getDaysOverdue(summary.latestAssessment.deadlineDate);
              const severity = getOverdueSeverity(daysOverdue);
              
              return (
                <div key={summary.user.id} className={`border rounded-lg p-4 ${severity.bg} ${severity.border}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${severity.bg}`}>
                        <Users className={`h-6 w-6 ${severity.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{summary.user.name}</h3>
                        <p className="text-sm text-gray-600">{summary.user.role?.name}</p>
                        <p className="text-sm text-gray-600">{summary.user.team?.name || 'No Team'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severity.color} ${severity.bg} border ${severity.border}`}>
                        <Clock className="h-4 w-4 mr-1" />
                        {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Assessment ID:</span>
                      <span className="ml-2 font-medium">#{summary.latestAssessment.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {summary.latestAssessment.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <span className={`ml-2 font-medium ${severity.color}`}>
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(summary.latestAssessment.deadlineDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Cycle:</span>
                      <span className="ml-2">{summary.latestAssessment.currentCycle}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Skills to Assess:</span>
                    <span className="ml-2 font-medium">
                      {summary.latestAssessment.detailedScores?.length || 0} skills
                    </span>
                  </div>

                  {summary.latestAssessment.comments && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-500">Comments:</span>
                      <p className="text-sm text-gray-700 mt-1">{summary.latestAssessment.comments}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{overdueAssessments.length}</strong> assessment{overdueAssessments.length > 1 ? 's' : ''} requiring immediate attention
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};