import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { assessmentService } from "@/services/api";
import { AssessmentWithHistory } from "@/types/assessmentTypes";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AssessmentHistoryPage from "@/components/assessment/teamAssessment/modals/AssessmentHistoryModal";

const AssessmentDetailsPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!assessmentId) {
        setError("Assessment ID is required");
        setLoading(false);
        return;
      }

      try {
        // First, check if user has access to this assessment
        const accessResponse = await assessmentService.checkAssessmentAccess(parseInt(assessmentId));
        
        if (!accessResponse.success || !accessResponse.data.hasAccess) {
          setError("You don't have permission to view this assessment. You can only access assessments of your direct team members.");
          setLoading(false);
          return;
        }

        // Fetch the assessment details
        const response = await assessmentService.getAssessmentWithHistory(parseInt(assessmentId));
        
        if (response.success && response.data) {
          setAssessment(response.data);
        } else {
          setError("Assessment not found");
        }
      } catch (err: any) {
        console.error("Error fetching assessment:", err);
        setError(err.message || "Failed to load assessment");
        toast({
          title: "Error",
          description: "Failed to load assessment details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  const handleBack = () => {
    // Navigate back to team assessment page
    navigate("/team-assessment");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment details...</p>
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

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Not Found</h3>
          <p className="text-gray-600 mb-4">The requested assessment could not be found.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team Assessments
          </button>
        </div>

        {/* Assessment Details Component */}
        <div className="bg-white rounded-lg shadow-sm">
          <AssessmentHistoryPage
            assessment={assessment}
            onBack={handleBack}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetailsPage;
