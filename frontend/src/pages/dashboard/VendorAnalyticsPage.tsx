import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VendorAnalyticsPage() {
  const q = useQuery({
    queryKey: ["vendor-analytics"],
    queryFn: async () => (await api.get("/vendors/me/analytics")).data.data,
    retry: false
  });

  const approvalError = (q.error as any)?.response?.data?.error?.code === "VENDOR_NOT_APPROVED";
  if (approvalError) {
    return (
      <Card>
        <CardContent>
          <div className="text-sm font-semibold">Approval pending</div>
          <div className="mt-1 text-sm text-muted-foreground">Analytics will appear after admin approval and sales activity.</div>
        </CardContent>
      </Card>
    );
  }

  const d = q.data;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-bold tracking-tight">Sales analytics</div>
        <div className="text-sm text-muted-foreground">Revenue and performance for your storefront.</div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric title="Revenue" value={d ? `₹${d.revenue.toFixed(2)}` : "—"} />
        <Metric title="Gross sales" value={d ? `₹${d.grossSales.toFixed(2)}` : "—"} />
        <Metric title="Items sold" value={d ? String(d.itemsSold) : "—"} />
      </div>
      <Card>
        <CardContent>
          <div className="text-sm font-semibold">Tips</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">Feature best sellers</Badge>
            <Badge variant="outline">Keep stock healthy</Badge>
            <Badge variant="outline">Add specs & compatibility</Badge>
            <Badge variant="outline">Fast fulfilment improves ratings</Badge>
          </div>
        </CardContent>
      </Card>
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

