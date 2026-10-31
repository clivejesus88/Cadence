import { CrownIcon } from 'lucide-react';

interface RankCrownProps {
  rank: number;
  className?: string;
}

export function RankCrown({ rank, className = '' }: RankCrownProps) {
  if (rank !== 1) {
    return <CrownIcon className={className} aria-hidden="true" />;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true">
      <path
        d="M3 7.5 8 11l4-7 4 7 5-3.5-2 11H5l-2-11Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M6 16h12" stroke="#0a0d10" strokeLinecap="round" strokeWidth="1.5" />
      <circle cx="12" cy="11.5" r="1.25" fill="#0a0d10" />
    </svg>
  );
}
