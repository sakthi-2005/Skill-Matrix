import {
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  XCircle,
} from "lucide-react";
import {
  AssessmentWithHistory,
  AssessmentStatus,
} from "@/types/assessmentTypes";


export const PendingReviewsTab: React.FC<{
  pendingReviews: AssessmentWithHistory[];
  onReview: (assessment: AssessmentWithHistory) => void;
  onShowHistory: (userId: string, userName: string) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  formatDate: (date: string | Date) => string;
  selectedAssessments: Set<number>;
  selectAll: boolean;
  onSelectAll: () => void;
  onSelectAssessment: (assessmentId: number) => void;
  onBulkAction: (action: 'approve' | 'reject') => void;
}> = ({ 
  pendingReviews, 
  onReview, 
  onShowHistory, 
  getStatusColor, 
  formatDate,
  selectedAssessments,
  selectAll,
  onSelectAll,
  onSelectAssessment,
  onBulkAction
}) => {
  
  // Debug: Log props to verify they're being passed
  console.log('PendingReviewsTab props:', {
    pendingReviewsCount: pendingReviews.length,
    selectedAssessmentsSize: selectedAssessments.size,
    selectAll,
    hasOnSelectAll: !!onSelectAll,
    hasOnBulkAction: !!onBulkAction
  });
  
  const getAssessmentCardColor = (assessment: AssessmentWithHistory) => {
    // Check if there was a recent employee rejection
    const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
    const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
    
    if (hasHRRejection) {
      return 'bg-red-50 border-red-200'; // HR rejection - red
    } else if (hasEmployeeRejection) {
      return 'bg-orange-50 border-orange-200'; // Employee rejection - orange
    } else {
      return 'bg-yellow-50 border-yellow-200'; // Normal pending - yellow
    }
  };

  const getStatusBadgeColor = (assessment: AssessmentWithHistory) => {
    const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
    const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
    
    if (hasHRRejection) {
      return 'bg-red-100 text-red-800';
    } else if (hasEmployeeRejection) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };
  if (pendingReviews.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">No pending HR reviews</p>
        <p className="text-sm text-gray-500">All assessments are up to date</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold">
          Pending HR Reviews ({pendingReviews.length})
        </h3>
        {/* Show bulk selection controls when there are pending reviews */}
        {(pendingReviews.length > 0 || true) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={onSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({selectedAssessments.size} selected)
              </label>
            </div>
            {selectedAssessments.size > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onBulkAction('approve')}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 whitespace-nowrap shadow-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept All ({selectedAssessments.size})
                </button>
                <button
                  onClick={() => onBulkAction('reject')}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1 whitespace-nowrap shadow-sm"
                >
                  <XCircle className="h-4 w-4" />
                  Reject All ({selectedAssessments.size})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {pendingReviews.map((assessment) => {
          const cardColor = getAssessmentCardColor(assessment);
          const badgeColor = getStatusBadgeColor(assessment);
          const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
          const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
          
          return (
            <div key={assessment.id} className={`${cardColor} border rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAssessments.has(assessment.id)}
                    onChange={() => onSelectAssessment(assessment.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    hasHRRejection ? 'bg-red-100' : hasEmployeeRejection ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <AlertCircle className={`h-5 w-5 ${
                      hasHRRejection ? 'text-red-600' : hasEmployeeRejection ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{assessment.user?.name}</h4>
                    <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
                    {(hasEmployeeRejection || hasHRRejection) && (
                      <p className="text-xs text-red-600 font-medium">
                        {hasHRRejection ? 'Previous HR Rejection' : 'Previous Employee Rejection'}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`${badgeColor} text-xs font-medium px-2 py-1 rounded-full`}>
                  {hasHRRejection ? 'HR REJECTED' : hasEmployeeRejection ? 'EMPLOYEE REJECTED' : 'EMPLOYEE APPROVED'}
                </span>
              </div>

              <div className="mb-4 p-3 bg-white rounded-md border">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>
                    {hasHRRejection ? 'HR previously rejected - needs revision' : 
                     hasEmployeeRejection ? 'Employee previously rejected - revised assessment' : 
                     'Employee has approved the assessment'}
                  </strong>
                </p>
                <p className="text-sm text-gray-600">
                  Skills assessed: {assessment.detailedScores?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                  Cycle: {assessment.currentCycle}
                </p>
                {assessment.rejectionReason && (
                  <p className="text-sm text-red-600 mt-2">
                    <strong>Last rejection reason:</strong> {assessment.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onShowHistory(assessment.userId, assessment.user?.name || 'Unknown User')}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  History
                </button>
                <button
                  onClick={() => onReview(assessment)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Review Assessment
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};