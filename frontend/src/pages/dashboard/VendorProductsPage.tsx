import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

export function VendorProductsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    categoryId: "",
    title: "",
    brand: "",
    modelNumber: "",
    price: 0,
    mrp: 0,
    sku: "",
    stock: 10
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data.items
  });

  const productsQ = useQuery({
    queryKey: ["vendor-products"],
    queryFn: async () => (await api.get("/vendors/me/products")).data.items,
    retry: false
  });

  const create = useMutation({
    mutationFn: async () => {
      const prepared = prepareCreatePayload(form);
      const parsed = CreateProductClientSchema.safeParse(prepared);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

      // If an image is selected, upload first so we never create products without their image.
      let uploaded: { url: string; publicId: string } | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const up = await api.post("/uploads/product-image", fd);
        uploaded = up.data?.image ? { url: up.data.image.url, publicId: up.data.image.publicId } : null;
        if (!uploaded?.url || !uploaded?.publicId) throw new Error("Image upload failed");
      }

      let created: { productId: string; slug: string } | null = null;
      try {
        const res = await api.post("/vendors/me/products", {
          categoryId: parsed.data.categoryId,
          title: parsed.data.title,
          brand: parsed.data.brand,
          modelNumber: parsed.data.modelNumber || undefined,
          price: parsed.data.price,
          mrp: parsed.data.mrp || undefined,
          sku: parsed.data.sku,
          stock: parsed.data.stock
        });
        created = res.data as { productId: string; slug: string };
      } catch (e) {
        if (uploaded?.publicId) await Promise.allSettled([api.delete("/uploads/product-image", { data: { publicId: uploaded.publicId } })]);
        throw e;
      }

      if (uploaded && created) {
        try {
          await api.post(`/vendors/me/products/${created.productId}/images`, { url: uploaded.url, publicId: uploaded.publicId, sortOrder: 0 });
        } catch (e) {
          // Roll back created product to avoid products without images.
          await Promise.allSettled([api.delete(`/vendors/me/products/${created.productId}`), api.delete("/uploads/product-image", { data: { publicId: uploaded.publicId } })]);
          throw e;
        }
      }

      return created!;
    },
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: ["vendor-products"] });
      setOpen(false);
      setImageFile(null);
      setError(null);
      setForm({ categoryId: "", title: "", brand: "", modelNumber: "", price: 0, mrp: 0, sku: "", stock: 10 });
    },
    onError: (e: any) => {
      const apiErr = e?.response?.data?.error;
      if (apiErr?.code === "VALIDATION_ERROR" && apiErr?.details) {
        const msg = extractFirstValidationMessage(apiErr.details) ?? apiErr.message;
        setError(msg ?? "Invalid input");
        return;
      }
      setError(apiErr?.message ?? e?.message ?? "Failed to create product");
    }
  });

  const del = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/vendors/me/products/${productId}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vendor-products"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["cart"] });
      await qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: any) => setError(e?.response?.data?.error?.message ?? e?.message ?? "Failed to delete product")
  });

  const approvalError = (productsQ.error as any)?.response?.data?.error?.code === "VENDOR_NOT_APPROVED";

  const catOptions = useMemo(() => {
    const cats = categoriesQ.data ?? [];
    const children = cats.filter((c: any) => c.parentId);
    return children.length ? children : cats;
  }, [categoriesQ.data]);

  const canCreate = CreateProductClientSchema.safeParse(prepareCreatePayload(form)).success;
  const skuTooShort = String(form.sku ?? "").trim().length > 0 && String(form.sku ?? "").trim().length < 3;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-bold tracking-tight">Products</div>
          <div className="text-sm text-muted-foreground">Manage catalog, inventory and images (Cloudinary).</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={approvalError} className="gap-2">
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create product</DialogTitle>
              <DialogDescription>Upload image (optional), set stock, and start selling after approval.</DialogDescription>
            </DialogHeader>
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm backdrop-blur"
                value={form.categoryId}
                onChange={(e) => setForm((f: any) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {catOptions.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input placeholder="Brand (e.g., Apple)" value={form.brand} onChange={(e) => setForm((f: any) => ({ ...f, brand: e.target.value }))} />
              <div className="sm:col-span-2">
                <Input placeholder="Product title" value={form.title} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
              </div>
              <Input placeholder="Model number (optional)" value={form.modelNumber} onChange={(e) => setForm((f: any) => ({ ...f, modelNumber: e.target.value }))} />
              <div className="space-y-1">
                <Input
                  placeholder="SKU (optional; auto-generated if short)"
                  value={form.sku}
                  onChange={(e) => setForm((f: any) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                />
                {skuTooShort && <div className="text-xs text-muted-foreground">SKU is too short — it will be auto-generated on create.</div>}
              </div>
              <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))} />
              <Input type="number" placeholder="MRP (optional)" value={form.mrp} onChange={(e) => setForm((f: any) => ({ ...f, mrp: e.target.value }))} />
              <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f: any) => ({ ...f, stock: e.target.value }))} />
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card/30 px-3 py-2 text-sm sm:col-span-2 backdrop-blur">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UploadCloud className="h-4 w-4" />
                  {imageFile ? imageFile.name : "Upload product image (optional)"}
                </span>
                <input className="hidden" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <Button className="mt-3 w-full" disabled={!canCreate || create.isPending} onClick={() => create.mutate()}>
              Create
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {approvalError && (
        <Card>
          <CardContent>
            <div className="text-sm font-semibold">Approval pending</div>
            <div className="mt-1 text-sm text-muted-foreground">An admin must approve your vendor account before you can list products.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {(productsQ.data ?? []).map((p: any) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-semibold">{p.title}</div>
                <div className="text-sm text-muted-foreground">
                  {p.brand} • ₹{p.price.toFixed(2)} • SKU {p.inventory?.sku ?? "—"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Stock: {p.inventory?.quantity ?? 0}</Badge>
                <Badge variant="outline">Low: {p.inventory?.lowStockThreshold ?? 0}</Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={del.isPending}
                  onClick={() => {
                    const ok = window.confirm(`Delete “${p.title}”? This will remove it from the marketplace.`);
                    if (!ok) return;
                    del.mutate(p.id);
                  }}
                  className="gap-2"
                  title="Delete product"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!productsQ.isLoading && !(productsQ.data ?? []).length && !approvalError && <div className="text-sm text-muted-foreground">No products yet.</div>}
      </div>
    </div>
  );
}

const CreateProductClientSchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  title: z.string().min(2, "Enter a product title"),
  brand: z.string().min(1, "Enter a brand"),
  modelNumber: z.string().optional(),
  price: z.coerce.number().min(0, "Enter a valid price"),
  mrp: z.coerce.number().optional(),
  sku: z.string().min(3, "SKU must be at least 3 characters").max(160),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more")
});

