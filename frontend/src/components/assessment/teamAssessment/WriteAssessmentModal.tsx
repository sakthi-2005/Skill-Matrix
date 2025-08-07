import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AssessmentWithHistory, DetailedScore } from "../../../types/assessmentTypes";

interface Skill {
  id: number;
  name: string;
  low?: string;
  medium?: string;
  average?: string;
  high?: string;
  mastery?: string;
}

interface Props {
  assessment: AssessmentWithHistory;
  skills: Skill[];
  skillScores: { [skillId: number]: number };
  setSkillScores: (scores: { [skillId: number]: number }) => void;
  previousApprovedScores: { [skillId: number]: number };
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  data: { [skillId: number]: number };
  onClose: () => void;
}

const WriteAssessmentPanel: React.FC<Props> = ({
  assessment,
  skills,
  skillScores,
  setSkillScores,
  previousApprovedScores,
  comments,
  setComments,
  isSubmitting,
  onSubmit,
  data,
  onClose,
}) => {
  const [openSkillId, setOpenSkillId] = useState<number | null>(null);

  const handleScoreChange = (skillId: number, newScore: number, prevScore: number) => {
    if (previousApprovedScores[skillId] && newScore < previousApprovedScores[skillId]) return;
    setSkillScores({ ...skillScores, [skillId]: newScore });
  };

  const toggleTable = (skillId: number) => {
    setOpenSkillId((prev) => (prev === skillId ? null : skillId));
  };

  return (
    <div className="bg-white w-full p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-semibold">Write Assessment</h2>
      </div>
      <p className="text-sm text-gray-600">
        Assessment for {assessment.user?.name} - #{assessment.id}
      </p>

      <div>
        <h3 className="text-lg font-medium mb-4">Rate Skills (1-5 scale)</h3>
        <div className="space-y-4">
          {assessment.detailedScores?.map((score: DetailedScore) => {
            const skill = skills.find((s) => s.id === score.skillId);
            const currentScore = skillScores[score.skillId] || 0;
            const previousScore = previousApprovedScores[score.skillId] || 0;
            const minAllowed = previousScore;

            const levelDescriptions = [
              score.Skill?.basic || "Beginner",
              score.Skill?.low || "Intermediate",
              score.Skill?.medium || "Advanced",
              score.Skill?.high || "Expert",
              score.Skill?.expert || "Master",
            ];

            return (
              <div key={score.skillId} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-[1fr_5fr_auto] items-center gap-4"
                  onClick={() => toggleTable(score.skillId)}
                >
                  <div
                    className="text-lg font-medium cursor-pointer"
                  >
                    {skill?.name || score.Skill?.name}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const isLocked = rating < minAllowed && minAllowed > 0;
                      const isApproved = rating <= previousScore;

                      return (
                        <button
                          key={rating}
                          onClick={() => {
                            if (!isLocked) handleScoreChange(score.skillId, rating, currentScore);
                          }}
                          className={`p-0 ${isLocked ? "cursor-not-allowed" : ""}`}
                          title={
                            isLocked
                              ? `Cannot reduce below approved score (${minAllowed})`
                              : `Rate ${rating}`
                          }
                          disabled={isLocked}
                        >
                          <svg
                            className={`w-6 h-6 transition-colors duration-200 ${
                              isApproved
                                ? "text-yellow-400"
                                : rating <= currentScore
                                ? "text-yellow-400"
                                : "text-gray-300"
                            } ${isLocked ? "opacity-100 cursor-not-allowed" : "cursor-pointer"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => toggleTable(score.skillId)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {openSkillId === score.skillId ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Level Table */}
                <AnimatePresence>
                  {openSkillId === score.skillId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 border rounded-lg overflow-hidden"
                    >
                      <table className="w-full text-sm shadow-inner table-fixed">
                        <thead>
                          <tr>
                            {["Beginner", "Intermediate", "Advanced", "Expert", "Master"].map(
                              (level, idx) => (
                                <th
                                  key={level}
                                  className="w-1/5 text-center px-2 py-2 font-medium border-r bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700"
                                  title={`Level ${idx + 1}`}
                                >
                                  {level}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {levelDescriptions.map((desc, idx) => {
                              const rating = idx + 1;
                              const isLocked = rating < minAllowed && minAllowed > 0;
                              const isSelected = currentScore === rating;
                              const isApproved = rating <= previousScore;

                              return (
                                <motion.td
                                  key={idx}
                                  onClick={() => {
                                    if (!isLocked)
                                      handleScoreChange(score.skillId, rating, currentScore);
                                  }}
                                  whileTap={!isLocked ? { scale: 0.95 } : undefined}
                                  whileHover={!isLocked ? { scale: 1.05 } : undefined}
                                  className={`
                                    w-1/5 px-2 py-3 text-xs text-center border-r transition-all duration-200
                                    ${
                                      isLocked
                                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                        : isSelected
                                        ? "bg-yellow-100 font-semibold shadow-inner"
                                        : isApproved
                                        ? "bg-yellow-50 text-yellow-600"
                                        : "hover:bg-gray-100 cursor-pointer"
                                    }
                                  `}
                                  title={
                                    isLocked ? "Cannot reduce score once given" : desc
                                  }
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <span>{desc}</span>
                                    {isSelected && (
                                      <span className="text-green-500 font-bold text-lg">✓</span>
                                    )}
                                  </div>
                                </motion.td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments */}
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

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isSubmitting ? "Submitting..." : "Submit Assessment"}
        </button>
      </div>
    </div>
  );
};

export default WriteAssessmentPanel;
