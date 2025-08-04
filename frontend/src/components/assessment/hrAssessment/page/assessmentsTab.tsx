import {
  Users,
  Search,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { AssessmentStatus} from "@/types/assessmentTypes";


export const AssessmentsTab: React.FC<{
  userSummaries: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  formatDate: (date: string | Date) => string;
  onShowHistory: (userId: string, userName: string) => void;
  onShowOverdueDetails?: (assessments: any[]) => void;
  allAssessments?: any[]; // Add this to show all assessments instead of just summaries
}> = ({ userSummaries, searchTerm, setSearchTerm, statusFilter, setStatusFilter, getStatusColor, formatDate, onShowHistory, onShowOverdueDetails, allAssessments }) => {
  
  // Helper function to check if assessment is overdue
  const isOverdue = (assessment: any) => {
    if (!assessment?.deadlineDate) return false;
    const deadline = new Date(assessment.deadlineDate);
    const now = new Date();
    return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
  };

  // Helper function to get assessment card styling based on deadline
  const getAssessmentCardStyle = (assessment: any) => {
    if (isOverdue(assessment)) {
      return "border border-red-300 rounded-lg p-4 bg-red-50";
    }
    return "border border-gray-200 rounded-lg p-4";
  };

  // Helper function to get enhanced status color with overdue indication
  const getEnhancedStatusColor = (assessment: any) => {
    if (isOverdue(assessment)) {
      return "bg-red-100 text-red-800 border border-red-300";
    }
    return getStatusColor(assessment?.status);
  };

  // Use all assessments if provided, otherwise fall back to user summaries
  const assessmentsToShow = allAssessments || userSummaries.map(summary => summary.latestAssessment).filter(Boolean);
  
  // Filter assessments based on search and status, prioritizing pending assessments
  const filteredAssessments = assessmentsToShow.filter(assessment => {
    const matchesSearch = assessment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || assessment?.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by pending status first (non-completed assessments first)
    const aIsPending = a?.status !== 'COMPLETED' && a?.status !== 'CANCELLED';
    const bIsPending = b?.status !== 'COMPLETED' && b?.status !== 'CANCELLED';
    
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    
    // Then sort by overdue status
    const aIsOverdue = isOverdue(a);
    const bIsOverdue = isOverdue(b);
    
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    
    // Finally sort by assessment creation date (most recent first)
    const aDate = new Date(a?.requestedAt || 0);
    const bDate = new Date(b?.requestedAt || 0);
    return bDate.getTime() - aDate.getTime();
  });

  // Get overdue assessments for the details modal
  const overdueAssessments = assessmentsToShow.filter(assessment => 
    isOverdue(assessment)
  );

  // Get pending assessments (non-completed, non-cancelled)
  const pendingAssessments = filteredAssessments.filter(assessment => 
    assessment?.status !== 'COMPLETED' && 
    assessment?.status !== 'CANCELLED'
  );

  return (
    <div className="space-y-4">
      {/* Overdue Alert Banner */}
      {overdueAssessments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {overdueAssessments.length} Assessment{overdueAssessments.length > 1 ? 's' : ''} Overdue
                </h3>
                <p className="text-sm text-red-600">
                  These assessments have passed their deadline and require immediate attention.
                </p>
              </div>
            </div>
            {onShowOverdueDetails && (
              <button
                onClick={() => onShowOverdueDetails(overdueAssessments)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="INITIATED">Initiated</option>
          <option value="LEAD_WRITING">Lead Writing</option>
          <option value="EMPLOYEE_REVIEW">Employee Review</option>
          <option value="EMPLOYEE_APPROVED">Employee Approved</option>
          <option value="HR_FINAL_REVIEW">HR Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* User Summaries List - One row per user with latest assessment */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No assessments found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredAssessments.map((assessment) => (
            <div key={assessment.user?.id || assessment.id} className={getAssessmentCardStyle(assessment)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isOverdue(assessment) ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {isOverdue(assessment) ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{assessment.user?.name}</h4>
                      {isOverdue(assessment) && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {assessment.user?.role?.name} 
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnhancedStatusColor(assessment)}`}>
                    {assessment?.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => onShowHistory(assessment.user?.id, assessment.user?.name)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    History
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Assessment Date:</span>
                  <span className="ml-2">{formatDate(assessment?.requestedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deadline:</span>
                  <span className={`ml-2 ${isOverdue(assessment) ? 'text-red-600 font-medium' : ''}`}>
                    {assessment?.deadlineDate ? formatDate(assessment.deadlineDate) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Current Cycle:</span>
                  <span className="ml-2">{assessment?.currentCycle}</span>
                </div>
                <div>
                  <span className="text-gray-500">Skills Assessed:</span>
                  <span className="ml-2">{assessment?.detailedScores?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Assessment ID:</span>
                  <span className="ml-2 font-medium">{assessment?.id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};