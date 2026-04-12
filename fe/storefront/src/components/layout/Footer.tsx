import routineLogo from '@/assets/routine-logo-word.png'

export const Footer = () => {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-bg)]">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-5">
        <img src={routineLogo} alt="Routine by OZ homeland" className="h-12 w-auto text-[var(--text-primary)]" />
        <div className="flex items-center gap-8 text-[13px] text-[var(--text-primary)]">
          <a href="#" className="transition-opacity hover:opacity-70">About</a>
          <a href="#" className="transition-opacity hover:opacity-70">Contact</a>
          <a href="#" className="transition-opacity hover:opacity-70">Help</a>
        </div>
      </div>
    </footer>
  )
}
