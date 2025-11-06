'use client'; import * as React from 'react';
export interface DialogProps{open?:boolean;onOpenChange?:(open:boolean)=>void;children:React.ReactNode;}
export function Dialog({open=true,onOpenChange,children}:DialogProps){
  const ref=React.useRef<HTMLDivElement>(null);
  React.useEffect(()=>{function outside(e:MouseEvent){if(ref.current && !ref.current.contains(e.target as Node)) onOpenChange?.(false);} if(open) document.addEventListener('mousedown',outside); return ()=>document.removeEventListener('mousedown',outside);},[open,onOpenChange]);
  if(!open) return null;
  return (<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div ref={ref} className="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">{children}</div></div>);
}
export function DialogContent({children,className='' }:{children:React.ReactNode;className?:string}){return <div className={`p-4 ${className}`}>{children}</div>}
export function DialogHeader({children}:{children:React.ReactNode}){return <div className="mb-2">{children}</div>}
export function DialogTitle({children}:{children:React.ReactNode}){return <h3 className="text-base font-semibold">{children}</h3>}
export function DialogFooter({children}:{children:React.ReactNode}){return <div className="mt-3 flex justify-end gap-2">{children}</div>}
