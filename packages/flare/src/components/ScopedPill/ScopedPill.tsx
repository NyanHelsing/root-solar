import type { ReactElement } from "react";

import Pill, { type PillTone } from "../Pill/Pill.tsx";
import styles from "./ScopedPill.module.scss";

export type ScopedPillProps = {
    scopeLabel: string;
    valueLabel: string;
    tone?: PillTone;
    className?: string;
    icon?: ReactElement;
};

const ScopedPill = ({ scopeLabel, valueLabel, tone, className, icon }: ScopedPillProps) => {
    const classes = [styles.scoped, className].filter(Boolean).join(" ");

    return (
        <span className={classes}>
            <span className={styles.scoped__scope}>{scopeLabel}</span>
            <Pill label={valueLabel} tone={tone} icon={icon} className={styles.scoped__pill} />
        </span>
    );
};

export default ScopedPill;
