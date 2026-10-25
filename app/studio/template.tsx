// Remounts on every navigation inside Studio, so each screen fades in.
export default function StudioTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter flex min-h-full flex-1 flex-col">{children}</div>;
}