function prepareCreatePayload(raw: any) {
  const categoryId = String(raw.categoryId ?? "").trim();
  const title = String(raw.title ?? "").trim();
  const brand = String(raw.brand ?? "").trim();
  const modelNumber = String(raw.modelNumber ?? "").trim();
  const price = raw.price;
  const mrp = raw.mrp;
  const stock = raw.stock;
  const skuInput = String(raw.sku ?? "").trim().toUpperCase();
  const sku = skuInput.length >= 3 ? skuInput : generateSku({ brand, title, modelNumber });
  return { categoryId, title, brand, modelNumber: modelNumber || undefined, price, mrp, stock, sku };
}

function generateSku(input: { brand: string; title: string; modelNumber: string }) {
  const base = `${input.brand || "NX"}-${input.modelNumber || input.title || "ITEM"}`.toUpperCase();
  const cleaned = base.replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  const sku = `${cleaned}`.slice(0, 120);
  return `${sku}-${ts.slice(-4)}${suffix}`.slice(0, 160);
}

function extractFirstValidationMessage(details: any): string | null {
  const fe = details?.fieldErrors;
  if (!fe) return null;
  const buckets = [fe.body, fe.query, fe.params].filter(Boolean);
  for (const b of buckets) {
    if (Array.isArray(b) && b.length) return String(b[0]);
    if (typeof b === "object" && b) {
      const vals = Object.values(b).flat();
      const first = (vals as any[]).find((x) => typeof x === "string" && x.length);
      if (first) return String(first);
    }
  }
  const form = details?.formErrors;
  if (Array.isArray(form) && form.length) return String(form[0]);
  return null;
}
