import React from "react";
import { X, Check } from "lucide-react";
import { AssessmentWithHistory, DetailedScore } from "@/types/assessmentTypes";
import { motion } from "framer-motion";

interface Props {
  assessment: AssessmentWithHistory;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}

const AssessmentHistoryModal: React.FC<Props> = ({
  assessment,
  onClose,
  formatDate,
}) => {
  const history = assessment.history || [];
  let rejectionCount = 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold">
              Assessment History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {assessment.user?.name} - Assessment #{assessment.id}
          </p>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Assessment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">
                  {assessment.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2 font-medium">
                  {assessment.currentCycle}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">
                  {formatDate(assessment.requestedAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Scheduled:</span>
                <span className="ml-2">
                  {formatDate(assessment.scheduledDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Skill Scores */}
          {assessment.detailedScores?.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Skill Scores</h3>
              <div className="space-y-3">
                {assessment.detailedScores.map((score: DetailedScore) => (
                  <div
                    key={score.skillId}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                  >
                    <span className="font-medium">{score.Skill?.name}</span>
                    <div className="flex items-center gap-2">
                      {score.score !== null ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          Lead: {score.score}/5
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-sm">
                          Not assessed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Timeline */}
          <div>
            <h3 className="font-medium mb-3">History</h3>

            <div className="relative pl-12 md:pl-14">
              {history.map((audit, index) => {
                const isRejected = audit.auditType.toLowerCase().includes("rejected");
                const isApproved =
                  audit.auditType.toLowerCase().includes("approved") ||
                  audit.auditType.toLowerCase().includes("completed");

                const circleColor = isApproved
                  ? "bg-green-500"
                  : isRejected
                  ? "bg-red-500"
                  : "bg-blue-500";

                const icon =
                  isApproved || !isRejected ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-white" />
                  );

                const indent = rejectionCount * 18;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`relative py-4 transition transform hover:scale-[1.02] hover:bg-gray-50 rounded-lg`}
                    style={{ marginLeft: `${indent}px`, paddingLeft: "48px" }}
                  >
                    {/* Gradient line */}
                    {index !== history.length - 1 && !isRejected && (
                      <div
                        className="absolute top-6 bottom-0 w-px"
                        style={{
                          marginLeft: `${indent - 24}px`,
                          top: "24px",
                          height: "calc(100% - 2px)",
                          background: "linear-gradient(to bottom, #3b82f6, #9333ea)"
                        }}
                      ></div>
                    )}

                    {/* Circle with tooltip */}
                    <span
                      className={`absolute z-10 rounded-full h-6 w-6 flex items-center justify-center ${circleColor} group`}
                      style={{ top: "16px", left: `${13 + indent}px` }}
                    >
                      {icon}
                      <span className="absolute hidden group-hover:block -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {audit.auditType.replace(/_/g, " ")}
                      </span>
                    </span>

                    {/* Content */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between ml-5">
                      <span className="font-semibold text-sm md:text-base capitalize text-gray-800">
                        {audit.auditType.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 md:mt-0">
                        {formatDate(audit.auditedAt || audit.createdAt)}
                      </span>
                    </div>

                    {audit.comments && (
                      <p className="text-sm text-gray-600 mt-1 ml-4 border-l-2 border-gray-200 pl-2 italic">
                        “{audit.comments}”
                      </p>
                    )}

                    {/* Increment rejection count silently */}
                    {isRejected && (rejectionCount++, null)}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentHistoryModal;
