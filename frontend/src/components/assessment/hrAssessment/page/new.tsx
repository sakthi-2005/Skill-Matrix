import {
  Users,
  Search,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Assessment, AssessmentStatus} from "@/types/assessmentTypes";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";


export const AssessmentsTab: React.FC<{
    setAssessmentId : (id: number | null) => void;
    assessments: Assessment[];
    formateDate: (date: Date)=>string;
    userSummaries: any[]
}> = ({setAssessmentId,assessments,formateDate,userSummaries}) => {

    const [searchTerm,setSearchTerm] = useState("");
    const [statusFilter,setStatusFilter] = useState("all");
    const [filteredAssessments,setFilteredAssessments] = useState([]);
    const navigate = useNavigate();

    useEffect(()=>{
        setFilteredAssessments(assessments.filter(val=> val.status === statusFilter || statusFilter === "all").filter(val=>(val.user.name).toLowerCase().includes(searchTerm.toLowerCase())))
    },[searchTerm,statusFilter])

    return(
        <div>
            <div className="mb-5">
                <span className="rounded p-2 m-3 cursor-pointer shadow hover:shadow-md"  onClick={()=>setAssessmentId(null)}>&larr; back</span>
            </div>
            <div>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by employee name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    </div>
                    <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                    <option value="all">All Statuses</option>
                    <option value="INITIATED">Initiated</option>
                    <option value="LEAD_WRITING">Lead Writing</option>
                    <option value="EMPLOYEE_REVIEW">Employee Review</option>
                    <option value="EMPLOYEE_APPROVED">Employee Approved</option>
                    <option value="HR_FINAL_REVIEW">HR Review</option>
                    <option value="COMPLETED">Completed</option>
                    </select>
                </div> 
            </div>
            <div className="p-5 mt-5">
                {
                    filteredAssessments.map((val)=>{
                        return (
                            <div key={val.id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md mb-2">
                                <div className="flex items-center justify-between mb-3">
                                <div className="flex gap-5 ">
                                    <div className="rounded-full bg-blue-100 p-3">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                <h4 className="font-medium py-2">{val.user.name}</h4>
                                </div>
                                {/* {new Date(cycle?.deadlineDate) < new Date() ? "overdue" : "still active" } */}
                                    <div className="flex gap-5">
                                        { new Date(val?.deadlineDate) < new Date() &&
                                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                            Deadline Ended
                                        </span>
                                        }
                                        <span className={`px-2 py-1 rounded text-xs ${
                                        val.status !== "COMPLETED" ? "bg-green-100 text-green-800" :
                                        val.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                                        ""
                                        }`}>
                                        {val.status.replace('_'," ")}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Assessment Date:</span>
                                        <span className="ml-2 font-small">{formateDate(val.scheduledDate)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Deadline:</span>
                                        <span className="ml-2 font-small">{formateDate(val.deadlineDate)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">No.of.Skills:</span>
                                        <span className="ml-2">{userSummaries.find(e=>e.latestAssessment.id === val.id).latestAssessment.detailedScores.length}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => navigate(`/assessment-details/${val.id}`)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                                        >
                                            <Clock className="h-4 w-4" />
                                            History
                                        </button>
                                    </div>
                                </div>
                                
                            </div>
                        );
                    })
                }
            </div>
        </div>
    )
};