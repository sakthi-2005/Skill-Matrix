import React from "react";
import { X } from "lucide-react";
import { SkillModalData } from "../../../types/teamTypes";

const SkillScoresModal: React.FC<{
  data: SkillModalData;
  onClose: () => void;
}> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Skill Scores</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{data.memberName}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {data.skills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No skill scores available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <span className="font-medium">{skill.skill_name}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {skill.score}/5
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillScoresModal;
