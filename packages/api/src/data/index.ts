export type SeedTag = {
    slug: string;
    label: string;
    tags: readonly string[];
    description?: string;
};

export const seedTags: readonly SeedTag[] = [
    {
        slug: "sentimental",
        label: "Sentimental",
        description: "Signals missives that describe or shape communal sentiment",
        tags: ["tag:sentimental"]
    },
    {
        slug: "priority",
        label: "Priority",
        description: "Highlights missives that set or influence prioritization",
        tags: ["tag:sentimental"]
    },
    {
        slug: "axiomatic",
        label: "Axiomatic",
        description: "Represents core axioms of the shared canon",
        tags: ["tag:sentimental"]
    },
    {
        slug: "axiom",
        label: "Axiom",
        description: "Legacy tag maintained for backwards compatibility",
        tags: ["tag:sentimental"]
    }
];

export const seedMissives = [
    {
        id: "missive:0001",
        tagSlugs: ["axiomatic"],
        title: "Everyone matters the same"
    },
    {
        id: "missive:0002",
        tagSlugs: ["axiomatic"],
        title: "Rights protect needs."
    },
    {
        id: "missive:0003",
        tagSlugs: ["axiomatic"],
        title: "Don't get in the way; fix what you break."
    },
    {
        id: "missive:0004",
        tagSlugs: ["axiomatic"],
        title: "Use only what’s needed to meet the need."
    },
    {
        id: "missive:0005",
        tagSlugs: ["axiomatic"],
        title: "Make rules that can all fit together."
    },
    {
        id: "missive:0006",
        tagSlugs: ["axiomatic"],
        title: "When we can choose, bother people the least."
    },
    {
        id: "missive:0007",
        tagSlugs: ["axiomatic"],
        title: "First things first: needs that keep others possible come first (only for as long as needed)."
    },
    {
        id: "missive:0008",
        tagSlugs: ["axiomatic"],
        title: "If there isn’t enough, share fairly and change the plan when things change."
    },
    {
        id: "missive:0009",
        tagSlugs: ["axiomatic"],
        title: "If you caused the problem, help fix it."
    },
    {
        id: "missive:0010",
        tagSlugs: ["axiomatic"],
        title: "You can choose for yourself, not for others."
    },
    {
        id: "missive:0011",
        tagSlugs: ["axiomatic"],
        title: "What’s right depends on the situation; update when the situation changes."
    },
    {
        id: "missive:0012",
        tagSlugs: ["axiomatic"],
        title: "No one gets a “need” that erases other people."
    },
    {
        id: "missive:0013",
        tagSlugs: ["axiomatic"],
        title: "When it’s fuzzy, remember: rights protect needs; use examples."
    },
    {
        id: "missive:0014",
        tagSlugs: ["axiomatic"],
        title: "If you claim a right, say what you need, clearly."
    }
] as const;
