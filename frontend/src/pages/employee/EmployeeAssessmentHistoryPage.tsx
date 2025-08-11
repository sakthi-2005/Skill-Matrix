import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { AssessmentWithHistory, AssessmentStatus } from '@/types/assessmentTypes';
import { ArrowLeft, FileText, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';

const EmployeeAssessmentHistoryPage: React.FC = () => {
  const { userId, userName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && userName) {
      loadAssessmentHistory();
    }
  }, [userId, userName]);

  const loadAssessmentHistory = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Verify that the user is accessing their own history
      if (userId !== user?.id?.toString()) {
        toast({
          title: "Access Denied",
          description: "You can only view your own assessment history",
          variant: "destructive",
        });
        navigate('/employee-assessment-review');
        return;
      }

      const response = await assessmentService.getUserAssessmentHistory(userId);
      if (response.success) {
        setAssessmentHistory(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load assessment history');
      }
    } catch (error: any) {
      console.error('Error loading assessment history:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load assessment history",
        variant: "destructive",
      });
      navigate('/employee-assessment-review');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case AssessmentStatus.CANCELLED:
        return "bg-gray-100 text-gray-500";
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return "bg-blue-100 text-blue-800";
      case AssessmentStatus.HR_FINAL_REVIEW:
        return "bg-indigo-100 text-indigo-800";
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return "bg-purple-100 text-purple-800";
      case AssessmentStatus.LEAD_WRITING:
        return "bg-yellow-100 text-yellow-800";
      case AssessmentStatus.INITIATED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED:
      case AssessmentStatus.HR_FINAL_REVIEW:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return <Eye className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING:
      case AssessmentStatus.INITIATED:
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (assessmentId: number) => {
    navigate(`/employee-assessment-details/${assessmentId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/employee-assessment-review')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Assessments
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Assessment History
            </h1>
            <p className="text-gray-600 mt-1">
              Complete assessment history for {decodeURIComponent(userName || 'User')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {assessmentHistory.length} total assessments
            </span>
          </div>
        </div>
      </div>

      {/* Assessment History */}
      {assessmentHistory.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment History</h3>
          <p className="text-gray-600 mb-4">You don't have any assessment records yet.</p>
          <button
            onClick={() => navigate('/employee-assessment-review')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Current Assessments
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessmentHistory.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(assessment.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                      {assessment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assessment #{assessment.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Cycle {assessment.currentCycle}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewDetails(assessment.id)}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>

              {/* Assessment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Requested</p>
                    <p className="text-sm font-medium">{formatDate(assessment.requestedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-sm font-medium">{formatDate(assessment.deadlineDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Skills</p>
                    <p className="text-sm font-medium">{assessment.detailedScores?.length || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Score Changes</p>
                    <p className="text-sm font-medium text-blue-600">
                      {assessment.history?.filter((h) => h.auditType?.includes("SCORE")).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Completion Status */}
              {assessment.completedAt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Completed on {formatDate(assessment.completedAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Skills Preview */}
              {assessment.detailedScores && assessment.detailedScores.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Skill Assessments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assessment.detailedScores.slice(0, 6).map((score) => (
                      <div
                        key={score.skillId}
                        className="flex items-center justify-between text-sm bg-gray-50 rounded p-2"
                      >
                        <span className="text-gray-700 truncate">
                          {score.Skill?.name}
                        </span>
                        {score.score !== null ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {score.score}/5
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            N/A
                          </span>
                        )}
                      </div>
                    ))}
                    {assessment.detailedScores.length > 6 && (
                      <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded p-2">
                        +{assessment.detailedScores.length - 6} more skills
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Activity Summary */}
              {assessment.history && assessment.history.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {assessment.history.slice(-3).reverse().map((audit, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600">
                          {audit.auditType.replace(/_/g, ' ')} 
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {formatDate(audit.auditedAt || audit.createdAt)}
                        </span>
                        {audit.comments && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 italic truncate">
                              "{audit.comments.substring(0, 50)}{audit.comments.length > 50 ? '...' : ''}"
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                    {assessment.history.length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        View details to see all {assessment.history.length} activity entries
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeAssessmentHistoryPage;
