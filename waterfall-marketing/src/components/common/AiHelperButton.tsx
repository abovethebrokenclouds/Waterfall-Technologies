/**
 * AiHelperButton — the inline "Improve this" / "Fix this" helper that appears
 * next to text fields throughout the app. It runs the `improve-text` skill with
 * the current brand/product context and hands the rewritten text back via
 * `onResult`. This is the building block for the "self-repairable by AI" UX.
 */
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { skills } from "@/ai";
import { useSkillContext } from "@/store/AppStore";

interface AiHelperButtonProps {
  /** The current text to improve. */
  text: string;
  /** Called with the improved text. */
  onResult: (improved: string) => void;
  /** Optional instruction, e.g. "Make it punchier" or "Fix grammar". */
  instruction?: string;
  label?: string;
  size?: "sm" | "icon";
}

export function AiHelperButton({ text, onResult, instruction, label = "Improve", size = "sm" }: AiHelperButtonProps) {
  const ctx = useSkillContext();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!text.trim()) {
      toast.info("Add some text first, then let AI improve it.");
      return;
    }
    setLoading(true);
    try {
      const { improved } = await skills.improveText.run({ text, instruction }, ctx);
      onResult(improved);
      toast.success("Updated with AI");
    } catch {
      toast.error("Could not improve the text. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size={size === "icon" ? "icon" : "sm"} onClick={handleClick} disabled={loading} title="Improve this with AI">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {size !== "icon" && <span className="ml-1.5">{label}</span>}
    </Button>
  );
}
