export default function BienvenidaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-8 p-6">
      {children}
    </div>
  )
}
