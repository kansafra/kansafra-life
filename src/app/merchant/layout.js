import MerchantGuard from '@/components/MerchantGuard';

export default function MerchantLayout({ children }) {
  return <MerchantGuard>{children}</MerchantGuard>;
}
