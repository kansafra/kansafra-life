'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import SectionForm from '@/components/SectionForm';
export default function Page() { return <SectionForm sectionKey="expat" />; }
