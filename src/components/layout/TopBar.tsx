export function TopBar() {
  return (
    <header className="fixed left-60 right-0 top-8 h-[52px] z-40
                       bg-background flex items-center justify-end px-6 gap-3
                       shadow-[0_1px_0_rgba(195,198,209,0.2)]">
      <input
        placeholder="Search data series..."
        className="bg-input rounded text-[11px] px-3 py-1.5 w-52
                   text-muted-foreground placeholder:text-muted-foreground/50
                   outline-none focus:ring-1 focus:ring-primary/40 border-none"
      />
      <button className="p-1.5 text-primary hover:bg-accent rounded-full transition-colors">
        {/* notification icon */}
      </button>
      <button className="p-1.5 text-primary hover:bg-accent rounded-full transition-colors">
        {/* settings icon */}
      </button>
    </header>
  )
}
