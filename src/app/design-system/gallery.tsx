"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BottomNav } from "@/components/brand/bottom-nav";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { Field } from "@/components/brand/field";
import { MealCardSkeleton, PageLoading } from "@/components/brand/loading-state";
import { MealCard } from "@/components/brand/meal-card";
import { QuantityStepper } from "@/components/brand/quantity-stepper";
import { SectionHeading } from "@/components/brand/section-heading";
import { SiteHeader } from "@/components/brand/site-header";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  notes: z.string().max(200).optional(),
});

type ContactValues = z.infer<typeof contactSchema>;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="font-heading text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemGallery() {
  const [quantity, setQuantity] = useState(1);
  const [soldOut, setSoldOut] = useState(false);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", notes: "" },
  });

  return (
    <div className="pb-24 md:pb-12">
      <SiteHeader cartCount={2} />
      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-10">
        <SectionHeading
          eyebrow="Phase 1"
          title="Ghana Restaurant design system"
          description="Premium, contemporary, mobile-first. Deep charcoal, warm earth, and gold — not a flag costume."
        />

        <Section id="colour" title="Colour">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Ink / charcoal", "bg-primary text-primary-foreground"],
              ["Parchment", "bg-background text-foreground ring-1 ring-border"],
              ["Gold", "bg-gold text-gold-foreground"],
              ["Earth", "bg-earth text-earth-foreground"],
              ["Forest", "bg-forest text-forest-foreground"],
              ["Sand", "bg-secondary text-secondary-foreground"],
              ["Muted", "bg-muted text-muted-foreground"],
              ["Destructive", "bg-destructive text-white"],
            ].map(([name, classes]) => (
              <div key={name} className={`rounded-xl px-3 py-8 text-sm ${classes}`}>
                {name}
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography">
          <div className="space-y-3">
            <p className="font-heading text-4xl">Real Ghanaian food.</p>
            <p className="text-lg text-muted-foreground">
              Outfit for interface copy. Fraunces for headlines. Order numbers stay tabular.
            </p>
            <p className="font-mono text-sm">GH1048 · 129,00 kr</p>
          </div>
        </Section>

        <Section id="buttons" title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button size="touch">Order today</Button>
            <Button size="touch" variant="outline">
              View menu
            </Button>
            <Button size="touch" variant="gold">
              Gold accent
            </Button>
            <Button size="touch" variant="secondary">
              Secondary
            </Button>
            <Button size="touch" variant="ghost">
              Ghost
            </Button>
            <Button size="touch" variant="destructive">
              Cancel
            </Button>
            <Button size="touch" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        <Section id="badges" title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="gold">Popular</Badge>
            <Badge variant="earth">Spicy</Badge>
            <Badge variant="forest">Halal</Badge>
            <Badge variant="secondary">Sold out</Badge>
            <Badge variant="outline">Vegetarian</Badge>
          </div>
        </Section>

        <Section id="cards" title="Cards">
          <div className="grid gap-4 md:grid-cols-2">
            <MealCard
              name="Jollof Rice"
              description="Smoky tomato rice with your choice of protein."
              priceOre={12900}
              imageAlt="Jollof rice"
              featured
              soldOut={soldOut}
              onAdd={() => toast.success("Jollof added to cart")}
            />
            <Card>
              <CardHeader>
                <CardTitle>How ordering works</CardTitle>
                <CardDescription>Check delivery, choose a meal, pay, track.</CardDescription>
              </CardHeader>
              <CardContent>Kitchen receives the exact modifiers you selected.</CardContent>
              <CardFooter>
                <Button variant="outline" size="touch">
                  Learn more
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Section id="quantity" title="Quantity">
          <div className="flex items-center gap-4">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <Switch
              checked={soldOut}
              onCheckedChange={setSoldOut}
              aria-label="Toggle sold out on meal card"
            />
            <span className="text-sm text-muted-foreground">Sold out preview</span>
          </div>
        </Section>

        <Section id="forms" title="Forms">
          <form
            className="grid max-w-md gap-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              toast.success(`Thanks ${values.name}`);
              form.reset();
            })}
          >
            <Field id="name" label="Name" error={form.formState.errors.name?.message}>
              <Input id="name" autoComplete="name" {...form.register("name")} />
            </Field>
            <Field id="email" label="Email" hint="Used for order updates." error={form.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            </Field>
            <Field id="notes" label="Notes">
              <Textarea id="notes" {...form.register("notes")} />
            </Field>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <Checkbox />
              Save these details for next time
            </label>
            <Button size="touch" type="submit">
              Submit
            </Button>
          </form>
        </Section>

        <Section id="overlays" title="Modal and drawer">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="touch" variant="outline">
                  Open modal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Need help?</DialogTitle>
                  <DialogDescription>This dialog is for order support later.</DialogDescription>
                </DialogHeader>
                <Button size="touch" onClick={() => toast.message("Support request attached")}>
                  Continue
                </Button>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="touch" variant="outline">
                  Open drawer
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>Cart</SheetTitle>
                  <SheetDescription>Sticky mobile cart preview.</SheetDescription>
                </SheetHeader>
                <p className="px-4 pb-8 text-sm text-muted-foreground">1 × Jollof Rice</p>
              </SheetContent>
            </Sheet>
            <Button size="touch" variant="secondary" onClick={() => toast.error("Payment did not go through")}>
              Show toast
            </Button>
          </div>
        </Section>

        <Section id="states" title="Loading, empty, error">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3">
              <PageLoading label="Preparing kitchen board" />
              <MealCardSkeleton />
            </div>
            <EmptyState
              title="Your cart is empty"
              description="Add a meal to start checkout. Guest checkout does not need an account."
              action={
                <Button size="touch" variant="outline">
                  Browse menu
                </Button>
              }
            />
            <ErrorState
              message="We could not reach delivery quotes. Your cart is safe."
              action={
                <Button size="touch" variant="outline">
                  Try again
                </Button>
              }
            />
          </div>
        </Section>
      </main>
      <BottomNav cartCount={2} />
    </div>
  );
}
