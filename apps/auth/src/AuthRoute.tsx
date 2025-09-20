import type { ReactElement } from "react";

import { ShellLayout } from "@root-solar/layout";
import { client } from "@root-solar/api/client";

import styles from "./App.module.scss";

import BeingRegistration from "@root-solar/auth/ui/BeingRegistration";

const AuthHero = () => (
  <div className={styles.hero}>
    <h1>Register a new being</h1>
    <p>
      Generate key material and complete the root.solar authentication
      challenge.
    </p>
  </div>
);

const AuthRoute = (): ReactElement => {
  const startRegistration = (
    input: Parameters<typeof client.startBeingRegistration.mutate>[0],
  ) => client.startBeingRegistration.mutate(input);
  const completeRegistration = (
    input: Parameters<typeof client.completeBeingRegistration.mutate>[0],
  ) => client.completeBeingRegistration.mutate(input);

  return (
    <ShellLayout hero={<AuthHero />} activePath="/auth">
      <section className={styles.panel}>
        <BeingRegistration
          startRegistration={startRegistration}
          completeRegistration={completeRegistration}
        />
      </section>
    </ShellLayout>
  );
};

export default AuthRoute;
