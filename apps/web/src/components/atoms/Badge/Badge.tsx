import MuiBadge, { type BadgeProps as MuiBadgeProps } from '@mui/material/Badge';

type BadgeProps = MuiBadgeProps;

export default function Badge({ children, ...props }: BadgeProps) {
  return <MuiBadge {...props}>{children}</MuiBadge>;
}
