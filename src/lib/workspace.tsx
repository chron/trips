import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const WorkspaceContext = createContext<Id<"workspaces"> | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const existingWorkspaceId = useQuery(api.workspaces.mine);
  const getOrCreate = useMutation(api.workspaces.getOrCreate);
  const [workspaceId, setWorkspaceId] = useState<Id<"workspaces"> | null>(null);

  // Sync query result into state — getOrCreate needs the mutation + setState pattern
  useEffect(() => {
    if (existingWorkspaceId) {
      setWorkspaceId(existingWorkspaceId); // eslint-disable-line react-hooks/set-state-in-effect
    } else if (existingWorkspaceId === null) {
      // No workspace yet, create one
      getOrCreate().then(setWorkspaceId);
    }
  }, [existingWorkspaceId, getOrCreate]);

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Setting up…</p>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={workspaceId}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId(): Id<"workspaces"> {
  const id = useContext(WorkspaceContext);
  if (!id) throw new Error("useWorkspaceId must be used within WorkspaceProvider");
  return id;
}
