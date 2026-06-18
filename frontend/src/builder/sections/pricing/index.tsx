"use client";
import type { Section } from "@/shared/types";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  highlighted: boolean;
}

const defaultPlans: PricingPlan[] = [
  { name: "Basic", price: "$9", period: "/mo", features: ["1 User", "10GB Storage", "Email Support"], buttonText: "Get Started", highlighted: false },
  { name: "Pro", price: "$29", period: "/mo", features: ["5 Users", "100GB Storage", "Priority Support", "API Access"], buttonText: "Get Started", highlighted: true },
  { name: "Enterprise", price: "$99", period: "/mo", features: ["Unlimited Users", "1TB Storage", "24/7 Support", "API Access", "Custom Integrations"], buttonText: "Contact Sales", highlighted: false },
];

export function PricingPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const plans = (section.settings.plans as PricingPlan[]) || defaultPlans;

  return (
    <div className="py-10 px-6">
      {title && <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`flex flex-col rounded-lg border p-6 ${plan.highlighted ? "scale-105 shadow-lg" : ""}`}
            style={{
              borderColor: plan.highlighted ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: plan.highlighted ? "var(--color-primary)" : "var(--color-surface)",
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: plan.highlighted ? "#ffffff" : "var(--color-text)" }}>{plan.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold" style={{ color: plan.highlighted ? "#ffffff" : "var(--color-text)" }}>{plan.price}</span>
              <span className="text-sm" style={{ color: plan.highlighted ? "rgba(255,255,255,0.7)" : "var(--color-text-secondary)" }}>{plan.period}</span>
            </div>
            <ul className="mb-6 flex-1 space-y-2">
              {(plan.features || []).map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm" style={{ color: plan.highlighted ? "#ffffff" : "var(--color-text)" }}>
                  <span style={{ color: plan.highlighted ? "#ffffff" : "var(--color-primary)" }}>&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="rounded-lg px-6 py-3 font-medium"
              style={{
                backgroundColor: plan.highlighted ? "#ffffff" : "var(--color-primary)",
                color: plan.highlighted ? "var(--color-primary)" : "#ffffff",
              }}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
