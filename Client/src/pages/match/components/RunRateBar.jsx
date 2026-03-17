export default function RunRateBar({
  innings,
  runs,
  overs,
  target,
  totalOvers
}) {
  const crr = overs > 0 ? (runs / overs).toFixed(2) : "0.00";

  let rrr = null;

  if (innings === 2 && target) {
    const remainingRuns = target - runs;
    const remainingOvers = totalOvers - overs;

    if (remainingRuns > 0 && remainingOvers > 0) {
      rrr = (remainingRuns / remainingOvers).toFixed(2);
    }
  }

  return (
    <div className="flex gap-6 text-sm text-slate-300">
      <div>
        <span className="text-slate-400">CRR</span>
        <div className="text-lg font-semibold text-white">
          {crr}
        </div>
      </div>

      {rrr && (
        <div>
          <span className="text-slate-400">RRR</span>
          <div className="text-lg font-semibold text-orange-400">
            {rrr}
          </div>
        </div>
      )}
    </div>
  );
}
