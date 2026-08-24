declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Camera: LucideIcon;
  export const Calendar: LucideIcon;
  export const Clock: LucideIcon;
  export const MapPin: LucideIcon;
  export const Phone: LucideIcon;
  export const Search: LucideIcon;
  export const Share2: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Sparkles: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const FileText: LucideIcon;
  export const X: LucideIcon;
  export const Upload: LucideIcon;
  export const Info: LucideIcon;
  export const ShieldAlert: LucideIcon;
}
