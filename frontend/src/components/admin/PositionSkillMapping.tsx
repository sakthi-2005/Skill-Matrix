import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Target,
  Settings,
  Save,
  X
} from 'lucide-react';
import { skillService, positionService } from '../../services/api';
import { toast } from 'sonner';

interface Skill {
  id: number;
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  position: number[];
}

interface Position {
  id: number;
  name: string;
}

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
        positionService.getAllPositions()
      ]);

      if (skillsResponse) {
        setSkills(skillsResponse);
        // Set currently mapped skills for this position
        const mappedSkills = skillsResponse
          .filter((skill: Skill) => skill.position && skill.position.includes(positionId))
          .map((skill: Skill) => skill.id);
        setSelectedSkills(new Set(mappedSkills));
      }

      if (positionsResponse) {
        setPositions(positionsResponse);
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
      
      // Update each skill's position array
      const updatePromises = skills.map(async (skill) => {
        const currentPositions = skill.position || [];
        const shouldIncludePosition = selectedSkills.has(skill.id);
        const currentlyIncluded = currentPositions.includes(positionId);

        if (shouldIncludePosition && !currentlyIncluded) {
          // Add position to skill
          const updatedPositions = [...currentPositions, positionId];
          return skillService.updateSkill({
            ...skill,
            position: updatedPositions
          });
        } else if (!shouldIncludePosition && currentlyIncluded) {
          // Remove position from skill
          const updatedPositions = currentPositions.filter(id => id !== positionId);
          return skillService.updateSkill({
            ...skill,
            position: updatedPositions
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success('Position skill requirements updated successfully');
      onSave?.(); // Call the onSave callback to refresh parent data
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
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
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
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
                          {skill.low && (
                            <div><span className="font-medium">Low:</span> {skill.low}</div>
                          )}
                          {skill.medium && (
                            <div><span className="font-medium">Medium:</span> {skill.medium}</div>
                          )}
                          {skill.average && (
                            <div><span className="font-medium">Average:</span> {skill.average}</div>
                          )}
                          {skill.high && (
                            <div><span className="font-medium">High:</span> {skill.high}</div>
                          )}
                        </div>
                        {skill.position && skill.position.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Also required for: {skill.position
                                .filter(id => id !== positionId)
                                .map(id => positions.find(p => p.id === id)?.name)
                                .filter(Boolean)
                                .join(', ') || 'None'}
                            </span>
                          </div>
                        )}
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