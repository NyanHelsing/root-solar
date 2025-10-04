import { useMemo, type ReactElement } from "react";
import { useAtomValue } from "jotai";

import { ShellLayout } from "@root-solar/layout";
import { client } from "@root-solar/api/client";
import { FlareCard, FlareHero, FlarePageSection } from "@root-solar/flare";

import BeingRegistration from "@root-solar/auth/ui/BeingRegistration";
import { beingSessionAtom } from "@root-solar/auth";
import type { RootSolarSession } from "@root-solar/layout";

const AuthHero = (
    <FlareHero
        tone="dark"
        alignment="center"
        title="Access the commons"
        description="Import your credentials to sign in, or register a new being to generate fresh keys."
    />
);

const AuthRoute = (): ReactElement => {
    const storedSession = useAtomValue(beingSessionAtom);

    const headerSession = useMemo<RootSolarSession | null>(() => {
        if (!storedSession) {
            return null;
        }
        return {
            name: storedSession.being.name ?? storedSession.being.id,
            profileHref: "/auth",
        };
    }, [storedSession]);

    const startRegistration = (input: Parameters<typeof client.startBeingRegistration.mutate>[0]) =>
        client.startBeingRegistration.mutate(input);
    const completeRegistration = (
        input: Parameters<typeof client.completeBeingRegistration.mutate>[0],
    ) => client.completeBeingRegistration.mutate(input);

    return (
        <ShellLayout hero={AuthHero} activePath="/auth" session={headerSession}>
            <FlarePageSection maxWidth="54rem" paddingBlock="2.5rem">
                <FlareCard padding="lg">
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
