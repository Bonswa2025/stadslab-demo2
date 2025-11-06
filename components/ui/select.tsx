'use client'; import * as React from 'react';
export function Select({ value, onValueChange, children }:{ value?:string; onValueChange?:(v:string)=>void; children:React.ReactNode }){ return <div data-select data-value={value}>{children}</div>; }
export function SelectTrigger({ children, className='' }:{ children:React.ReactNode; className?:string }){ return <div className={`inline-flex items-center justify-between rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white ${className}`}>{children}</div>; }
export function SelectValue({ placeholder }:{ placeholder?:string }){ return <span>{placeholder}</span>; }
export function SelectContent({ children }:{ children:React.ReactNode }){ return <div className="mt-2 rounded-md border bg-white p-2 shadow">{children}</div>; }
export function SelectItem({ value, children }:{ value:string; children:React.ReactNode }){ return <div className="px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer" data-value={value}>{children}</div>; }
