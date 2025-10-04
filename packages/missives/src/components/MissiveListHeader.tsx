import type { ChangeEvent, CSSProperties } from "react";
import { Link } from "react-router";

import { FlareButton, FlareStack } from "@root-solar/flare";

import type { TagOption } from "../utils/tagFilterUtils.ts";
import type { MissiveListCopy } from "../utils/listUtils.ts";

type MissiveListHeaderProps = {
    copy: MissiveListCopy;
    totalWeight: number;
    filterControlId: string;
    filterValue: string;
    tagOptions: TagOption[];
    onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    showViewAllLink: boolean;
    onCreate?: () => void;
};

const controlStyles: CSSProperties = {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--rs-border-strong, #d0d4dd)",
    background: "var(--flare-surface, #fff)",
    color: "inherit",
};

const MissiveListHeader = ({
    copy,
    totalWeight,
    filterControlId,
    filterValue,
    tagOptions,
    onFilterChange,
    showViewAllLink,
    onCreate,
}: MissiveListHeaderProps) => (
    <FlareStack as="header" gap="sm">
        <h1 className="rs-heading-xl">{copy.title}</h1>
        <p className="rs-text-body-lg rs-text-soft">{copy.description}</p>
        <p className="rs-text-soft">
            {copy.totalLabel}: <strong>{totalWeight}</strong>
        </p>
        <FlareStack direction="row" align="center" gap="sm" wrap>
            <label htmlFor={filterControlId} className="rs-text-caption rs-text-soft">
                Filter by tag
            </label>
            <select
                id={filterControlId}
                value={filterValue}
                onChange={onFilterChange}
                style={controlStyles}
            >
                <option value="">All missives</option>
                {tagOptions.map((option) => (
                    <option key={option.slug} value={option.slug}>
                        {option.label}
                    </option>
                ))}
            </select>
            {showViewAllLink ? (
                <Link to="/missives" className="rs-link">
                    View all missives
                </Link>
            ) : null}
            {onCreate ? (
                <FlareButton type="button" size="sm" onClick={onCreate}>
                    Create missive
                </FlareButton>
            ) : null}
        </FlareStack>
    </FlareStack>
);

export default MissiveListHeader;
