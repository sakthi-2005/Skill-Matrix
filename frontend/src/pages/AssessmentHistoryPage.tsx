import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, FileText, User } from "lucide-react";
import { assessmentService } from "@/services/api";
import { AssessmentWithHistory } from "@/types/assessmentTypes";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AssessmentHistoryPage: React.FC = () => {
  const { userId, userName } = useParams<{ userId: string; userName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentHistory = async () => {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }

      try {
        // Check if current user has access to this user's assessment history
        const accessResponse = await assessmentService.checkUserAssessmentAccess(userId);
        
        if (!accessResponse.success || !accessResponse.data.hasAccess) {
          setError("You don't have permission to view this user's assessment history. You can only access assessment history of your direct team members.");
          setLoading(false);
          return;
        }

        // Fetch the user's assessment history
        const response = await assessmentService.getUserAssessmentHistory(userId);
        
        if (response.success && response.data) {
          setAssessments(response.data);
        } else {
          setError("Failed to load assessment history");
        }
      } catch (err: any) {
        console.error("Error fetching assessment history:", err);
        setError(err.message || "Failed to load assessment history");
        toast({
          title: "Error",
          description: "Failed to load assessment history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentHistory();
  }, [userId]);

  const handleBack = () => {
    // Navigate back to team assessment page
    navigate("/team-assessment");
  };

  const handleViewDetails = (assessmentId: number) => {
    // Navigate to the assessment details page
    navigate(`/assessment-details/${assessmentId}`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "LEAD_WRITING":
        return "bg-yellow-100 text-yellow-800";
      case "EMPLOYEE_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "HR_FINAL_REVIEW":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <h3 className="font-bold mb-2">Access Denied</h3>
            <p>{error}</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Team Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team Assessments
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-6 w-6 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">
                Assessment History: {decodeURIComponent(userName || "Unknown User")}
              </h1>
            </div>
            <p className="text-gray-600">Complete assessment history for this team member</p>
          </div>
        </div>

        {/* Assessment History List */}
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessment History</h3>
              <p className="text-gray-600">This user doesn't have any assessment history yet.</p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Assessment #{assessment.id} - Cycle {assessment.currentCycle}
                      </h3>
                      <p className="text-sm text-gray-500">{assessment.cycle?.title}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                    {assessment.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created: {formatDate(assessment.requestedAt)}</span>
                  </div>
                  
                  {assessment.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Completed: {formatDate(assessment.completedAt)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Skills: {assessment.detailedScores?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span>Requested: {formatDate(assessment.requestedAt)}</span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(assessment.id)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentHistoryPage;
