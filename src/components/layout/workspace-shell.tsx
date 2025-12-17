"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Topbar } from "@/components/navigation/topbar";
import { ErrorBoundary } from "@/components/layout/error-boundary";

type WorkspaceShellProps = {
  children: ReactNode;
  title?: string | ReactNode;
  description?: string;
  actions?: ReactNode;
};

export const WorkspaceShell = ({
  children,
  title,
  description,
  actions,
}: WorkspaceShellProps) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          {(title || description || actions) && (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {title && (
                  typeof title === "string" ? (
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {title}
                    </h1>
                  ) : (
                    title
                  )
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

