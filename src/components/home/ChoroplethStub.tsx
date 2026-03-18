export function ChoroplethStub() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-3 h-full min-h-[320px]">
      <div
        className="w-20 h-14 rounded bg-slate-100 border border-dashed border-slate-300"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-slate-700">Regional Explorer</p>
      <p className="text-xs text-slate-400 text-center">
        State-level economic data map<br />
        coming in a future update
      </p>
    </div>
  )
}
