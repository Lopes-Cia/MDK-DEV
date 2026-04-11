import "@puckeditor/core/puck.css";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full">{children}</div>;
}

