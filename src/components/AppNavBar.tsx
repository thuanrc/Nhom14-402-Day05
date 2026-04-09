import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, Clapperboard } from "lucide-react";

export function AppNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: "/teacher", label: "Teacher Studio", icon: Clapperboard },
    { path: "/student", label: "Student View", icon: GraduationCap },
  ];

  return (
    <header className="gradient-navy px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-gold" />
        <span className="text-sm font-bold text-gold">VinSchool</span>
      </div>
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-gold"
                  : "text-gold/60 hover:text-gold hover:bg-white/10"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
