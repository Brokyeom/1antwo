"use client";

import { FormEvent, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirm } from "@/features/dashboard/components/delete-confirm";
import { EmptyState } from "@/features/dashboard/components/layout";
import { useMembers } from "@/features/auth/use-members";

export function MemberManagementDialog({ inviterEmail }: { inviterEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { members, loading, inviteMember, removeMember } = useMembers(inviterEmail);

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await inviteMember(email);
    setSubmitting(false);
    if (result.ok) {
      toast(`${email.trim().toLowerCase()} 님을 초대했습니다.`);
      setEmail("");
    } else {
      toast(result.error, { variant: "destructive" });
    }
  };

  const drop = async (key: string, memberEmail: string) => {
    const result = await removeMember(key);
    if (result.ok) toast(`${memberEmail} 님을 멤버에서 제외했습니다.`);
    else toast(result.error, { variant: "destructive" });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="h-3.5 w-3.5" />
        멤버 관리
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>멤버 관리</DialogTitle>
            <DialogDescription>
              초대한 이메일로 Google 로그인한 사용자만 대시보드를 수정할 수 있습니다. (관리자는 콘솔에서 별도 관리)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={invite} className="flex flex-wrap items-center gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="초대할 이메일 주소"
              className="min-w-0 flex-1"
            />
            <Button type="submit" size="sm" disabled={submitting || !email.trim()}>
              <UserPlus className="h-3.5 w-3.5" />
              초대
            </Button>
          </form>

          <div className="mt-2">
            <div className="mb-2 text-xs text-muted-foreground">초대된 멤버 {members.length}명</div>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</div>
            ) : members.length === 0 ? (
              <EmptyState>아직 초대된 멤버가 없습니다.</EmptyState>
            ) : (
              <div className="divide-y">
                {members.map((member) => (
                  <div key={member.key} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{member.email}</div>
                      {member.invitedAt && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(member.invitedAt).toLocaleDateString("ko-KR")} 초대
                          {member.invitedBy ? ` · ${member.invitedBy}` : ""}
                        </div>
                      )}
                    </div>
                    <DeleteConfirm
                      title="멤버 제외"
                      description={`"${member.email}" 님의 수정 권한을 제거합니다. 공개 열람은 계속 가능합니다.`}
                      triggerLabel="제외"
                      onConfirm={() => drop(member.key, member.email)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
