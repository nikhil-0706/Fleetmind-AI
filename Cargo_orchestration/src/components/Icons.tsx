// Minimal SVG icon set
type IconProps = { className?: string };
const I = (children: React.ReactNode, vb = "0 0 24 24") => (props: IconProps) => (
  <svg
    viewBox={vb}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || "h-4 w-4"}
  >
    {children}
  </svg>
);

export const TruckIcon = I(<>
  <path d="M3 7h11v9H3z" />
  <path d="M14 10h4l3 3v3h-7" />
  <circle cx="7" cy="18" r="2" />
  <circle cx="17" cy="18" r="2" />
</>);

export const PackageIcon = I(<>
  <path d="M21 8L12 3 3 8v8l9 5 9-5V8z" />
  <path d="M3 8l9 5 9-5" />
  <path d="M12 13v8" />
</>);

export const RouteIcon = I(<>
  <circle cx="6" cy="19" r="2" />
  <circle cx="18" cy="5" r="2" />
  <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
</>);

export const LayersIcon = I(<>
  <path d="M12 2l9 5-9 5-9-5 9-5z" />
  <path d="M3 12l9 5 9-5" />
  <path d="M3 17l9 5 9-5" />
</>);

export const ActivityIcon = I(<>
  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
</>);

export const PlusIcon = I(<>
  <path d="M12 5v14M5 12h14" />
</>);

export const CheckIcon = I(<>
  <path d="M20 6L9 17l-5-5" />
</>);

export const ChevronIcon = I(<>
  <path d="M9 18l6-6-6-6" />
</>);

export const ChevronDownIcon = I(<>
  <path d="M6 9l6 6 6-6" />
</>);

export const SearchIcon = I(<>
  <circle cx="11" cy="11" r="7" />
  <path d="M21 21l-4.35-4.35" />
</>);

export const FilterIcon = I(<>
  <path d="M3 4h18l-7 9v7l-4-2v-5L3 4z" />
</>);

export const MapPinIcon = I(<>
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
  <circle cx="12" cy="10" r="3" />
</>);

export const ClockIcon = I(<>
  <circle cx="12" cy="12" r="9" />
  <path d="M12 7v5l3 2" />
</>);

export const DollarIcon = I(<>
  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
</>);

export const BoxIcon = I(<>
  <path d="M21 8l-9-5-9 5 9 5 9-5z" />
  <path d="M3 8v8l9 5 9-5V8" />
</>);

export const StarIcon = I(<>
  <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
</>);

export const AlertIcon = I(<>
  <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
  <path d="M12 9v4M12 17h.01" />
</>);

export const SnowflakeIcon = I(<>
  <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
</>);

export const FireIcon = I(<>
  <path d="M12 2c0 6-6 7-6 12a6 6 0 0 0 12 0c0-2-1-3-2-4 0 2-2 3-2 1 0-3 2-5-2-9z" />
</>);

export const ShieldIcon = I(<>
  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
</>);

export const XIcon = I(<>
  <path d="M18 6L6 18M6 6l12 12" />
</>);

export const ArrowRightIcon = I(<>
  <path d="M5 12h14M12 5l7 7-7 7" />
</>);

export const SparkleIcon = I(<>
  <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
</>);

export const MergeIcon = I(<>
  <path d="M8 3v4a4 4 0 0 0 4 4h4" />
  <path d="M4 7l4-4 4 4" />
  <path d="M16 21v-4a4 4 0 0 0-4-4H8" />
  <path d="M20 17l-4 4-4-4" />
</>);

export const NetworkIcon = I(<>
  <circle cx="12" cy="5" r="2" />
  <circle cx="5" cy="19" r="2" />
  <circle cx="19" cy="19" r="2" />
  <path d="M12 7v4M12 11l-6 6M12 11l6 6" />
</>);
