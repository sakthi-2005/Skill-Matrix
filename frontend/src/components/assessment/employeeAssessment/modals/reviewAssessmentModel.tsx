import {
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  AssessmentWithHistory,
  DetailedScore,
} from "@/types/assessmentTypes";


export const ReviewAssessmentModal: React.FC<{
  assessment: AssessmentWithHistory;
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: (approved: boolean) => void;
  onClose: () => void;
}> = ({ assessment, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Review Assessment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Assessment #{assessment.id} - Cycle {assessment.currentCycle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{new Date(assessment.requestedAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Current Cycle:</span>
                <span className="ml-2">{assessment.currentCycle}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores Review */}
          <div>
            <h3 className="font-medium mb-3">Lead's Assessment</h3>
            <div className="space-y-3">
              {assessment.detailedScores?.map((score: DetailedScore) => (
                <div key={score.skillId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{score.Skill?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {score.score}/5
                      </span>
                    </div>
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
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this assessment..."
              required
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Review Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review the skill ratings provided by your team lead</li>
              <li>• If you agree with the assessment, click "Approve"</li>
              <li>• If you disagree, click "Request Changes" with your feedback</li>
              <li>• Your decision will be sent to HR for final review</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(false)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Request Changes
          </button>
          <button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <ThumbsUp className="h-4 w-4" />
            Approve Assessment
          </button>
        </div>
      </div>
    </div>
  );
};