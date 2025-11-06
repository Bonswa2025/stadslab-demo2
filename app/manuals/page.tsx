'use client';
import dynamic from 'next/dynamic';
const FrontofficeManuals = dynamic(() => import('@/components/manuals/FrontofficeManuals'), { ssr: false });
export default function Page(){ return <FrontofficeManuals/> }
