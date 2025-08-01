import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  TrendingUp,
  X,
  Edit,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  User,
} from "lucide-react";
import { userService, assessmentService, skillService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { TeamMember, SkillModalData } from "../../../types/teamTypes";
import { 
  AssessmentWithHistory, 
  AssessmentStatus, 
  LeadSkillAssessment, 
  TeamStatistics,
  DetailedScore 
} from "../../../types/assessmentTypes";
import AllAssessmentsTab from "./page/AllAssessmentsTab";
import PendingActionsTab from "./page/PendingActionsTab";
import WriteAssessmentModal from "./WriteAssessmentModal";
import AssessmentHistoryModal from "./modals/AssessmentHistoryModal";
import SkillScoresModal from "./modals/SkillScoresModal";
import UnifiedAssessmentReview from "../shared/UnifiedAssessmentReview";

interface Skill {
  id: number;
  name: string;
}
const TeamAssessment = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
    const [pendingAssessments, setPendingAssessments] = useState<AssessmentWithHistory[]>([]);
    const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("pending");
    const [curLeadScore,setCurLeadScore]=useState<{ [skillId: number]: number }>({});
    const [openDropdowns, setOpenDropdowns] = useState<{
        [key: string]: boolean;
    }>({});
    const [userModalMode, setUserModalMode] = useState<"add" | "edit">("add");
    const [usertoDelete, setUserToDelete] = useState<TeamMember | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [skillModalData, setSkillModalData] = useState<SkillModalData | null>(null);

    // Assessment workflow states
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
    const [skillScores, setSkillScores] = useState<{ [skillId: number]: number }>({});
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedAssessmentHistory, setSelectedAssessmentHistory] = useState<AssessmentWithHistory | null>(null);
    
    //Skill description
    const [showSkillDescriptionModal, setShowSkillDescriptionModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    useEffect(() => {
        loadTeamData();
    }, [user]);

    const handleViewSkillDescription = (skill: Skill) => {
    setSelectedSkill(skill);
    setShowSkillDescriptionModal(true);
    };

    const closeSkillDescriptionModal = () => {
    setSelectedSkill(null);
    setShowSkillDescriptionModal(false);
    };


    const loadTeamData = async () => {
        console.log('loading...');
        setIsLoading(true);
        try {
            const [membersRes, assessmentsRes, pendingRes, statsRes, skillsRes] = await Promise.all([
                assessmentService.getTeamMembers().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getPendingTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessmentStatistics().catch(() => ({ success: false, data: null })),
                skillService.getAllSkills(),
            ]);

            // If assessment service doesn't return team members, fall back to user service
            if (membersRes.success && membersRes.data.length > 0) {
                setTeamMembers(membersRes.data);
            } else if (user?.Team?.name) {
                // Fallback to user service
                const fallbackData = await userService.getTeamMatrix(user.Team.name);
                setTeamMembers(fallbackData || []);
            }

            if (assessmentsRes.success) setAssessments(assessmentsRes.data);
            if (pendingRes.success) setPendingAssessments(pendingRes.data);
            if (statsRes.success) setStatistics(statsRes.data);
            if (skillsRes.success) setSkills(skillsRes.data);
        } catch (error) {
            console.error("Error loading team data:", error);
            toast({
                title: "Error",
                description: "Failed to load team data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(()=>{
        const isAnyModalOpen=showSkillModal || showUserModal || showDeleteModal;
        if(isAnyModalOpen){
            document.body.style.overflow="hidden";
            return()=>{
                document.body.style.overflow="unset";
            };
        }
    },[showSkillModal,showUserModal,showDeleteModal]);

    useEffect(() => {
        if (selectedTab !== "writeAssessment") {
            setSelectedAssessment(null);
        }
    }, [selectedTab]);

    const getStatusColor = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.INITIATED:
                return "bg-blue-100 text-blue-800";
            case AssessmentStatus.LEAD_WRITING:
                return "bg-yellow-100 text-yellow-800";
            case AssessmentStatus.EMPLOYEE_REVIEW:
                return "bg-purple-100 text-purple-800";
            case AssessmentStatus.EMPLOYEE_APPROVED:
                return "bg-green-100 text-green-800";
            case AssessmentStatus.EMPLOYEE_REJECTED:
                return "bg-red-100 text-red-800";
            case AssessmentStatus.HR_FINAL_REVIEW:
                return "bg-indigo-100 text-indigo-800";
            case AssessmentStatus.COMPLETED:
                return "bg-gray-100 text-gray-800";
            case AssessmentStatus.CANCELLED:
                return "bg-gray-100 text-gray-500";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.INITIATED:
                return <Clock className="h-4 w-4" />;
            case AssessmentStatus.LEAD_WRITING:
                return <Edit className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REVIEW:
                return <Eye className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_APPROVED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REJECTED:
                return <X className="h-4 w-4" />;
            case AssessmentStatus.HR_FINAL_REVIEW:
                return <AlertCircle className="h-4 w-4" />;
            case AssessmentStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.CANCELLED:
                return <X className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const handleWriteAssessment = async (assessment: AssessmentWithHistory) => {
    setSelectedAssessment(assessment);
    setSelectedTab("writeAssessment");

    const initialScores: { [skillId: number]: number } = {};
    const minAllowedScores: { [skillId: number]: number } = {}; // ✅ for locking lower stars

    assessment.detailedScores?.forEach((score) => {
        if (score.score != null) {
            initialScores[score.skillId] = score.score;
            minAllowedScores[score.skillId] = score.score;
        }
    });

    const userId = typeof assessment.user.id === "number" ? assessment.user.id.toString() : assessment.user.id;

    const latestRes = await assessmentService.getUserLatestApprovedScoresByUserId(userId);

    if (latestRes.success) {
        latestRes.data.forEach((latest) => {
            const skillId = latest.skill_id;
            const latestScore = latest.score ?? 0;

            if (initialScores[skillId] === undefined) {
                initialScores[skillId] = latestScore;
            }

            if (!minAllowedScores[skillId] || minAllowedScores[skillId] < latestScore) {
                minAllowedScores[skillId] = latestScore;
            }
        });
    }

    setSkillScores(initialScores);
    setCurLeadScore(minAllowedScores); // ✅ This holds lock levels
    setComments("");
};



    const handleSubmitAssessment = async () => {
        if (!selectedAssessment) return;

        const unscoredSkills = selectedAssessment.detailedScores.filter(
            (score) => !(skillScores[score.skillId] && skillScores[score.skillId] > 0)
        );

        if (unscoredSkills.length > 0) {
            toast({
            title: "Incomplete Scores",
            description: "Please provide scores for all skills before submitting.",
            variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const skillAssessments: LeadSkillAssessment[] = selectedAssessment.detailedScores.map((score: DetailedScore) => ({
                skillId: score.skillId,
                leadScore: skillScores[score.skillId] || 0,
            }));
            const payload={
                assessmentId:selectedAssessment.id,
                skills:skillAssessments,
                comments
            };
            console.log("Submitting payload:",payload);

            const response = await assessmentService.writeLeadAssessment(                
                selectedAssessment.id,
                skillAssessments,
                comments
            );

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Assessment submitted successfully",
                });
                loadTeamData(); // Refresh data

                setSelectedTab("pending");
                setSelectedAssessment(null);
            }
        } catch (error) {
            console.error("Error submitting assessment:", error);
            toast({
                title: "Error",
                description: "Failed to submit assessment",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewHistory = (assessment: AssessmentWithHistory) => {
        setSelectedAssessmentHistory(assessment);
        setShowHistoryModal(true);
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const tabs = [
        { id: "assessments", label: "All Assessments", icon: FileText },
        { id: "pending", label: "Pending Actions", icon: Clock },
        { id: "myAssessment", label: "My Assessment", icon: User },
        { id: "writeAssessment", label: "Write Assessment", hidden:true},
    ];

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Members</p>
                            <p className="text-2xl font-bold">{statistics?.totalTeamMembers || teamMembers.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">
                                {statistics?.assessments.byStatus.completed || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-sm text-gray-600">Pending Actions</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {statistics?.pendingActions || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Recent Activity</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {statistics?.recentAssessments || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {tabs
                        .filter(tab => !tab.hidden)
                        .map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        selectedTab === tab.id
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                    {tab.id === "pending" && statistics?.pendingActions > 0 && (
                                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {statistics.pendingActions}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Tab Content */}
                    {selectedTab === "assessments" && (
                        <AllAssessmentsTab 
                            assessments={assessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                            userRole={user?.role?.name}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                    )}

                    {selectedTab === "pending" && (
                        <PendingActionsTab 
                            pendingAssessments={pendingAssessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                        />
                    )}

                    {selectedTab === "myAssessment" && (
                        <UnifiedAssessmentReview context="auto" />
                    )}

                    {selectedTab === "writeAssessment" && selectedAssessment && (
                        <WriteAssessmentModal
                            assessment={selectedAssessment}
                            skills={skills}
                            skillScores={skillScores}
                            setSkillScores={setSkillScores}
                            comments={comments}
                            setComments={setComments}
                            isSubmitting={isSubmitting}
                            onSubmit={handleSubmitAssessment}
                            data={curLeadScore}
                            onClose={() => setSelectedTab("pending")} // go back when done
                        />
                    )}
                </div>
            </div>

            {/* Assessment History Modal */}
            {showHistoryModal && selectedAssessmentHistory && (
                <AssessmentHistoryModal 
                    assessment={selectedAssessmentHistory}
                    onClose={() => setShowHistoryModal(false)}
                    formatDate={formatDate}
                />
            )}
            {/* Skill Scores Modal */}
            {showSkillModal && skillModalData && (
                <SkillScoresModal 
                    data={skillModalData}
                    onClose={() => setShowSkillModal(false)}
                />
            )}

            {/* Skill Description Modal */}
            {/* {showSkillDescriptionModal && selectedSkill && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-[700px] w-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">
                                {selectedSkill.name} - Description
                            </h2>
                            <button
                                onClick={closeSkillDescriptionModal}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 text-sm max-h-[472px] overflow-y-auto space-y-4">
                    {[
                        { stars: 1, title: "Beginner", text: selectedSkill?.low || "Beginner" },
                        { stars: 2, title: "Intermediate", text: selectedSkill?.medium || "Intermediate" },
                        { stars: 3, title: "Advanced", text: selectedSkill?.average || "Advanced" },
                        { stars: 4, title: "Expert", text: selectedSkill?.high || "Expert"},
                        { stars: 5, title: "Master", text: "Mastery" }
                    ].map(({ stars, title, text }, idx) => (
                        <div
                        key={idx}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow transition"
                        >
                        {/* Left: Stars */}
                        {/* <div className="flex gap-1 text-yellow-400 text-xl min-w-[110px]">
                            {[1,2,3,4,5].map(i => (
                            <span key={i} className={`${i <= stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ★
                            </span>
                            ))}
                        </div> */}

                        {/* Middle: Info */}
                        {/* <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
                            </div>
                            <p className="text-gray-600">{text}</p> */}

                            {/* Progress Bar */}
                            {/* <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                            <div
                                className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${(stars/5)*100}%` }}
                            />
                            </div>
                        </div>
                        </div>
                    ))} 
                    </div>

                        
                    </div>
                </div>
            )} */}
        </div>
    );
}

// Tab Components

export default TeamAssessment;
