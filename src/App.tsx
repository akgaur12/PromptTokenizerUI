import { TokenizerPage } from "@/pages/TokenizerPage";
import { PiiPage } from "@/pages/PiiPage";
import { ScanPage } from "@/pages/ScanPage";
import { ComparePage } from "@/pages/ComparePage";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useCompareSession } from "@/hooks/useCompareSession";

export default function App() {
  const route = useHashRoute();
  // Compare state is hoisted here so it survives navigating away and back —
  // <App> stays mounted across hash-route changes, the pages don't.
  const compareSession = useCompareSession();

  if (route.startsWith("/pii")) return <PiiPage />;
  if (route.startsWith("/scan")) return <ScanPage />;
  return route.startsWith("/compare") ? (
    <ComparePage session={compareSession} />
  ) : (
    <TokenizerPage />
  );
}
