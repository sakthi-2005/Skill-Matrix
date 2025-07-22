import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AssessmentWithHistory, DetailedScore } from "../../types/assessmentTypes";
import { SkillModalData } from "../../types/teamTypes";

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
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  data: SkillModalData;
  onClose: () => void;
}

const WriteAssessmentPanel: React.FC<Props> = ({
  assessment,
  skills,
  skillScores,
  setSkillScores,
  comments,
  setComments,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [openSkillId, setOpenSkillId] = useState<number | null>(null);

  const handleScoreChange = (skillId: number, score: number) => {
    setSkillScores({ ...skillScores, [skillId]: score });
  };

  const toggleTable = (skillId: number) => {
    setOpenSkillId((prev) => (prev === skillId ? null : skillId));
  };

  return (
    <div className="bg-white w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-semibold">Write Assessment</h2>
      </div>
      <p className="text-sm text-gray-600">
        Assessment for {assessment.user?.name} - #{assessment.id}
      </p>

      {/* Skills */}
      <div>
        <h3 className="text-lg font-medium mb-4">Rate Skills (1-5 scale)</h3>
        <div className="space-y-4">
          {assessment.detailedScores?.map((score: DetailedScore) => {
            const skill = skills.find((s) => s.id === score.skillId);
            const currentScore = skillScores[score.skillId] || 0;

            const levelDescriptions = [
              score.Skill?.basic || "Beginner",
              score.Skill?.low || "Intermediate",
              score.Skill?.medium || "Advanced",
              score.Skill?.high || "Expert",
              score.Skill?.expert || "Master",
            ];

            return (
              <div
                key={score.skillId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="grid grid-cols-[1fr_5fr_auto] items-center gap-4">
                  {/* Skill name */}
                  <div className="text-lg font-medium">
                    {skill?.name || score.Skill?.name}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleScoreChange(score.skillId, rating)}
                        className="p-0"
                      >
                        <svg
                          className={`w-6 h-6 transition-colors duration-200 ${
                            currentScore >= rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Dropdown */}
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

                {/* Table */}
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
                                  className="w-1/5 text-center px-2 py-2 font-medium border-r bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-blue-50 hover:to-blue-100 transition-colors"
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
                              const isSelected = idx + 1 === currentScore;
                              return (
                                <motion.td
                                  key={idx}
                                  onClick={() => handleScoreChange(score.skillId, idx + 1)}
                                  whileTap={{ scale: 0.95 }}
                                  whileHover={{ scale: 1.05 }}
                                  className={`
                                    w-1/5 px-2 py-3 text-xs text-center cursor-pointer border-r transition
                                    ${
                                      isSelected
                                        ? "bg-yellow-100 font-medium shadow-inner"
                                        : "hover:bg-gray-100"
                                    }`}
                                  title={desc}
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
