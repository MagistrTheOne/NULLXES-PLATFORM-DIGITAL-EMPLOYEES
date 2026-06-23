export default function EmployeeTalkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-2 py-3 md:px-4 lg:px-0 lg:py-0">
      {children}
    </div>
  );
}
