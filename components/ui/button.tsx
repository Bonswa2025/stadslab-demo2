'use client'; import * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{variant?:'default'|'outline'|'destructive'|'secondary'|'ghost'|'link';size?:'sm'|'md'|'lg';}
const variantClass={default:'bg-black text-white border-black',outline:'bg-white text-slate-800 border-slate-300',destructive:'bg-red-600 text-white border-red-700',secondary:'bg-slate-100 text-slate-900 border-slate-200',ghost:'bg-transparent text-slate-800 border-transparent',link:'bg-transparent text-blue-600 underline border-transparent'} as const;
const sizeClass={sm:'px-2 py-1 text-xs',md:'px-3 py-1.5 text-sm',lg:'px-4 py-2 text-base'} as const;
export function Button({className='',variant='default',size='md',...props}:ButtonProps){return <button className={`inline-flex items-center justify-center rounded-md border shadow-sm ${variantClass[variant]} ${sizeClass[size]} ${className}`} {...props}/>}; export default Button;
