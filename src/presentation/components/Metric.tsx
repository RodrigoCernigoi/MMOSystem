import type { ReactNode } from "react";

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: number;
};

export const Metric = ({ icon, label, value }: MetricProps) => (
  <div className="metric">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
