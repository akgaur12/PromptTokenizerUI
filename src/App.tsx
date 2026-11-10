import { TokenizerPage } from "@/pages/TokenizerPage";
import { PiiPage } from "@/pages/PiiPage";
import { ScanPage } from "@/pages/ScanPage";
import { CompressPage } from "@/pages/CompressPage";
import { ComparePage } from "@/pages/ComparePage";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useCompareSession } from "@/hooks/useCompareSession";

export default function App() {
  const route = useHashRoute();
  // Compare state is hoisted here so it survives navigating away and back —
  // <App> stays mounted across hash-route changes, the pages don't.
  const compareSession = useCompareSession();

  let page: JSX.Element;
  if (route.startsWith("/pii")) page = <PiiPage />;
  else if (route.startsWith("/scan")) page = <ScanPage />;
  else if (route.startsWith("/compress")) page = <CompressPage />;
  else if (route.startsWith("/compare")) page = <ComparePage session={compareSession} />;
  else page = <TokenizerPage />;

  return page;
}
