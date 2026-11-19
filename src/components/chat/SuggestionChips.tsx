import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Ready-made questions as tappable chips; they wrap so none are hidden on phones. */
export function SuggestionChips({
  questions,
  onPick,
  className,
}: {
  questions: readonly string[];
  onPick: (question: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {questions.map((q) => (
        <Button
          key={q}
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPick(q)}
          className="h-auto whitespace-normal rounded-full bg-card px-4 py-2 text-left"
        >
          {q}
        </Button>
      ))}
    </div>
  );
}
