import type { HTMLAttributes, ReactNode } from "react";
import styles from "./List.module.scss";

export type ListVariant = "plain" | "bordered" | "surface";
export type ListDensity = "tight" | "normal" | "loose";

export interface ListItem {
  id?: string | number;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  content?: ReactNode;
}

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  items?: ListItem[];
  ordered?: boolean;
  variant?: ListVariant;
  density?: ListDensity;
  renderItem?: (item: ListItem, index: number) => ReactNode;
}

const List = ({
  items,
  ordered = false,
  variant = "plain",
  density = "normal",
  renderItem,
  children,
  className,
  ...props
}: ListProps) => {
  const Component = (ordered ? "ol" : "ul") as "ol" | "ul";
  const classes = [
    styles.list,
    ordered ? styles["list--ordered"] : undefined,
    variant === "bordered" ? styles["list--bordered"] : undefined,
    variant === "surface" ? styles["list--surface"] : undefined,
    density === "tight" ? styles["list--tight"] : undefined,
    density === "loose" ? styles["list--loose"] : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");

  const hasItems = Array.isArray(items) && items.length > 0;
  const content = hasItems
    ? items.map((item, index) => {
        if (renderItem) {
          return renderItem(item, index);
        }

        const key = item.id ?? index;
        const marker = (
          <span className={styles["list__item-marker"]} aria-hidden={ordered ? "true" : undefined}>
            {ordered ? null : item.icon ?? "•"}
          </span>
        );

        return (
          <li key={key} className={styles.list__item}>
            {marker}
            <div>
              {item.title !== undefined ? (
                <div className={styles.list__title}>{item.title}</div>
              ) : null}
              {item.description !== undefined ? (
                <span className={styles.list__content}>{item.description}</span>
              ) : null}
              {item.content}
            </div>
          </li>
        );
      })
    : children;

  return (
    <Component className={classes} {...props}>
      {content}
    </Component>
  );
};

export default List;
