import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminVendorsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["pending-vendors"],
    queryFn: async () => (await api.get("/admin/vendors/pending")).data.items
  });

  const approve = useMutation({
    mutationFn: async (vendorId: string) => api.post(`/admin/vendors/${vendorId}/approve`),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["pending-vendors"] })
  });
  const reject = useMutation({
    mutationFn: async (vendorId: string) => api.post(`/admin/vendors/${vendorId}/reject`),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["pending-vendors"] })
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-bold tracking-tight">Vendor approvals</div>
        <div className="text-sm text-muted-foreground">Approve vendors to unlock listing and inventory features.</div>
      </div>

      <div className="space-y-3">
        {(q.data ?? []).map((v: any) => (
          <Card key={v._id}>
            <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">{v.displayName}</div>
                <div className="text-sm text-muted-foreground">@{v.storeSlug}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{v.status}</Badge>
                <Button variant="outline" disabled={approve.isPending} onClick={() => approve.mutate(v._id)}>
                  Approve
                </Button>
                <Button variant="destructive" disabled={reject.isPending} onClick={() => reject.mutate(v._id)}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!q.isLoading && !(q.data ?? []).length && <div className="text-sm text-muted-foreground">No pending vendors.</div>}
      </div>
    </div>
  );
}

