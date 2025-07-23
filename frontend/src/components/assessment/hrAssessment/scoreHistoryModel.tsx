import {
  XCircle,
  BarChart3,
  TrendingUp
} from "lucide-react";

export const ScoreHistoryModal: React.FC<{
  scoreHistory: any[];
  isOpen: boolean;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}> = ({ scoreHistory, isOpen, onClose, formatDate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Score Change History</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Detailed history of all score changes for this assessment
          </p>
        </div>

        <div className="p-6">
          {scoreHistory.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No score changes found</p>
              <p className="text-sm text-gray-500">This assessment has no recorded score modifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scoreHistory.map((change, index) => (
                <div key={change.id || index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">{change.skillName}</h4>
                          <p className="text-sm text-gray-600">
                            Changed by {change.changedBy} • Cycle {change.cycleNumber}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Previous:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            change.previousScore === null 
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {change.previousScore === null ? 'Not scored' : `${change.previousScore}/5`}
                          </span>
                        </div>
                        
                        <div className="text-gray-400">→</div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">New:</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {change.newScore}/5
                          </span>
                        </div>
                      </div>

                      {change.fullComment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          <span className="font-medium">Details: </span>
                          {change.fullComment}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(change.changedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};