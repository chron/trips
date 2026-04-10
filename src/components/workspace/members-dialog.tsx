import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { X, UserPlus, Mail, Check, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useWorkspaceId } from "../../lib/workspace";

export function MembersDialog({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const members = useQuery(api.workspaces.listMembers, { workspaceId });
  const invite = useMutation(api.workspaces.inviteByEmail);
  const remove = useMutation(api.workspaces.removeMember);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      await invite({ workspaceId, email: email.trim() });
      toast.success(`Invited ${email.trim()}`);
      setEmail("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invite",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(memberId: Id<"workspaceMembers">) {
    try {
      await remove({ memberId });
      toast.success("Removed from workspace");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-xl border border-border shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif text-foreground">
            Workspace Members
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2 mb-6">
          {members?.map((member) => {
            const isPending = member.userId === "";
            return (
              <div
                key={member._id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isPending ? (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPending
                        ? "Invited — waiting for sign-in"
                        : member.role}
                    </p>
                  </div>
                </div>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member._id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
          {members?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members yet.
            </p>
          )}
        </div>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Invite your travel partner
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@email.com"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={!email.trim() || sending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? "Sending..." : "Invite"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            They'll join your workspace automatically when they sign in with this email.
          </p>
        </form>
      </div>
    </div>
  );
}
