import {
  Users,
  Search,
  Clock,
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
}> = ({ userSummaries, searchTerm, setSearchTerm, statusFilter, setStatusFilter, getStatusColor, formatDate, onShowHistory }) => {
  // Filter user summaries based on search and status
  const filteredSummaries = userSummaries.filter(summary => {
    const matchesSearch = summary.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || summary.latestAssessment?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
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
        {filteredSummaries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No assessments found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredSummaries.map((summary) => (
            <div key={summary.user.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{summary.user?.name}</h4>
                    <p className="text-sm text-gray-500">
                      {summary.user?.role?.name} 
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(summary.latestAssessment?.status)}`}>
                    {summary.latestAssessment?.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => onShowHistory(summary.user.id, summary.user.name)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    History
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Latest Assessment:</span>
                  <span className="ml-2">{formatDate(summary.latestAssessment?.requestedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Current Cycle:</span>
                  <span className="ml-2">{summary.latestAssessment?.currentCycle}</span>
                </div>
                <div>
                  <span className="text-gray-500">Skills Assessed:</span>
                  <span className="ml-2">{summary.latestAssessment?.detailedScores?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Assessments:</span>
                  <span className="ml-2 font-medium">{summary.totalAssessments}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};