import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline', // I'll add outline to index.css if needed
    };

    return (
        <button className={`${variants[variant] || variants.primary} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
