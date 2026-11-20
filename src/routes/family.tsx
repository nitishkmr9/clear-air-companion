import { createFileRoute } from "@tanstack/react-router";
import { Plus, UserPlus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/AppShell";
import { MemberCard } from "@/components/family/MemberCard";
import { MemberDialog } from "@/components/family/MemberDialog";
import { Button } from "@/components/ui/button";
import { blankMember, upsertMember, type Member } from "@/lib/family";
import { familyStore } from "@/lib/store";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family profiles — BreatheEasy" },
      {
        name: "description",
        content:
          "Add children, elders and runners with their daily routines for air advice tailored to each person.",
      },
      { property: "og:title", content: "Family profiles — BreatheEasy" },
      {
        property: "og:description",
        content: "Tailored clean-air advice for every member of your family.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const family = familyStore.use();
  const [editing, setEditing] = useState<Member | null>(null);
  const startNew = () => setEditing(blankMember());

  const save = (m: Member) => {
    familyStore.set((prev) => upsertMember(prev, m));
    setEditing(null);
  };
  const remove = (id: string) => familyStore.set((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <PageHeader
        eyebrow="Family profiles"
        title={
          <>
            Everyone breathes <em className="text-primary">a little differently</em>
          </>
        }
        description="Tell us who's at home and what their days look like. Advice, planning and chat answers adapt to each person."
        action={
          <Button variant="hero" size="lg" onClick={startNew}>
            <UserPlus /> Add a member
          </Button>
        }
      />

      {family.length === 0 ? (
        <div className="surface flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex gap-2 text-4xl" aria-hidden>
            🧒 👵 🏃
          </div>
          <h2 className="font-display text-3xl">Start with someone you care about</h2>
          <p className="max-w-md text-muted-foreground">
            Children, elders, runners and anyone with asthma each get their own comfort threshold
            and clean-air windows.
          </p>
          <Button variant="soft" onClick={startNew}>
            <Plus /> Add first member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {family.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onEdit={() => setEditing(m)}
              onRemove={() => remove(m.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <MemberDialog
          member={editing}
          isNew={!family.some((p) => p.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
