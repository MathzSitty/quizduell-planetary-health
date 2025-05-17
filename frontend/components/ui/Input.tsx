// frontend/components/ui/Input.tsx
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({
                                         label,
                                         id,
                                         error,
                                         className = '',
                                         wrapperClassName = '',
                                         ...props
                                     }) => {
    return (
        <div className={`mb-4 ${wrapperClassName}`}>
            {label && (
                <label htmlFor={id} className="form-label">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`form-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Input;