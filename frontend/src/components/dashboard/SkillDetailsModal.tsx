import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeSkill } from "@/types/dashboardTypes";
import { User, Award, ChevronDown, ChevronUp, Edit, Eye, UserX, UserCheck, ExternalLink } from "lucide-react";

interface SkillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillLevel: string;
  employees: EmployeeSkill[];
  skillLevelColor: string;
  onViewProfile?: (employeeId: string) => void;
  onEditUser?: (employeeId: string) => void;
  onToggleUserStatus?: (employeeId: string, isActive: boolean) => void;
  onNavigateToUser?: (employeeId: string) => void;
}

const SkillDetailsModal: React.FC<SkillDetailsModalProps> = ({
  isOpen,
  onClose,
  skillLevel,
  employees,
  skillLevelColor,
  onViewProfile,
  onEditUser,
  onToggleUserStatus,
  onNavigateToUser,
}) => {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  // Reset to collapsed state when modal closes
  const handleClose = () => {
    setShowAllSkills(false);
    setExpandedSkills(new Set());
    onClose();
  };

  // Toggle skill expansion
  const toggleSkillExpansion = (skillName: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillName)) {
      newExpanded.delete(skillName);
    } else {
      newExpanded.add(skillName);
    }
    setExpandedSkills(newExpanded);
  };

  // Get total skills count
  const totalSkills = employees.reduce((sum, emp) => sum + emp.skills.length, 0);

  // Group skills by name to show frequency
  const skillFrequency = employees.reduce((acc, emp) => {
    emp.skills.forEach(skill => {
      if (!acc[skill.skillName]) {
        acc[skill.skillName] = {
          name: skill.skillName,
          category: skill.skillCategory,
          count: 0,
          employees: []
        };
      }
      acc[skill.skillName].count++;
      acc[skill.skillName].employees.push(emp.name);
    });
    return acc;
  }, {} as Record<string, {
    name: string;
    category?: string;
    count: number;
    employees: string[];
  }>);

  const sortedSkills = Object.values(skillFrequency).sort((a, b) => b.count - a.count);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${skillLevelColor}`}>
              {skillLevel} Skills
            </span>
            Details
          </DialogTitle>
          <DialogDescription>
            Showing {totalSkills} {skillLevel.toLowerCase()} level skills across {employees.length} team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Skill Level Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${skillLevelColor}`}>
                  {skillLevel}
                </span>
                Level Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose text-sm text-gray-600">
                <p className="mb-2">
                  <strong>What {skillLevel} Level Means:</strong>
                </p>
                {skillLevel === 'Basic' && (
                  <p>Foundational understanding with limited practical experience. Requires guidance and supervision to complete tasks.</p>
                )}
                {skillLevel === 'Low' && (
                  <p>Basic competency with some practical experience. Can handle simple tasks independently but may need guidance for complex scenarios.</p>
                )}
                {skillLevel === 'Medium' && (
                  <p>Solid competency with good practical experience. Can handle most tasks independently and provide guidance to beginners.</p>
                )}
                {skillLevel === 'High' && (
                  <p>Advanced competency with extensive practical experience. Can handle complex tasks and mentor others effectively.</p>
                )}
                {skillLevel === 'Expert' && (
                  <p>Exceptional competency with deep expertise. Can handle the most complex challenges, innovate, and lead technical decisions.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills Summary ({sortedSkills.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(showAllSkills ? sortedSkills : sortedSkills.slice(0, 8)).map((skill) => (
                  <div 
                    key={skill.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{skill.name}</p>
                      {skill.category && (
                        <p className="text-xs text-gray-500">{skill.category}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {skill.count}
                    </Badge>
                  </div>
                ))}
                {sortedSkills.length > 8 && (
                  <button
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-300"
                  >
                    <div className="flex items-center gap-2">
                      {showAllSkills ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-sm font-medium">+{sortedSkills.length - 8} more skills</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employees Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div 
                    key={employee.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.name}</h4>
                          {employee.email && (
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {employee.skills.length} skills
                      </Badge>
                    </div>
                    
                    <div className="mt-3 ml-11">
                      <div className="flex flex-wrap gap-2">
                        {employee.skills.map((skill, index) => (
                          <div
                            key={`${skill.skillName}-${index}`}
                            className="group relative"
                          >
                            <Badge 
                              variant="secondary" 
                              className="text-xs hover:bg-gray-200 transition-colors"
                            >
                              {skill.skillName}
                            </Badge>
                            {skill.skillCategory && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {skill.skillCategory}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {employees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No team members have {skillLevel.toLowerCase()} level skills</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillDetailsModal;