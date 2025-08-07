import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import { positionService, skillService } from "@/services/api";
import { adminService } from "@/services/adminService";
import SkillCreationModal from "./SkillCreationModal";
import DeleteModal from "../../lib/DeleteModal";
import { SkillCriterion } from "../../types/criteria";
import { toast } from "@/hooks/use-toast";

interface SkillCriteriaPageProps {
  onStatsUpdate?: () => void;
}

const SkillCriteriaPage: React.FC<SkillCriteriaPageProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<SkillCriterion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillCriterion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillCriterion | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState(0);
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Role-based permissions
  const canEdit = user?.role?.name === "hr" || user?.role?.name === "admin";
  const isAdminContext = user?.role?.name === "admin";

  const toggleAccordion = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const fetchSkillCriteria = async () => {
    try {
      setLoading(true);
      setError(null);
      let skillsData;
      let positionsData;

      // Fetch skills based on user role
      if (canEdit) {
        skillsData = await skillService.getAllSkills();
      } else {
        skillsData = await skillService.getSkillsByPosition();
      }

      // Fetch positions - use adminService for admin context, positionService otherwise
      if (isAdminContext) {
        const positionsResponse = await adminService.getAllPositions(false);
        positionsData = positionsResponse.data || [];
      } else {
        positionsData = await positionService.getAllPositions();
      }

      setPositions(positionsData);
      setCriteria(skillsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch skill criteria"
      );
      console.error("Error fetching skill criteria:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillCriteria();
  }, [user]);

  // Handle click outside dropdown and ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPositionDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPositionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const refreshData = () => {
    setSearchTerm("");
    setFilterTerm(0);
    setIsPositionDropdownOpen(false);
  };

  const handleModalSuccess = async () => {
    try {
      const skillsData = await skillService.getAllSkills();
      setCriteria(skillsData);
      
      // Call onStatsUpdate if provided to refresh parent stats
      if (onStatsUpdate) {
        onStatsUpdate();
      }
      
      toast({
        title: "Success",
        description: editingSkill ? "Skill updated successfully" : "Skill created successfully",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh skill criteria"
      );
      console.error("Error refreshing skill criteria:", err);
    }
  };

  const handleEdit = (criterion: SkillCriterion) => {
    setEditingSkill(criterion);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (criterion: SkillCriterion) => {
    setSkillToDelete(criterion);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return;

    try {
      await skillService.deleteSkill(skillToDelete.id);

      // Remove from local state
      setCriteria(criteria.filter((c) => c.id !== skillToDelete.id));

      // Call onStatsUpdate if provided to refresh parent stats
      if (onStatsUpdate) {
        onStatsUpdate();
      }

      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });

      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
      console.error("Error deleting skill:", err);
      
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSkillToDelete(null);
  };

  const getPositionNames = (positionIds: number) => {
    const position = positions.find((p) => p.id === positionIds);
    return position?.name || "Not specified";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading skill criteria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  let filteredCriteria = criteria.filter((criterion) => {
    let filter = criterion.positionId === filterTerm;
    if (filterTerm === 0) {
      filter = true;
    }

    const matchesSearch = criterion.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesSearch && filter;
  });

  return (
    <div className="">
      {/* Conditionally render modals only if user can edit */}
      {canEdit && (
        <>
          <SkillCreationModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingSkill(null);
            }}
            onSuccess={handleModalSuccess}
            editSkill={editingSkill}
            mode={editingSkill ? "edit" : "create"}
          />

          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}

      <div className="space-y-6">
        {/* Page Header Section */}
        {/* <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100 shadow-sm">
          <div className="px-6 py-8 sm:px-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent mb-3">
                  Skill Criteria Management
                </h1>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                  {canEdit 
                    ? "Define and manage skill criteria for different positions. Set proficiency levels, create assessments, and track skill development across your organization."
                    : "View skill criteria and proficiency requirements for your position. Track your progress and identify areas for professional development."
                  }
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">
                      {criteria.length} {criteria.length === 1 ? 'Skill' : 'Skills'} Available
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Management Access</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">
                      {positions.length} {positions.length === 1 ? 'Position' : 'Positions'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        {/* Search, Filter and Action Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Search & Filter Skills
            </h2>
            <p className="text-sm text-gray-600">
              Find specific skills by name or filter by position to narrow down your search
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-4 sm:flex-row flex-col sm:items-center">
                <div className="relative w-full sm:w-80 md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="Search skills..."
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                      type="button"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {canEdit && (
                  <div className="relative" ref={dropdownRef}>
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <button
                      type="button"
                      className="flex items-center justify-between pl-10 pr-3 py-2 w-48 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 cursor-pointer"
                      onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                    >
                      <span className="truncate">
                        {filterTerm === 0 ? "All Positions" : positions.find(p => p.id === filterTerm)?.name || "All Positions"}
                      </span>
                      <ChevronDown 
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          isPositionDropdownOpen ? "rotate-180" : ""
                        }`} 
                      />
                    </button>
                    
                    {/* Custom dropdown menu with height restrictions */}
                    {isPositionDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          <button
                            type="button"
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 ${
                              filterTerm === 0 ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                            }`}
                            onClick={() => {
                              setFilterTerm(0);
                              setIsPositionDropdownOpen(false);
                            }}
                          >
                            All Positions
                          </button>
                          {positions.map((position) => (
                            <button
                              key={position.id}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 ${
                                filterTerm === position.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                              }`}
                              onClick={() => {
                                setFilterTerm(position.id);
                                setIsPositionDropdownOpen(false);
                              }}
                            >
                              {position.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  className="flex items-center gap-2 px-4 py-2 bg-background border text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                {canEdit && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors duration-150"
                  >
                    <Plus className="h-4 w-4" />
                    Add {isAdminContext ? "Skill" : "Criterion"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {criteria.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No skill criteria found
            </h3>
            <p className="text-gray-500 mb-6">
              {canEdit 
                ? "No skill criteria found matching your search. Get started by adding your first skill criterion."
                : "No skill criteria found matching your search filters."
              }
            </p>
            {canEdit && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add First {isAdminContext ? "Skill" : "Criterion"}
              </button>
            )}
          </div>
        ) : (
            filteredCriteria.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No skill criteria found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    No skill criteria found matching your search.
                  </p>
                </div>
            ) : (
          <div className="space-y-4">
            {/* Skills List Header */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Available Skills ({filteredCriteria.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                      Click on any skill to view detailed criteria, proficiency levels, and requirements
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {searchTerm && (
                      <span>Filtered by: <span className="font-medium text-blue-600">"{searchTerm}"</span></span>
                    )}
                    {filterTerm !== 0 && (
                      <span className="ml-2">Position: <span className="font-medium text-blue-600">{getPositionNames(filterTerm)}</span></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Skills List */}
            <div className="space-y-3">
            {filteredCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Accordion Header */}
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => toggleAccordion(criterion.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedItems.has(criterion.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {criterion.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getPositionNames(criterion.positionId)}
                      </span>
                      {criterion.createdBy && (<span className="text-sm text-gray-500">
                        Created by {criterion.createdBy}
                      </span>)}
                    </div>
                  </div>

                  {/* Edit and Delete buttons - only show if user can edit */}
                  {canEdit && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleEdit(criterion)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-150"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(criterion)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Accordion Content */}
                {expandedItems.has(criterion.id) && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {/* Basic Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Basic Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.basic || "Not defined"}
                          </p>
                        </div>

                        {/* Low Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Low Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.low || "Not defined"}
                          </p>
                        </div>

                        {/* Medium Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Medium Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.medium || "Not defined"}
                          </p>
                        </div>

                        {/* High Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              High Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.high || "Not defined"}
                          </p>
                        </div>

                        {/* Expert Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Expert Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.expert || "Not defined"}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Created on{" "}
                            {new Date(criterion.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillCriteriaPage;
