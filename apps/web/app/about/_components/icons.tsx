import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function AirplaneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M62 32c0 1.1-.9 2-2 2H40l-8 14h-6l4-14H16l-6 8H4l4-10-4-10h6l6 8h14l-4-14h6l8 14h20c1.1 0 2 .9 2 2z" />
    </svg>
  );
}

export function SedanIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 32" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 22c0-1.1.9-2 2-2h2l4-8c1-2 3-3 5-3h14c2 0 4 1 5 3l4 8h2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-2a5 5 0 0 1-10 0H22a5 5 0 0 1-10 0H10c-1.1 0-2-.9-2-2v-4z" />
      <circle cx="17" cy="26" r="3" />
      <circle cx="47" cy="26" r="3" />
    </svg>
  );
}

export function SuvIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 32" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 22c0-1.1.9-2 2-2h3l3-9c1-2.5 3.2-4 5.8-4h20.4c2.6 0 4.8 1.5 5.8 4l3 9h3c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-2a5 5 0 0 1-10 0H20a5 5 0 0 1-10 0H8c-1.1 0-2-.9-2-2v-5z" />
      <circle cx="18" cy="27" r="3.2" />
      <circle cx="46" cy="27" r="3.2" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="6" r="4" />
      <path d="M12 12c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" opacity="0.18" />
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm0 2.2 6 2.25v4.55c0 3.9-2.6 7.4-6 8.83-3.4-1.43-6-4.93-6-8.83V6.45L12 4.2z" />
      <path d="m10.6 15.2-3-3 1.4-1.4 1.6 1.6 4.4-4.4 1.4 1.4z" />
    </svg>
  );
}

export function CalendarCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 6v10H5V8h14z" />
      <path d="m10.7 16.2-2.4-2.4 1.4-1.4 1 1 3.2-3.2 1.4 1.4z" />
    </svg>
  );
}

export function BadgeCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 1 9.5 3.5H6v3.5L3.5 9.5 6 12l-2.5 2.5L6 17v3.5h3.5L12 23l2.5-2.5H18V17l2.5-2.5L18 12l2.5-2.5L18 7V3.5h-3.5L12 1z" />
      <path
        d="m9.5 12.3 1.9 1.9 3.6-3.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RouteDashLine(props: IconProps) {
  return (
    <svg
      viewBox="0 0 400 40"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M0 20c60 0 60-16 120-16s60 32 120 32 60-16 120-16 60 0 40 0"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
    </svg>
  );
}
