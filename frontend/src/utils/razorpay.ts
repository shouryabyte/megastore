export async function loadRazorpay() {
  if ((window as any).Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
  return true;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

