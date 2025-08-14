import React from "react";
import {
  FileText,
  Search,
  User,
  Calendar,
  Clock,
  Eye,
  Edit,
  AlertTriangle
} from "lucide-react";

import { AssessmentWithHistory, AssessmentStatus } from "../../../../types/assessmentTypes";

interface Props {
  assessments: AssessmentWithHistory[];
  isLoading: boolean;
  handleWriteAssessment: (assessment: AssessmentWithHistory) => void;
  handleViewHistory: (assessment: AssessmentWithHistory) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  getStatusIcon: (status: AssessmentStatus) => React.ReactNode;
  formatDate: (date: string | Date) => string;
  userRole?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onShowOverdueDetails?: (assessments: AssessmentWithHistory[]) => void;
}

const AllAssessmentsTab: React.FC<Props> = ({
  assessments,
  isLoading,
  handleWriteAssessment,
  handleViewHistory,
  getStatusColor,
  getStatusIcon,
  formatDate,
  userRole,
  searchTerm,
  setSearchTerm,
  onShowOverdueDetails
}) => {
  // Helper function to check if assessment is overdue
  const isOverdue = (assessment: AssessmentWithHistory) => {
    if (!assessment?.deadlineDate) return false;
    const deadline = new Date(assessment.deadlineDate);
    const now = new Date();
    return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
  };

  // Helper function to get assessment card styling based on deadline
  const getAssessmentCardStyle = (assessment: AssessmentWithHistory) => {
    if (isOverdue(assessment)) {
      return "bg-red-50 rounded-lg border border-red-300 p-4";
    }
    return "bg-gray-50 rounded-lg border border-gray-200 p-4";
  };

  // Helper function to get enhanced status color with overdue indication
  const getEnhancedStatusColor = (assessment: AssessmentWithHistory) => {
    if (isOverdue(assessment)) {
      return "bg-red-100 text-red-800 border border-red-300";
    }
    return getStatusColor(assessment?.status);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-lg text-gray-600">Loading assessments...</p>
      </div>
    );
  }

  const filteredAssessments = assessments.filter((a) =>
    a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get overdue assessments for the details modal
  const overdueAssessments = filteredAssessments.filter(assessment => 
    isOverdue(assessment)
  );

  return (
    <div className="space-y-4">
      {/* Overdue Alert Banner */}
      {overdueAssessments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800">
                  {overdueAssessments.length} Assessment{overdueAssessments.length !== 1 ? 's' : ''} Overdue
                </h4>
                <p className="text-sm text-red-600">
                  Team members have assessments past their deadline
                </p>
              </div>
            </div>
            {onShowOverdueDetails && (
              <button
                onClick={() => onShowOverdueDetails(overdueAssessments)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          All Team Assessments
        </h3>

        <div className="flex items-center gap-3">
          {overdueAssessments.length > 0 && onShowOverdueDetails && (
            <button
              onClick={() => onShowOverdueDetails(overdueAssessments)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              View Overdue Assessments ({overdueAssessments.length})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search members..."
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">No assessments found</p>
          <p className="text-sm text-gray-500">
            Assessments will appear here once they are initiated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => {
            const assessmentIsOverdue = isOverdue(assessment);
            
            return (
              <div key={assessment.id} className={getAssessmentCardStyle(assessment)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      assessmentIsOverdue 
                        ? 'bg-red-100' 
                        : 'bg-blue-100'
                    }`}>
                      {assessmentIsOverdue ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{assessment.user?.name}</h4>
                      <p className="text-sm text-gray-500">{assessment.cycle?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessmentIsOverdue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        OVERDUE
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnhancedStatusColor(assessment)}`}>
                      {getStatusIcon(assessment.status)}
                      <span className="ml-1">{assessment.status.replace("_", " ")}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created: {formatDate(assessment.requestedAt)}</span>
                  </div>
                  {assessment.deadlineDate && (
                    <div className={`flex items-center gap-2 text-sm ${
                      assessmentIsOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}>
                      <Clock className={`h-4 w-4 ${assessmentIsOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                      <span>
                        Deadline: {formatDate(assessment.deadlineDate)}
                        {assessmentIsOverdue && ' (OVERDUE)'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Cycle: {assessment.currentCycle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Skills: {assessment.detailedScores?.length || 0}</span>
                  </div>
                </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {assessment.status === AssessmentStatus.LEAD_WRITING && userRole === "lead" ? (
                    <span className="text-yellow-600 font-medium">⚠️ Action Required</span>
                  ) : (
                    <span>Current Status: {assessment.status.replace("_", " ")}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {assessment.status === "COMPLETED" ? (
                    <button
                    onClick={() => handleViewHistory(assessment)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View History
                  </button>
                  ):(
                    <button
                    onClick={() => handleViewHistory(assessment)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Write Assessment
                  </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllAssessmentsTab;
