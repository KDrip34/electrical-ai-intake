export type ServiceType =
  | "panel_upgrade"
  | "subpanel"
  | "ev_charger"
  | "whole_house_rewiring"
  | "adu"
  | "other";

export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "panel_upgrade", label: "Panel upgrade" },
  { value: "subpanel", label: "Subpanel installation" },
  { value: "ev_charger", label: "EV charger installation" },
  { value: "whole_house_rewiring", label: "Whole-house rewiring" },
  { value: "adu", label: "ADU electrical" },
  { value: "other", label: "Something else" },
];
