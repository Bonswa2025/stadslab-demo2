'use client';
import dynamic from 'next/dynamic';
const StadslabBackoffice = dynamic(() => import('@/components/stadslab/StadslabBackoffice'), { ssr: false });
export default function Page(){ return <StadslabBackoffice/> }
