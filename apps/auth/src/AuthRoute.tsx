import type { ReactElement } from "react";

import { ShellLayout } from "@root-solar/layout";
import { client } from "@root-solar/api/client";
import { FlareCard, FlareHero, FlarePageSection } from "@root-solar/flare";

import BeingRegistration from "@root-solar/auth/ui/BeingRegistration";

const AuthHero = (
  <FlareHero
    tone="dark"
    alignment="center"
    title="Register a new being"
    description="Generate key material and complete the root.solar authentication challenge."
  />
);

const AuthRoute = (): ReactElement => {
  const startRegistration = (
    input: Parameters<typeof client.startBeingRegistration.mutate>[0],
  ) => client.startBeingRegistration.mutate(input);
  const completeRegistration = (
    input: Parameters<typeof client.completeBeingRegistration.mutate>[0],
  ) => client.completeBeingRegistration.mutate(input);

  return (
    <ShellLayout hero={AuthHero} activePath="/auth">
      <FlarePageSection maxWidth="48rem" paddingBlock="2.5rem">
        <FlareCard tone="contrast" padding="lg">
          <BeingRegistration
            startRegistration={startRegistration}
            completeRegistration={completeRegistration}
          />
        </FlareCard>
      </FlarePageSection>
    </ShellLayout>
  );
};

export default AuthRoute;
