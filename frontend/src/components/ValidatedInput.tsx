/**
 * ValidatedInput
 * Reusable input component with built-in validation for:
 *   - 'aadhaar'  → numbers only, exactly 12 digits
 *   - 'phone'    → numbers only, exactly 10 digits
 *   - 'text'     → plain text
 *   - 'number'   → numeric
 *
 * Displays an inline validation message and passes validity state
 * to the parent via `onValidChange`.
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

type InputVariant = 'aadhaar' | 'phone' | 'text' | 'number';

interface ValidatedInputProps {
  variant?: InputVariant;
  value: string;
  onChange: (val: string) => void;
  onValidChange?: (valid: boolean) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

function applyMask(variant: InputVariant, raw: string): string {
  if (variant === 'aadhaar') return raw.replace(/\D/g, '').slice(0, 12);
  if (variant === 'phone')   return raw.replace(/\D/g, '').slice(0, 10);
  return raw;
}

function validate(variant: InputVariant, val: string): boolean {
  if (variant === 'aadhaar') return /^\d{12}$/.test(val);
  if (variant === 'phone')   return /^\d{10}$/.test(val);
  if (variant === 'number')  return !isNaN(parseFloat(val)) && val.trim() !== '';
  return val.trim().length > 0;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  variant = 'text',
  value,
  onChange,
  onValidChange,
  placeholder,
  autoFocus,
  disabled,
  className = '',
}) => {
  const { t } = useLang();
  // Only show validation feedback after the user has touched the field
  const [touched, setTouched] = useState(false);

  const isValid = validate(variant, value);
  const showError = touched && !isValid && value.length > 0;
  const showSuccess = touched && isValid;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(variant, e.target.value);
      onChange(masked);
      onValidChange?.(validate(variant, masked));
    },
    [variant, onChange, onValidChange],
  );

  const handleBlur = () => setTouched(true);

  const getErrorMsg = () => {
    if (variant === 'aadhaar') return t.invalidAadhaar;
    if (variant === 'phone')   return t.invalidPhone;
    if (variant === 'number')  return t.invalidNumber;
    return t.fieldRequired;
  };

  const getSuccessMsg = () => {
    if (variant === 'aadhaar') return t.validAadhaar;
    if (variant === 'phone')   return t.validPhone;
    return '';
  };

  const inputType = variant === 'number' ? 'number' : 'text';
  // Use inputmode for mobile numeric keyboards
  const inputMode =
    variant === 'aadhaar' || variant === 'phone' || variant === 'number'
      ? 'numeric'
      : 'text';

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <motion.input
          type={inputType}
          inputMode={inputMode}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={showError}
          whileFocus={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
          className={`input pr-9 transition-all ${
            showError   ? 'border-danger/60 focus:border-danger/80 focus:ring-danger/20' :
            showSuccess ? 'border-success/40 focus:border-success/60 focus:ring-success/10' :
            ''
          } ${className}`}
        />

        {/* Inline status icon */}
        <AnimatePresence>
          {showSuccess && (
            <motion.span
              key="ok"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
            </motion.span>
          )}
          {showError && (
            <motion.span
              key="err"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-danger pointer-events-none"
            >
              <AlertCircle className="h-4 w-4" strokeWidth={1.8} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {showError && (
          <motion.p
            key="error-msg"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-[12px] text-danger"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {getErrorMsg()}
          </motion.p>
        )}
        {showSuccess && getSuccessMsg() && (
          <motion.p
            key="success-msg"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-[12px] text-success"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {getSuccessMsg()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ValidatedInput;
