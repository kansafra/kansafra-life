'use client';
import { useMemo } from 'react';
import { barcodeSVG } from '@/lib/barcode';

export default function Barcode({ value, width = 240, height = 60 }) {
  const svg = useMemo(() => barcodeSVG(value, width, height), [value, width, height]);
  if (!value) return null;
  return <div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'inline-block' }} />;
}
