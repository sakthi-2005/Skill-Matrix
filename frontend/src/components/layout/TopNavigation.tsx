import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Users,
  Target,
  Grid3X3,
  TrendingUp,
  User,
  ClipboardCheck,
  Menu,
  X,
  Settings,
  Building,
  MapPin,
} from "lucide-react";
import { userService } from "@/services/api";
import { UserInfo } from "os";
import { verifyLead } from "@/utils/helper";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TopNavigation = ({ activeTab, onTabChange }: TopNavigationProps) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [useNavigation,setUseNavigation] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const profileData = await userService.getProfile();
      setUserProfile(profileData);
      await getMenuItems();
    };
    fetchData();
  }, []);

  const getMenuItems = async() => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "skill-criteria", label: "Skill Criteria", icon: Target },
    ];

    if (user?.role?.name === "admin") {
      // Admin users get admin-specific navigation items
      baseItems.splice(1, 1, // Remove skill-criteria and replace with admin items
        { id: "admin-users", label: "Users", icon: Users },
        { id: "admin-teams", label: "Teams", icon: Building },
        { id: "admin-subteams", label: "Sub Teams", icon: Users },
        { id: "admin-positions", label: "Positions", icon: MapPin },
        { id: "admin-skills", label: "Skills", icon: Target }
      );
    } else if (user?.role?.name === "hr") {
      // HR users get HR-specific functionality (NO admin dashboard access)
      baseItems.splice(
        2,
        0,
        { id: "team-overview", label: "Team Overview", icon: Users },
        { id: "skill-matrix", label: "Skill Matrix", icon: Grid3X3 },
        { id: "hr-assessment-management", label: "HR Assessment", icon: ClipboardCheck }
      );
    } else if (await verifyLead(user.id)) {
      baseItems.splice(
        2,
        0,
        { id: "team-overview", label: "Team Overview", icon: Users },
        { id: "skill-matrix", label: "Skill Matrix", icon: Grid3X3 },
        { id: "team-assessment", label: "Team Assessment", icon: ClipboardCheck },
        { id: "skill-upgrade", label: "Upgrade Guide", icon: TrendingUp }
      );
    } else if (!await verifyLead(user.id)) {
      baseItems.splice(
        2,
        0,
        { id: "employee-assessment-review", label: "My Assessments", icon: ClipboardCheck },
        { id: "skill-upgrade", label: "Upgrade Guide", icon: TrendingUp }
      );
    }

    // return baseItems;
    setUseNavigation(baseItems);
  };


  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Brand */}
          <div className="flex items-center min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Grid3X3 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Skill Matrix
                </h1>
              </div>
            </div>
          </div>

          {/* Center - Desktop Navigation */}
          <div className="hidden xl:flex items-center justify-center flex-1 max-w-2xl mx-8">
            <nav className="flex items-center space-x-1 bg-gray-50/80 rounded-full p-1 backdrop-blur-sm">
              {useNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative flex items-center whitespace-nowrap text-sm px-4 py-2 rounded-full transition-all duration-200 font-medium",
                      isActive
                        ? "bg-white text-blue-700 shadow-md shadow-blue-100/50 hover:bg-white hover:shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    )}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className={cn("mr-2 transition-all duration-200", 
                      isActive ? "h-4 w-4" : "h-3.5 w-3.5"
                    )} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 -z-10" />
                    )}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Right side - User Profile and Mobile Menu */}
          <div className="flex items-center justify-end space-x-3">
            {/* Welcome text for medium screens */}
            <div className="hidden md:block xl:hidden">
              <p className="text-sm text-gray-600 font-medium">
                Hi, {user?.name?.split(' ')[0] || "User"}
              </p>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-200 transition-all duration-200"
                >
                  <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {userProfile?.profilePhoto ? (
                        <img 
                          src={userProfile.profilePhoto} 
                          alt="Profile" 
                          className="rounded-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0) || "U"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mt-2 shadow-xl border-0 bg-white/95 backdrop-blur-md" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                        {userProfile?.profilePhoto ? (
                          <img 
                            src={userProfile.profilePhoto} 
                            alt="Profile" 
                            className="rounded-full object-cover"
                          />
                        ) : (
                          user?.name?.charAt(0) || "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-gray-900 leading-none">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 leading-none">
                        {user?.role?.name || "Employee"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onTabChange("profile")}
                  className="p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <User className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="font-medium">Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="p-3 cursor-pointer hover:bg-red-50 text-red-600 transition-colors duration-150"
                >
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger Menu */}
            <div className="xl:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  "relative h-10 w-10 rounded-full transition-all duration-200",
                  isMobileMenuOpen 
                    ? "bg-blue-50 text-blue-600 rotate-90" 
                    : "hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 transition-transform duration-200" />
                  ) : (
                    <Menu className="h-5 w-5 transition-transform duration-200" />
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
                        
        {/* Mobile Navigation Menu */}
        <div className={cn(
          "xl:hidden transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen 
            ? "max-h-96 opacity-100 border-t bg-gradient-to-b from-white to-gray-50/50" 
            : "max-h-0 opacity-0"
        )}>
          <div className="px-3 py-4 space-y-2">
            {useNavigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start flex items-center p-4 rounded-xl transition-all duration-200 font-medium",
                    "transform hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md border border-blue-200/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                  )}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className={cn("mr-4 transition-all duration-200", 
                    isActive ? "h-5 w-5 text-blue-600" : "h-4 w-4"
                  )} />
                  <span className="text-base">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
