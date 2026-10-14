import { Check, ChefHat, Clock, CreditCard, PackageCheck, Utensils } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = [Clock, CreditCard, ChefHat, PackageCheck, Utensils];

export function StatusBadge({ status, testid }: { status: OrderStatus; testid?: string }) {
  return (
    <span
      data-testid={testid}
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1", STATUS_STYLE[status])}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusStepper({ status }: { status: OrderStatus }) {
  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-0" data-testid="order-tracking-status-stepper">
      {STATUS_FLOW.map((s, i) => {
        const Icon = ICONS[i];
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="relative flex items-center gap-3 sm:flex-col sm:text-center" data-testid={`stepper-step-${s}`} data-state={done ? "done" : active ? "active" : "todo"}>
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={cn(
                  "absolute left-[1.35rem] top-11 h-[calc(100%-1.5rem)] w-1 rounded-full sm:left-[calc(50%+1.6rem)] sm:top-[1.3rem] sm:h-1 sm:w-[calc(100%-3.2rem)]",
                  done ? "bg-brand-red" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-4 transition-colors duration-300",
                done && "border-brand-red bg-brand-red text-white",
                active && "ks-pulse-ring border-brand-yellow bg-brand-red text-white",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
            </span>
            <span className={cn("text-sm font-semibold sm:mt-2 sm:px-1", active ? "text-brand-red" : done ? "text-foreground" : "text-muted-foreground")}>
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
