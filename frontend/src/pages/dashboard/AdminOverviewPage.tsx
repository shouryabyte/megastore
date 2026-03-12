import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";

export function AdminOverviewPage() {
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/overview")).data.data
  });

  const d = q.data;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-bold tracking-tight">Admin overview</div>
        <div className="text-sm text-muted-foreground">Revenue, commission, vendors, users, and product totals.</div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric title="Revenue" value={d ? `₹${d.revenue.toFixed(2)}` : "—"} />
        <Metric title="Commission" value={d ? `₹${d.commission.toFixed(2)}` : "—"} />
        <Metric title="Orders" value={d ? String(d.orders) : "—"} />
        <Metric title="Users" value={d ? String(d.users) : "—"} />
        <Metric title="Vendors" value={d ? String(d.vendors) : "—"} />
        <Metric title="Products" value={d ? String(d.products) : "—"} />
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
