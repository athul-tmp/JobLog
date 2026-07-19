import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

const WAKING_UP_DELAY_MS = 3500;
const WAKING_UP_MESSAGE = "Waking up the server...";

function useWakingUpMessage(isActive: boolean) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowMessage(false);
      return;
    }

    const timer = setTimeout(() => setShowMessage(true), WAKING_UP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isActive]);

  return showMessage ? WAKING_UP_MESSAGE : null;
}

export function LoadingScreen() {
  const message = useWakingUpMessage(true);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground gap-4">
      <Spinner className="size-15" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export function WakingUpMessage({ isActive }: { isActive: boolean }) {
  const message = useWakingUpMessage(isActive);

  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-center text-muted-foreground">{message}</p>
  );
}
