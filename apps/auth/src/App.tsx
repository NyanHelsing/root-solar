import { BeingRegistration } from "@root-solar/auth/ui";
import { client } from "@root-solar/api/client";

import styles from "./App.module.scss";

export const AuthApp = () => {
  const startRegistration = (input: Parameters<typeof client.startBeingRegistration.mutate>[0]) =>
    client.startBeingRegistration.mutate(input);
  const completeRegistration = (
    input: Parameters<typeof client.completeBeingRegistration.mutate>[0],
  ) => client.completeBeingRegistration.mutate(input);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Register a new being</h1>
        <p>Generate key material and enroll a being through the root.solar authentication flow.</p>
      </header>
      <BeingRegistration
        startRegistration={startRegistration}
        completeRegistration={completeRegistration}
      />
    </div>
  );
};

export default AuthApp;
