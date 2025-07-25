import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { 
  Search,
  Target,
  Save,
} from 'lucide-react';
import { skillService } from '../../services/api';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { Skill, Position } from '../../types/admin';

interface PositionSkillMappingProps {
  positionId: number;
  positionName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const PositionSkillMapping: React.FC<PositionSkillMappingProps> = ({ 
  positionId, 
  positionName, 
  isOpen, 
  onClose,
  onSave
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, positionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [skillsResponse, positionsResponse] = await Promise.all([
        skillService.getAllSkills(),
        adminService.getAllPositions(false)
      ]);

      if (skillsResponse) {
        setSkills(skillsResponse);
        // Set currently mapped skills for this position
        const mappedSkills = skillsResponse
          .filter((skill: Skill) => skill.positionId == positionId)
          .map((skill: Skill) => skill.id);
        setSelectedSkills(new Set(mappedSkills));
      }

      if (positionsResponse?.data) {
        setPositions(positionsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load skills and positions');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: number) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      toast.success('Position skill requirements updated successfully');
      onSave?.(); 
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update skill requirements');
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mappedSkillsCount = selectedSkills.size;
  const totalSkillsCount = skills.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Skill Requirements for {positionName}</span>
          </DialogTitle>
          <DialogDescription>
            Select the skills that are required for this position. 
            Currently {mappedSkillsCount} of {totalSkillsCount} skills are assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Skills List */}
          <div className="border rounded-lg max-h-80">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 p-4 max-h-[45vh] overflow-y-scroll">
                {filteredSkills.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No skills found matching your search.
                  </div>
                ) : (
                  filteredSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`skill-${skill.id}`}
                        checked={selectedSkills.has(skill.id)}
                        onCheckedChange={() => handleSkillToggle(skill.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`skill-${skill.id}`}
                          className="block font-medium text-sm cursor-pointer"
                        >
                          {skill.name}
                        </label>
                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                          {skill.basic && (
                            <div><span className="font-medium">Basic:</span> {skill.basic}</div>
                          )}
                          {skill.low && (
                            <div><span className="font-medium">Low:</span> {skill.low}</div>
                          )}
                          {skill.medium && (
                            <div><span className="font-medium">Medium:</span> {skill.medium}</div>
                          )}
                          {skill.high && (
                            <div><span className="font-medium">High:</span> {skill.high}</div>
                          )}
                          {skill.expert && (
                            <div><span className="font-medium">Expert:</span> {skill.expert}</div>
                          )}
                        </div>
                        
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Assigned to: {positions.find(p => p.id === skill.positionId)?.name || 'None'}
                            </span>
                          </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {mappedSkillsCount} skills selected
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Requirements</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PositionSkillMapping;