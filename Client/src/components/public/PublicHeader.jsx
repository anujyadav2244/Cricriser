import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PublicHeader({ active = "" }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (key) => active === key;

  return (
    <>
      <header className="bg-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 rounded-md border border-teal-200/70 text-white text-2xl leading-none"
              aria-label="Open menu"
            >
              &#9776;
            </button>
            <h1 className="text-3xl font-black cursor-pointer tracking-tight" onClick={() => navigate("/")}>
              Cricriser
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button onClick={() => navigate("/")} className={isActive("live") ? "underline" : ""}>
              Live Scores
            </button>
            <button onClick={() => navigate("/matches/schedule")} className={isActive("schedule") ? "underline" : ""}>
              Schedule
            </button>
            <button onClick={() => navigate("/matches/archive")} className={isActive("archives") ? "underline" : ""}>
              Archives
            </button>
            <button onClick={() => navigate("/login")} className="bg-white text-teal-700 px-4 py-1.5 rounded-full">
              Login
            </button>
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-teal-700 px-3 py-1.5 rounded-full text-sm font-semibold"
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <aside className="relative h-full w-[86%] max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide">Menu</h2>
              <button
                className="text-3xl leading-none text-white/90"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                &#215;
              </button>
            </div>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">My Account</span>
            </button>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Live Scores</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/matches/schedule");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Schedule</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/matches/archive");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Archives</span>
            </button>

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/browse/teams");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Browse Team</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/browse/players");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Browse Player</span>
            </button>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />
          </aside>
        </div>
      )}
    </>
  );
}
