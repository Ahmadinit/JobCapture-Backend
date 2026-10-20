const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const make = children => props => <svg {...base} {...props}>{children}</svg>;

export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const CloseIcon = make(<path d="M18 6L6 18M6 6l12 12" />);
export const ChevronRightIcon = make(<path d="M9 6l6 6-6 6" />);
export const FilterIcon = make(<path d="M4 6h16M7 12h10M10 18h4" />);
export const PinIcon = make(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const BriefcaseIcon = make(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>);
export const ClockIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const AlertIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>);
export const InboxIcon = make(<><path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /><path d="M3 13h5l1 3h6l1-3h5" /></>);
export const ExternalIcon = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const MailIcon = make(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>);
