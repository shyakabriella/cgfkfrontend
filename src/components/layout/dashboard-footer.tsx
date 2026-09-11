export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="flex flex-col items-center justify-between gap-2 px-5 py-5 text-center text-xs text-slate-500 sm:flex-row sm:px-8 sm:text-left">
        <p>
          © {currentYear} CGFK School Management System. All rights reserved.
        </p>

        <p>
          Registration · Attendance · Academic Reports
        </p>
      </div>
    </footer>
  );
}
