import { forwardRef } from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface ButtonProps extends MuiButtonProps {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, startIcon, ...props }, ref) => {
    return (
      <MuiButton
        ref={ref}
        disabled={disabled || isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : startIcon}
        {...props}
      >
        {children}
      </MuiButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
