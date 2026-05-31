import { useCallback, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
  /** Toast message shown on success. Pass null to suppress the toast. */
  toastMessage?: string | null;
}

/** Button that copies `value` to the clipboard and flashes a check icon. */
export function CopyButton({
  value,
  label,
  toastMessage = "Copied to clipboard",
  variant = "outline",
  size = "sm",
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (toastMessage) toast.success(toastMessage);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Couldn't copy to clipboard");
    }
  }, [value, toastMessage]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(className)}
      {...props}
    >
      {copied ? (
        <Check className="text-success" />
      ) : (
        <Copy />
      )}
      {children ?? label}
    </Button>
  );
}
