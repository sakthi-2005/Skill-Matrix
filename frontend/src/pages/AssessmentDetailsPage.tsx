import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { AssessmentWithHistory, AssessmentStatus, LeadSkillAssessment, DetailedScore } from '@/types/assessmentTypes';
import {
  ArrowLeft, Clock, User, Calendar, AlertCircle, CheckCircle,
  XCircle, Eye, ThumbsUp, ThumbsDown, Edit3
} from 'lucide-react';
import WriteAssessmentModal from '@/components/assessment/teamAssessment/WriteAssessmentModal';

const EmployeeAssessmentDetailsPage: React.FC = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentWithHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillScores, setSkillScores] = useState<{ [skillId: number]: number }>({});
  const [previousApprovedScores, setPreviousApprovedScores] = useState<{ [skillId: number]: number }>({});
  const [comments, setComments] = useState("");
  const [activeTab, setActiveTab] = useState<'skills' | 'comments' | 'timeline' | 'review-assessment' | 'write-assessment'>('comments');
  const [curLeadScore, setCurLeadScore] = useState<{ [skillId: number]: number }>({});
  const [userType, setUserType] = useState("")
  let scoreUpdated = [];

  useEffect(() => {
    if (!assessment) return;
    if (assessment.userId === user.id && assessment.nextApprover === parseInt(user.id)) {
      // alert("you are the correct employee to review the assessment");
      setUserType("employee");
    }
    else if (assessment.user?.leadId === user.id && assessment.nextApprover === parseInt(user.id)) {
      // alert("You are the required lead write the assessment");
      try{
        handleWriteAssessment(assessment);
        setUserType("lead");
      }
      catch(err){
        toast({
          title: "Error",
          description: "user has pervious pending assessment review it first",
          variant: "destructive",
        });
        setUserType("");
      }
    }
    else if (user.role?.name === "hr" && assessment.nextApprover === parseInt(user.id)) {
      // alert("take hr review")
      setUserType("hr");
    }

  }, [assessment]);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentDetails();
    }
  }, [assessmentId]);

  const loadAssessmentDetails = async () => {
    if (!assessmentId) return;
    setIsLoading(true);
    try {
      const accessResponse = await assessmentService.checkAssessmentAccess(parseInt(assessmentId));
      if (!accessResponse.success) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this assessment",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      const response = await assessmentService.getAssessmentWithHistory(parseInt(assessmentId));
      if (response.success) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED: return "bg-blue-100 text-blue-800";
      case AssessmentStatus.LEAD_WRITING: return "bg-yellow-100 text-yellow-800";
      case AssessmentStatus.EMPLOYEE_REVIEW: return "bg-purple-100 text-purple-800";
      case AssessmentStatus.EMPLOYEE_APPROVED: return "bg-green-100 text-green-800";
      case AssessmentStatus.EMPLOYEE_REJECTED: return "bg-red-100 text-red-800";
      case AssessmentStatus.HR_FINAL_REVIEW: return "bg-indigo-100 text-indigo-800";
      case AssessmentStatus.COMPLETED: return "bg-gray-100 text-gray-800";
      case AssessmentStatus.CANCELLED: return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED: return <Clock className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING: return <Edit3 className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW: return <Eye className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED: return <ThumbsUp className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REJECTED: return <ThumbsDown className="h-4 w-4" />;
      case AssessmentStatus.HR_FINAL_REVIEW: return <AlertCircle className="h-4 w-4" />;
      case AssessmentStatus.COMPLETED: return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.CANCELLED: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const checkForOlderPendingAssessments = async (userId: string, currentAssessment: AssessmentWithHistory) => {
    try {
      // Get all pending assessments for this user
      console.log('ready');
      const assessments = await assessmentService.getUserAssessmentHistory(userId);
      console.log(assessments);
      const userPendingAssessments = assessments.data.filter(assessment =>
        assessment.userId === userId &&
        !['COMPLETED', 'CANCELLED'].includes(assessment.status)
      );

      // Find assessments that are older than the current one (lower ID = older)
      const olderPendingAssessments = userPendingAssessments.filter(assessment =>
        assessment.id < currentAssessment.id
      );
      console.log(olderPendingAssessments)

      if (olderPendingAssessments.length > 0) {
        // Sort by ID to get the oldest first
        const oldestAssessment = olderPendingAssessments.sort((a, b) => a.id - b.id)[0];

        toast({
          title: "Complete Previous Assessments First",
          description: `Please complete Assessment #${oldestAssessment.id} before accessing Assessment #${currentAssessment.id}. Complete assessments in chronological order.`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking for older pending assessments:', error);
      toast({
        title: "Error",
        description: "Failed to check assessment order",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleWriteAssessment = async (assessment: AssessmentWithHistory) => {
    const userId = assessment.user.id;
    // Check if user has older pending assessments that should be completed first
    const canProceed = await checkForOlderPendingAssessments(userId, assessment);

    console.log("bool",canProceed)

    if (!canProceed) {
      setUserType("");
      setActiveTab("comments");
      return;
    }

    // setSelectedTab("writeAssessment");
    console.log("current detailedScores", assessment.detailedScores);

    const initialScores: { [skillId: number]: number } = {};
    const previousScores: { [skillId: number]: number } = {};

    // First, use current assessment scores if they exist (for assessments already in progress)
    assessment.detailedScores?.forEach((score) => {
      if (score.score != null) {
        initialScores[score.skillId] = score.score;
        console.log(`Using existing score for skill ${score.skillId}: ${score.score}`);
      }
    });

    // Then, fetch latest approved scores from previous completed assessments
    try {
      const latestRes = await assessmentService.getUserLatestApprovedScoresByUserId(userId);

      if (latestRes.success && latestRes.data) {

        latestRes.data.forEach((latest) => {
          const previousScore = latest.score || 0;
          previousScores[latest.skill_id] = previousScore;

          // Only use previous scores if current assessment doesn't have a score for this skill
          if (initialScores[latest.skill_id] === undefined) {
            initialScores[latest.skill_id] = previousScore;
          }
        });
      } else {
        console.log("No previous approved scores found or API call failed");
      }
    } catch (error) {
      console.error("Error fetching previous approved scores:", error);
      toast({
        title: "Warning",
        description: "Could not load previous assessment scores. Starting with blank scores.",
        variant: "default"
      });
    }

    // Ensure all skills in current assessment have a score (default to 0 if no previous score)
    assessment.detailedScores?.forEach((score) => {
      if (initialScores[score.skillId] === undefined) {
        initialScores[score.skillId] = 0;
        console.log(`No previous score found for skill ${score.skillId}, defaulting to 0`);
      }
    });

    setSkillScores(initialScores);
    setPreviousApprovedScores(previousScores);
    setComments("");
  };
  console.log("Previous Score in Assessment Details page:", previousApprovedScores)

  // submit assessment
  const handleSubmitAssessment = async () => {

    if (!assessment) return;

    const unscoredSkills = assessment.detailedScores.filter(
      (score) => !(skillScores[score.skillId] && skillScores[score.skillId] > 0)
    );

    if (unscoredSkills.length > 0) {
      toast({
        title: "Incomplete Scores",
        description: "Please provide scores for all skills before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const skillAssessments: LeadSkillAssessment[] = assessment.detailedScores.map((score: DetailedScore) => ({
        skillId: score.skillId,
        leadScore: skillScores[score.skillId] || 0,
      }));

      const payload = {
        assessmentId: assessment.id,
        skills: skillAssessments,
        comments
      };

      console.log("Submitting payload:", payload);

      const response = await assessmentService.writeLeadAssessment(
        assessment.id,
        skillAssessments,
        comments
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Assessment submitted successfully. You can now access newer assessments.",
        });

        await loadAssessmentDetails();
        setActiveTab("comments");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const isHaveAcess = (assessment: AssessmentWithHistory) =>
    assessment.userId === user.id || assessment.user?.leadId === user.id || user.role?.name === 'hr';

  const handleStartReview = (assessment: AssessmentWithHistory) => {
    if (assessment.userId === user.id || user.role?.name === 'hr') {
      setActiveTab('review-assessment');
      console.log("activeTab", activeTab)
    } else {
      handleWriteAssessment(assessment);
    }
  };

  const handleSubmitReview = async (approved: boolean) => {
    if (!assessment) return;
    setIsSubmitting(true);
    try {
      const response = await assessmentService.employeeReviewAssessment(
        assessment.id, { approved, comments: reviewComments, reviewerContext: 'employee' }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        await loadAssessmentDetails();
        setActiveTab("comments");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRReview = async (approved: boolean) => {
    if (!assessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrFinalReview(
        assessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setUserType("");
        loadAssessmentDetails();
        setActiveTab("comments");
      }
    } catch (error) {
      console.error("Error submitting HR review:", error);
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
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Assessments
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
            <p className="text-gray-600 mt-1">{assessment.cycle?.title}</p>
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

      {isHaveAcess(assessment) && assessment.nextApprover === parseInt(user?.id) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {`This assessment is awaiting your ${(assessment.userId === assessment.user?.id || user.role.name === 'hr') ? "review and approval." : 'Assess.'}`}
              </p>
            </div>
            <button
              onClick={() => handleStartReview(assessment)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {(assessment.userId === assessment.user?.id || user.role.name === 'hr')
                ? "Review Assessment"
                : "Write Assessment"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('comments')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'skills' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Skill Assessments
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Assessment Timeline
          </button>
          {(userType === "employee" || userType === "hr") && (
            <button
              onClick={() => setActiveTab('review-assessment')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'review-assessment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Review Assessment
            </button>
          )}
          {userType === "lead" && (
            <button
              onClick={() => setActiveTab('write-assessment')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'write-assessment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >Write Assessment</button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'skills' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Skill Assessments</h2>
          {assessment.detailedScores && assessment.detailedScores.length > 0 ? (
            <div className="space-y-4">
              {assessment.detailedScores.map((score) => (
                <div key={score.skillId} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div><h3 className="font-medium text-gray-900">{score.Skill?.name}</h3></div>
                  <div>
                    {score.score !== null ? (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{score.score}/5</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">Not assessed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No skill assessments available.</p>}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Comments</h2>
          <div className="space-y-4">
            {[
              { role: "Lead", keyword: "LEAD" },
              { role: "Employee", keyword: "EMPLOYEE" },
              { role: "HR", keyword: "HR" },
            ].map(({ role, keyword }) => {
              const commentEntry = assessment.history
                ?.slice().reverse()
                .find((entry) => entry.auditType?.toUpperCase().includes(keyword) && entry.comments);
              return (
                <div key={role} className="border border-gray-100 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{role}'s Comment</h3>
                  <p className="text-gray-700 italic">{commentEntry?.comments || "No comments provided"}</p>
                  {commentEntry?.auditedAt && (
                    <p className="text-xs text-gray-500 mt-2">{formatDate(commentEntry.auditedAt)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium mb-3">Assessment History</h3>
          <div>
            {assessment.history?.map((audit, index) => {
              const isRejected = audit.auditType.toLowerCase().includes("rejected");
              const isApprovedStep =
                audit.auditType.toLowerCase().includes("approved") ||
                audit.auditType.toLowerCase().includes("completed");
    
              const circleColor = isApprovedStep
                ? "bg-green-500"
                : isRejected
                ? "bg-red-500"
                : "bg-blue-500";
    
              const rejectedCount = assessment.history
                .slice(0, index)
                .filter((h) =>
                  h.auditType.toLowerCase().includes("rejected")
                ).length;
    
              const indent = `ml-${rejectedCount * 8}`;
              const isLast = index === assessment.history.length - 1;
    
              if (audit.auditType.toLowerCase().includes("score")) {
                scoreUpdated.push(audit);
                return null;
              }
    
              return (
                <React.Fragment key={index}>
                  <div className={`relative py-4 ${indent}`}>
                    {!isRejected && !isLast && (
                      <div className="absolute left-11 top-[28px] bottom-[-16px] w-px bg-gray-300"></div>
                    )}
                    <span
                      className={`absolute left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center ${circleColor}`}
                    >
                      {isRejected ? (
                        <XCircle className="h-3 w-3 text-white" />
                      ) : (
                        <ThumbsUp className="h-3 w-3 text-white" />
                      )}
                    </span>
                    <div className="ml-16 flex flex-col md:flex-row md:justify-between md:items-center">
                      <span className="font-semibold text-gray-800">
                        {audit.auditType.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-500 mt-1 md:mt-0">
                        {formatDate(audit.auditedAt || audit.createdAt)}
                      </span>
                    </div>
                    {audit.comments && (
                      <p className="ml-16 text-sm text-gray-600 mt-1 italic">
                        “{audit.comments}”
                      </p>
                    )}
                  </div>
    
                  {/* Score Updated Section */}
                  {(() => {
                    if (scoreUpdated.length !== 0) {
                      let temp_count = scoreUpdated.length;
                      let print_scoreUpdated = scoreUpdated;
                      scoreUpdated = [];
                      return (
                        <div className={`relative py-4 ${indent}`}>
                          {!isRejected && !isLast && (
                            <div className="absolute left-11 top-[28px] bottom-[-16px] w-px bg-gray-300"></div>
                          )}
                          <span
                            className={`absolute left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center ${circleColor}`}
                          >
                            ✓
                          </span>
                          <div className="ml-16 flex flex-col md:flex-row md:justify-between md:items-center">
                            <span className="font-semibold text-gray-800">
                              SCORE UPDATED
                            </span>
                            <span className="text-sm text-gray-500 mt-1 md:mt-0">
                              {formatDate(
                                print_scoreUpdated[0]?.auditedAt ||
                                  print_scoreUpdated[0]?.createdAt
                              )}
                            </span>
                          </div>
                            <p className="ml-16 text-sm text-gray-600 mt-1 italic">
                              “Score Updated for {temp_count} Skills”
                            </p>
                        </div>
                      );
                    }
                  })()}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'review-assessment' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">

          <h2 className="text-xl font-semibold">Review Assessment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assessment #{assessment.id} - Cycle {assessment.currentCycle}
          </p>

          <div className="p-6 space-y-6">
            {/* Assessment Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Assessment Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">
                    {new Date(assessment.requestedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Current Cycle:</span>
                  <span className="ml-2">{assessment.currentCycle}</span>
                </div>
              </div>
            </div>

            {/* Skill Scores Review */}
            <div>
              <h3 className="font-medium mb-3">
                {user.role?.name === "lead" ? "Head Lead" : "Team Lead"}'s Assessment
              </h3>
              <div className="space-y-3">
                {assessment.detailedScores?.map((score) => (
                  <div
                    key={score.skillId}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{score.Skill?.name}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {score.score}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any comments about this assessment..."
                required
              />
            </div>

            {/* Instructions */}
            { userType === "employee" ?
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Review Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Review the skill ratings provided by your team lead</li>
                <li>• If you agree with the assessment, click "Approve"</li>
                <li>• If you disagree, click "Request Changes" with your feedback</li>
                <li>• Your decision will be sent to HR for final review</li>
              </ul>
            </div>
            :
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Final Review Decision</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Approve:</strong> Assessment is complete and scores are finalized</li>
                <li>• <strong>Reject:</strong> Send back to lead for revision (increases cycle count)</li>
              </ul>
            </div>
            }
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">

            <button
              onClick={() => { userType === "employee" ? handleSubmitReview(false) : handleHRReview(false) }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {userType === "employee" ? "Request Changes" 
              : <>
                <XCircle className="h-4 w-4" />
                Reject & Send Back
              </>}
            </button>
            <button
              onClick={() => { userType === "employee" ? handleSubmitReview(true) : handleHRReview(true) }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {userType === "employee" ? "Approve Assessment" :             
              (<>
                <CheckCircle className="h-4 w-4" />
                  Approve & Complete
              </>)}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'write-assessment' && (
        <WriteAssessmentModal
          assessment={assessment}
          skills={[]}
          skillScores={skillScores}
          setSkillScores={setSkillScores}
          previousApprovedScores={previousApprovedScores}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitAssessment}
          data={curLeadScore}
          onClose={() => setActiveTab("comments")}
        />
      )}

    </div>
  );
};

export default EmployeeAssessmentDetailsPage;
