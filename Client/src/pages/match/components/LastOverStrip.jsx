import { cn } from "@/lib/utils";

export default function LastOverStrip({ balls = [] }) {
  if (!balls || balls.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        No deliveries yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {balls.map((ball, index) => (
        <BallItem key={index} value={ball} />
      ))}
    </div>
  );
}

/* ================= SINGLE BALL ================= */
function BallItem({ value }) {
  const style = getBallStyle(value);

  return (
    <div
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
        style.bg,
        style.text
      )}
    >
      {value}
    </div>
  );
}

/* ================= STYLE DECIDER ================= */
function getBallStyle(value) {
  switch (value) {
    case "6":
      return {
        bg: "bg-green-600",
        text: "text-white"
      };
    case "4":
      return {
        bg: "bg-blue-600",
        text: "text-white"
      };
    case "W":
      return {
        bg: "bg-red-600",
        text: "text-white"
      };
    case "Wd":
    case "Nb":
      return {
        bg: "bg-yellow-400",
        text: "text-black"
      };
    default:
      return {
        bg: "bg-slate-700",
        text: "text-white"
      };
  }
}
