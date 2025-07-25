import {
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  AssessmentWithHistory,
  DetailedScore,
} from "@/types/assessmentTypes";

export const HRReviewModal: React.FC<{
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
            <h2 className="text-xl font-semibold">HR Final Review</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {assessment.user?.name} - Assessment #{assessment.id}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Employee:</span>
                <span className="ml-2 font-medium">{assessment.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">Employee Approved</span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2">{assessment.currentCycle}</span>
              </div>
              <div>
                <span className="text-gray-500">Skills:</span>
                <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores */}
          <div>
            <h3 className="font-medium mb-3">Lead Assessment Results</h3>
            <div className="space-y-3">
              {assessment.detailedScores?.map((score: DetailedScore) => (
                <div key={score.skillId} className="border border-gray-200 rounded-lg p-3">
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

          {/* HR Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HR Comments 
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this final review..."
              required
            />
          </div>

          {/* Decision Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Final Review Decision</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Approve:</strong> Assessment is complete and scores are finalized</li>
              <li>• <strong>Reject:</strong> Send back to lead for revision (increases cycle count)</li>
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
            <XCircle className="h-4 w-4" />
            Reject & Send Back
          </button>
          <button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <CheckCircle className="h-4 w-4" />
            Approve & Complete
          </button>
        </div>
      </div>
    </div>
  );
};