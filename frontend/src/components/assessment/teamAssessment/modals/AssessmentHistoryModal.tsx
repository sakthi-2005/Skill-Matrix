import React, { useState } from "react";
import { ArrowLeft, XCircle, ThumbsUp } from "lucide-react";
import { AssessmentWithHistory, DetailedScore } from "@/types/assessmentTypes";

interface Props {
  assessment: AssessmentWithHistory;
  onBack: () => void;
  formatDate: (date: string | Date) => string;
}

const AssessmentHistoryPage: React.FC<Props> = ({
  assessment,
  onBack,
  formatDate,
}) => {
  const history = assessment.history || [];
  let scoreUpdated: any[] = [];
  const [showSkills, setShowSkills] = useState<number | null>(null);

  return (
    <div className="bg-white w-full p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-xl font-semibold">Assessment History</h1>
            <p className="text-sm text-gray-600">
              {assessment.user?.name} – Assessment #{assessment.id}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
            <span className="ml-2 font-medium">{assessment.currentCycle}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2">
              {formatDate(assessment.requestedAt)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Deadline:</span>
            <span className="ml-2">
              {formatDate(assessment.deadlineDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-3">Comments</h3>
        <div className="grid grid-cols-1 gap-4 text-sm">
          {[
            { role: "Lead", keyword: "LEAD" },
            { role: "Employee", keyword: "EMPLOYEE" },
            { role: "HR", keyword: "HR" },
          ].map(({ role, keyword }) => {
            const commentEntry = assessment.history
              .slice()
              .reverse()
              .find(
                (entry) =>
                  entry.auditType?.toUpperCase().includes(keyword) &&
                  entry.comments
              );

            return (
              <div key={role}>
                <span className="text-gray-500">{role}'s Comment:</span>
                <p className="mt-1 text-gray-800 italic">
                  {commentEntry?.comments || "None"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Scores */}
      {assessment.detailedScores?.length > 0 && (
        <div className="mb-6">
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
                        onClick={() =>
                          setShowSkills((e) =>
                            e === audit.id ? null : audit.id
                          )
                        }
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
                      {showSkills !== audit.id ? (
                        <p className="ml-16 text-sm text-gray-600 mt-1 italic">
                          “Score Updated for {temp_count} Skills”
                        </p>
                      ) : (
                        <div className="space-y-3 w-[70%] ml-10 pl-10 mt-2">
                          {print_scoreUpdated.map((score) => (
                            <div
                              key={score.skillId}
                              className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                            >
                              <span className="font-medium">
                                Score updated for "{score.skillName}"
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
export default AssessmentHistoryPage;