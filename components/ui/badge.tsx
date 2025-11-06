import * as React from 'react';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>{variant?:'default'|'secondary'|'destructive'|'outline'}
const styles={default:'bg-slate-900 text-white border-slate-900',secondary:'bg-slate-100 text-slate-900 border-slate-200',destructive:'bg-red-600 text-white border-red-700',outline:'bg-transparent text-slate-900 border-slate-300'} as const;
export function Badge({className='',variant='default',children,...props}:BadgeProps){return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[variant]} ${className}`} {...props}>{children}</span>}
export default Badge;
