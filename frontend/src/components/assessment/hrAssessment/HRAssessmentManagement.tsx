import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { assessmentService, skillService, userService, teamService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  AssessmentCycle,
} from "@/types/assessmentTypes";

import { UserHistoryModal } from "./modals/userHistoryModel";
import { ScoreHistoryModal } from "./modals/scoreHistoryModel";
import { HRReviewModal } from "./modals/hrReviewModel";
import { BulkAssessmentModal } from "./modals/bulkAssessmentModel";
//import { InitiateAssessmentModal } from "./initiateAssessmentModel";
import { PendingReviewsTab } from "./page/pendingReviewsTab";
import { AssessmentsTab } from "./page/assessmentsTab";
import { CyclesTab } from "./page/cyclesTab";
import { OverviewTab } from "./page/overviewTab";


const HRAssessmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<AssessmentWithHistory[]>([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [showScoreHistoryModal, setShowScoreHistoryModal] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduleType, setScheduleType] = useState("QUARTERLY");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [comments, setComments] = useState("");

  // Bulk assessment states
  const [bulkTitle, setBulkTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);
  const [bulkScheduleType, setBulkScheduleType] = useState("QUARTERLY");
  const [bulkDeadlineDays, setBulkDeadlineDays] = useState(7);

  useEffect(() => {
    if (user?.role?.name === "hr") {
      loadHRData();
    }
  }, [user]);

  const loadHRData = async () => {
    setIsLoading(true);
    try {
      const [assessmentsRes, userSummariesRes, cyclesRes, usersRes, teamsRes, skillsRes] = await Promise.all([
        assessmentService.getAssessmentsForRole(),
        assessmentService.getUserAssessmentSummaries(),
        assessmentService.getAssessmentCycles(),
        userService.getAllUsers(),
        teamService.getAllTeams(),
        skillService.getAllSkills(),
      ]);

      if (assessmentsRes?.success !== false) setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes?.data || []);
      if (userSummariesRes?.success !== false) setUserSummaries(Array.isArray(userSummariesRes) ? userSummariesRes : userSummariesRes?.data || []);
      if (cyclesRes?.success !== false) setCycles(Array.isArray(cyclesRes) ? cyclesRes : cyclesRes?.data || []);
      if (usersRes?.success !== false) {
        // Filter out HR users
        const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
        console.log("Users data:", usersData); // Debug log
        const nonHRUsers = usersData.filter((u: User) => u.role?.name !== "hr");
        setUsers(nonHRUsers);
      }
      if (teamsRes?.success !== false) setTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes?.data || []);
      if (skillsRes?.success !== false) setSkills(Array.isArray(skillsRes) ? skillsRes : skillsRes?.data || []);
    } catch (error) {
      console.error("Error loading HR data:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleInitiateAssessment = async () => {
    if (!selectedUser || selectedSkills.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and at least one skill",
        variant: "destructive",
      });
      return;
    }

    if (deadlineDays < 1 || deadlineDays > 30) {
      toast({
        title: "Error",
        description: "Deadline days must be between 1 and 30",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.initiateAssessment({
        targetUserId: selectedUser,
        skillIds: selectedSkills,
        scheduledDate: scheduledDate || undefined,
        scheduleType,
        deadlineDays,
        comments,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Assessment initiated successfully",
        });
        setShowInitiateModal(false);
        resetForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInitiate = async () => {
    if (!bulkTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title and select at least one skill",
        variant: "destructive",
      });
      return;
    }

    if (bulkDeadlineDays < 1 || bulkDeadlineDays > 30) {
      toast({
        title: "Error",
        description: "Deadline days must be between 1 and 30",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.initiateBulkAssessment({
        assessmentTitle: bulkTitle,
        includeTeams: selectedTeams.length > 0 ? selectedTeams : ["all"],
        scheduledDate: scheduledDate || undefined,
        scheduleType: bulkScheduleType,
        deadlineDays: bulkDeadlineDays,
        comments,
        excludeUsers: excludedUsers,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Initiate assessment initiated for ${response.data.totalAssessments} users`,
        });
        setShowBulkModal(false);
        resetBulkForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRReview = async (approved: boolean) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrFinalReview(
        selectedAssessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting HR review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowScoreHistory = async (assessmentId: number) => {
    try {
      const response = await assessmentService.getAssessmentScoreHistory(assessmentId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setScoreHistory(historyData);
        setShowScoreHistoryModal(true);
      } else {
        throw new Error(response?.error || "Failed to load score history");
      }
    } catch (error) {
      console.error("Error loading score history:", error);
      toast({
        title: "Error",
        description: "Failed to load score change history",
        variant: "destructive",
      });
    }
  };

  const handleShowUserHistory = async (userId: string, userName: string) => {
    try {
      setSelectedUserName(userName);
      setIsLoading(true);
      const response = await assessmentService.getUserAssessmentHistory(userId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setSelectedUserHistory(historyData);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error("Error loading user history:", error);
      toast({
        title: "Error",
        description: "Failed to load user assessment history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedSkills([]);
    setScheduledDate("");
    setScheduleType("QUARTERLY");
    setDeadlineDays(7);
    setComments("");
  };

  const resetBulkForm = () => {
    setBulkTitle("");
    setSelectedTeams([]);
    setSelectedSkills([]);
    setExcludedUsers([]);
    setScheduledDate("");
    setBulkScheduleType("QUARTERLY");
    setBulkDeadlineDays(7);
    setComments("");
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

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingHRReviews = assessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_APPROVED);

  const statistics = {
    total: assessments.length,
    pending: assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length,
    completed: assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
    hrReviews: pendingHRReviews.length,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "assessments", label: "All Assessments", icon: FileText },
    { id: "cycles", label: "Assessment Cycles", icon: Calendar },
    { id: "pending-reviews", label: "HR Reviews", icon: AlertCircle, count: pendingHRReviews.length },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Assessment Management</h1>
        </div>
        <div className="mb-5 flex gap-3">
          {/* <button
            onClick={() => {
              if (users.length === 0 || skills.length === 0) {
                toast({
                  title: "Error",
                  description: "Please wait for data to load before initiating assessment",
                  variant: "destructive",
                });
                return;
              }
              setShowInitiateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Initiate Assessment
          </button> */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Initiate Assessment
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Pending HR Review</p>
              <p className="text-2xl font-bold text-red-600">{statistics.hrReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-5 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
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
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content will be added here */}
          {selectedTab === "overview" && (
            <OverviewTab assessments={assessments} cycles={cycles} statistics={statistics} />
          )}
          
          {selectedTab === "assessments" && (
            <AssessmentsTab
              userSummaries={userSummaries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              onShowHistory={handleShowUserHistory}
            />
          )}

          {selectedTab === "cycles" && (
            <CyclesTab cycles={cycles} formatDate={formatDate} />
          )}

          {selectedTab === "pending-reviews" && (
            <PendingReviewsTab
              pendingReviews={pendingHRReviews}
              onReview={(assessment) => {
                setSelectedAssessment(assessment);
                setReviewComments("");
                setShowReviewModal(true);
              }}
              onShowHistory={handleShowUserHistory}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {/* {showInitiateModal && users.length > 0 && skills.length > 0 && (
        <InitiateAssessmentModal
          users={users}
          skills={skills}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={scheduleType}
          setScheduleType={setScheduleType}
          deadlineDays={deadlineDays}
          setDeadlineDays={setDeadlineDays}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleInitiateAssessment}
          onClose={() => setShowInitiateModal(false)}
        />
      )} */}

      {showBulkModal && (
        <BulkAssessmentModal
          teams={teams}
          users={users}
          bulkTitle={bulkTitle}
          setBulkTitle={setBulkTitle}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          excludedUsers={excludedUsers}
          setExcludedUsers={setExcludedUsers}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={bulkScheduleType}
          setScheduleType={setBulkScheduleType}
          deadlineDays={bulkDeadlineDays}
          setDeadlineDays={setBulkDeadlineDays}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkInitiate}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {showReviewModal && selectedAssessment && (
        <HRReviewModal
          assessment={selectedAssessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleHRReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {showHistoryModal && (
        <UserHistoryModal
          userName={selectedUserName}
          assessmentHistory={selectedUserHistory}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedUserHistory([]);
            setSelectedUserName("");
          }}
          onShowScoreHistory={handleShowScoreHistory}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}

      {showScoreHistoryModal && (
        <ScoreHistoryModal
          scoreHistory={scoreHistory}
          isOpen={showScoreHistoryModal}
          onClose={() => {
            setShowScoreHistoryModal(false);
            setScoreHistory([]);
          }}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};
export default HRAssessmentManagement;
