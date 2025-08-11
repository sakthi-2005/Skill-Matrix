import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { AssessmentWithHistory, AssessmentStatus } from '@/types/assessmentTypes';
import { ArrowLeft, Clock, User, Calendar, AlertCircle, CheckCircle, XCircle, Eye, ThumbsUp, ThumbsDown, Edit3 } from 'lucide-react';
import { ReviewAssessmentModal } from '@/components/assessment/employeeAssessment/modals/reviewAssessmentModel';

const EmployeeAssessmentDetailsPage: React.FC = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentWithHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentDetails();
    }
  }, [assessmentId]);

  const loadAssessmentDetails = async () => {
    if (!assessmentId) return;
    
    setIsLoading(true);
    try {
      // First check if the user has access to this assessment
      const accessResponse = await assessmentService.checkAssessmentAccess(parseInt(assessmentId));
      if (!accessResponse.success) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this assessment",
          variant: "destructive",
        });
        navigate('/employee-assessment-review');
        return;
      }

      const response = await assessmentService.getAssessmentWithHistory(parseInt(assessmentId));
      if (response.success) {
        // Verify this assessment belongs to the current user
        if (response.data.userId !== user?.id?.toString()) {
          toast({
            title: "Access Denied", 
            description: "You can only view your own assessments",
            variant: "destructive",
          });
          navigate('/employee-assessment-review');
          return;
        }
        setAssessment(response.data);
      } else {
        throw new Error(response.message || 'Failed to load assessment');
      }
    } catch (error: any) {
      console.error('Error loading assessment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load assessment details",
        variant: "destructive",
      });
      navigate('/employee-assessment-review');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return "bg-blue-100 text-blue-800";
      case AssessmentStatus.LEAD_WRITING:
        return "bg-yellow-100 text-yellow-800";
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return "bg-purple-100 text-purple-800";
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return "bg-green-100 text-green-800";
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return "bg-red-100 text-red-800";
      case AssessmentStatus.HR_FINAL_REVIEW:
        return "bg-indigo-100 text-indigo-800";
      case AssessmentStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case AssessmentStatus.CANCELLED:
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return <Clock className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING:
        return <Edit3 className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return <Eye className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return <ThumbsUp className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return <ThumbsDown className="h-4 w-4" />;
      case AssessmentStatus.HR_FINAL_REVIEW:
        return <AlertCircle className="h-4 w-4" />;
      case AssessmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const handleStartReview = () => {
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (approved: boolean) => {
    if (!assessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.employeeReviewAssessment(
        assessment.id,
        {
          approved,
          comments: reviewComments,
          reviewerContext: 'employee'
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        await loadAssessmentDetails(); // Reload to get updated status
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h3>
        <p className="text-gray-600 mb-4">The assessment you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/employee-assessment-review')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Assessments
        </button>
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
              Assessment Details
            </h1>
            <p className="text-gray-600 mt-1">
              Assessment #{assessment.id} - Cycle {assessment.currentCycle}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(assessment.status)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
              {assessment.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Assessment Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Assessment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Employee</p>
              <p className="font-medium">{assessment.user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Requested</p>
              <p className="font-medium">{formatDate(assessment.requestedAt)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Deadline</p>
              <p className="font-medium">{formatDate(assessment.deadlineDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Skills Count</p>
              <p className="font-medium">{assessment.detailedScores?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {assessment.status === AssessmentStatus.EMPLOYEE_REVIEW && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This assessment is awaiting your review and approval.
              </p>
            </div>
            <button
              onClick={handleStartReview}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Review Assessment
            </button>
          </div>
        </div>
      )}

      {/* Skills Assessment */}
      {assessment.detailedScores && assessment.detailedScores.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Skill Assessments</h2>
          <div className="space-y-4">
            {assessment.detailedScores.map((score) => (
              <div key={score.skillId} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div>
                  <h3 className="font-medium text-gray-900">{score.Skill?.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {score.score !== null ? (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {score.score}/5
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">
                      Not assessed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <div className="space-y-4">
          {[
            { role: "Lead", keyword: "LEAD" },
            { role: "Employee", keyword: "EMPLOYEE" },
            { role: "HR", keyword: "HR" },
          ].map(({ role, keyword }) => {
            const commentEntry = assessment.history
              ?.slice()
              .reverse()
              .find(
                (entry) =>
                  entry.auditType?.toUpperCase().includes(keyword) &&
                  entry.comments
              );

            return (
              <div key={role} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{role}'s Comment</h3>
                <p className="text-gray-700 italic">
                  {commentEntry?.comments || "No comments provided"}
                </p>
                {commentEntry?.auditedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(commentEntry.auditedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Assessment Timeline</h2>
        <div className="space-y-4">
          {assessment.history?.map((audit, index) => {
            const isRejected = audit.auditType.toLowerCase().includes("rejected");
            const isApproved = audit.auditType.toLowerCase().includes("approved") ||
                              audit.auditType.toLowerCase().includes("completed");

            const circleColor = isApproved
              ? "bg-green-500"
              : isRejected
              ? "bg-red-500"
              : "bg-blue-500";

            const isLast = index === assessment.history.length - 1;

            return (
              <div key={index} className="relative flex items-start">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-300"></div>
                )}
                
                {/* Timeline dot */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${circleColor}`}>
                  {isApproved ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Clock className="w-4 h-4 text-white" />
                  )}
                </div>
                
                {/* Timeline content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {audit.auditType.replace(/_/g, ' ')}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(audit.auditedAt || audit.createdAt)}
                    </span>
                  </div>
                  {audit.comments && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      "{audit.comments}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewAssessmentModal
          assessment={assessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

export default EmployeeAssessmentDetailsPage;
