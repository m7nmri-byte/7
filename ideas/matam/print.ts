"use client";

import type { Order, Settings } from "./types";
import { money, timeOf } from "./format";
import { TYPE_LABEL } from "./status";

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

/**
 * إيصال بعرض ٨٠ ملّيمترًا — مقاس طابعات الإيصالات الحرارية.
 * يُفتح في نافذة منفصلة فلا تتأثّر صفحة التطبيق بأنماط الطباعة.
 */
export function printOrder(order: Order, settings: Settings | null, kind: "kitchen" | "receipt") {
  const rows = order.items
    .map((it) => {
      const opts = it.options
        .map((o) => `<div class="opt">${esc(o.group_name)}: ${esc(o.names.join("، "))}</div>`)
        .join("");
      const note = it.note ? `<div class="note">${esc(it.note)}</div>` : "";
      const price =
        kind === "receipt"
          ? `<td class="num">${esc(money(it.price * it.quantity))}</td>`
          : "";
      return `<tr>
        <td class="qty">${it.quantity}</td>
        <td><b>${esc(it.name)}</b>${opts}${note}</td>
        ${price}
      </tr>`;
    })
    .join("");

  const totals =
    kind === "receipt"
      ? `<table class="totals">
          <tr><td>المجموع</td><td class="num">${esc(money(order.subtotal))}</td></tr>
          <tr><td>التوصيل</td><td class="num">${esc(money(order.delivery_fee))}</td></tr>
          <tr class="grand"><td>الإجمالي</td><td class="num">${esc(money(order.total))}</td></tr>
        </table>`
      : "";

  const address =
    kind === "receipt" && order.delivery_address
      ? `<div class="block"><b>العنوان</b><div>${esc(order.delivery_address)}</div></div>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>طلب ${order.order_number}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font: 13px/1.5 system-ui, "Segoe UI", sans-serif; margin: 0; color: #000; }
  h1 { font-size: 15px; margin: 0 0 2px; }
  .muted { color: #555; font-size: 11px; }
  .num-big { font-size: 26px; font-weight: 700; letter-spacing: .04em; }
  hr { border: 0; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  .qty { width: 26px; font-weight: 700; }
  .num { text-align: left; white-space: nowrap; }
  .opt { font-size: 11px; color: #444; }
  .note { font-size: 11px; font-weight: 700; }
  .totals { margin-top: 6px; border-top: 1px solid #000; padding-top: 6px; }
  .grand td { font-weight: 700; font-size: 15px; padding-top: 4px; }
  .block { margin-top: 8px; font-size: 12px; }
</style></head>
<body>
  <h1>${esc(settings?.restaurant_name || "المطعم")}</h1>
  <div class="muted">${kind === "kitchen" ? "إيصال المطبخ" : "فاتورة الزبون"}</div>
  <hr>
  <div class="num-big">#${order.order_number}</div>
  <div class="muted">${esc(TYPE_LABEL[order.order_type])} · ${esc(timeOf(order.created_at))}</div>
  <hr>
  <table>${rows}</table>
  ${totals}
  ${order.notes ? `<div class="block"><b>ملاحظات</b><div>${esc(order.notes)}</div></div>` : ""}
  ${address}
  <hr>
  <div class="muted">${esc(order.customer_name)} · ${esc(order.customer_phone)}</div>
</body></html>`;

  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  // ننتظر رسم المحتوى قبل استدعاء الطباعة وإلا طُبعت صفحة فارغة
  setTimeout(() => {
    w.print();
    w.close();
  }, 350);
  return true;
}
