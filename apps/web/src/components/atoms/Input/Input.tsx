import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type InputProps = TextFieldProps & {
  errorMessage?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ errorMessage, error, helperText, ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        error={error || !!errorMessage}
        helperText={errorMessage || helperText}
        fullWidth
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
