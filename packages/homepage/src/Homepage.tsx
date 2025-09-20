import { type ReactNode } from "react";
import { useNavigate } from "react-router";

import {
  FlareButton,
  FlareCard,
  FlareList,
  FlarePageSection,
  FlareStack,
} from "@root-solar/flare";
import {
  RootSolarHero,
  ShellLayout,
  type RootSolarHeaderProps,
  type RootSolarNavLink,
  type RootSolarSession,
} from "@root-solar/layout";

const heroBackground = new URL("../../../assets/milkyway.jpg", import.meta.url).href;

const motivations = [
  {
    title: "Stop silent fragmentation",
    description:
      "Capture the principles you live by so decisions aren't made for your community while you're not in the room.",
  },
  {
    title: "Make integrity visible",
    description:
      "Translate gut-level intuition into shared operating axioms, so collaborators can trust the intent behind your actions.",
  },
  {
    title: "Give future beings a foothold",
    description:
      "Archive agreements and tradeoffs in one canonical commons, giving tomorrow's stewards a map instead of scattered anecdotes.",
  },
] as const;

const mechanics = [
  {
    id: "capture",
    title: "Capture priorities",
    description:
      "Log the principles shaping your projects, weight their urgency, and see how they offset with the collective.",
  },
  {
    id: "align",
    title: "Align in the open",
    description:
      "Point collaborators to a transparent ledger of intent so negotiations start with context instead of suspicion.",
  },
  {
    id: "anchor",
    title: "Anchor decisions",
    description:
      "Tie commitments to shared axioms, creating receipts that travel with every deployment, handoff, or policy.",
  },
];

const HomepageHero = ({ session }: { session: RootSolarSession | null | undefined }) => {
  const navigate = useNavigate();
  const primaryAction = session ? () => navigate("/axioms") : () => navigate("/auth");
  const primaryLabel = session ? "Return to your commons" : "Enter the commons";

  return (
    <RootSolarHero
      title="Life shares a common root."
      description="Root your work in transparent principles so every being—human or autonomous—can coordinate with shared intent."
      eyebrow="Open canon for shared stewardship"
      alignment="start"
      backgroundImage={heroBackground}
      actions={
        <FlareStack direction="row" gap="sm" wrap>
          <FlareButton onClick={primaryAction}>{primaryLabel}</FlareButton>
          <FlareButton variant="ghost" onClick={() => navigate("/auth")}>See the ledger</FlareButton>
        </FlareStack>
      }
    />
  );
};

const SeismicShiftSection = () => (
  <FlarePageSection id="why" paddingBlock="4rem">
    <FlareStack gap="lg">
      <FlareStack gap="sm">
        <h2 className="rs-heading-lg">Why this matters now</h2>
        <p className="rs-text-body-lg rs-text-soft">
          root.solar exists because we are tired of watching thoughtful beings burn out while rushed choices set the tone
          for entire ecosystems. By writing our operating principles into a shared canon, nobody has to wonder if the next
          launch or policy quietly contradicts the very reasons we showed up.
        </p>
      </FlareStack>
      <FlareStack direction="row" gap="md" wrap>
        {motivations.map((item) => (
          <FlareCard key={item.title} tone="muted" padding="lg" style={{ flex: "1 1 18rem" }}>
            <FlareStack gap="sm">
              <h3 className="rs-heading-md">{item.title}</h3>
              <p className="rs-text-soft">{item.description}</p>
            </FlareStack>
          </FlareCard>
        ))}
      </FlareStack>
    </FlareStack>
  </FlarePageSection>
);

const MechanicsSection = () => (
  <FlarePageSection paddingBlock="4rem">
    <FlareStack gap="lg">
      <FlareStack gap="sm">
        <h2 className="rs-heading-lg">What you will do inside</h2>
        <p className="rs-text-soft">
          The platform is simple on purpose: every interaction is designed to reduce cognitive load while amplifying shared
          intent.
        </p>
      </FlareStack>
      <FlareList
        items={mechanics.map((mechanic) => ({
          id: mechanic.id,
          title: mechanic.title,
          description: mechanic.description,
        }))}
        variant="surface"
      />
    </FlareStack>
  </FlarePageSection>
);

const CallToActionSection = ({ session }: { session: RootSolarSession | null | undefined }) => {
  const navigate = useNavigate();

  const primaryAction = session ? () => navigate("/axioms") : () => navigate("/auth");
  const primaryLabel = session ? "Return to your commons" : "Enter the commons";
  const secondaryAction = () => {
    if (typeof window === "undefined") {
      return;
    }
    const element = document.getElementById("why");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <FlarePageSection paddingBlock="4rem">
      <FlareStack gap="md" align="center">
        <h2 className="rs-heading-lg">Ready to steady the orbit?</h2>
        <p className="rs-text-soft" style={{ maxWidth: "48ch", textAlign: "center" }}>
          Spend ten focused minutes capturing what you refuse to compromise on. Future decisions—yours and ours—will thank you.
        </p>
        <FlareStack direction="row" gap="md" align="center" wrap justify="center">
          <FlareButton onClick={primaryAction}>{primaryLabel}</FlareButton>
          <FlareButton variant="ghost" onClick={secondaryAction}>
            See how it helps
          </FlareButton>
        </FlareStack>
      </FlareStack>
    </FlarePageSection>
  );
};

const FooterSpacer = () => (
  <FlarePageSection paddingBlock="2rem">
    <FlareStack gap="sm" align="center">
      <p className="rs-text-soft" style={{ textAlign: "center", maxWidth: "52ch" }}>
        Every principle committed to root.solar is a signal that we intend to steward life together rather than manage it alone.
      </p>
    </FlareStack>
  </FlarePageSection>
);

export interface RootSolarHomepageProps {
  session?: RootSolarSession | null;
  loginHref?: string;
  navLinks?: RootSolarNavLink[];
  headerActions?: RootSolarHeaderProps["actions"];
}

const RootSolarHomepage = ({
  session = null,
  loginHref = "/auth",
  navLinks,
  headerActions,
}: RootSolarHomepageProps) => {
  return (
    <ShellLayout
      activePath="/"
      hero={<HomepageHero session={session} />}
      session={session}
      loginHref={loginHref}
      navLinks={navLinks}
      headerActions={headerActions}
      mainPaddingBlock="0"
      mainMaxWidth="100%"
    >
      <FlareStack gap="0">
        <SeismicShiftSection />
        <MechanicsSection />
        <CallToActionSection session={session} />
        <FooterSpacer />
      </FlareStack>
    </ShellLayout>
  );
};

export default RootSolarHomepage;
