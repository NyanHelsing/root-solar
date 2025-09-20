import { type ReactNode } from "react";

import {
  FlareHero,
  type HeroAlignment,
  type HeroTone,
} from "@root-solar/flare";

export interface RootSolarHeroProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  tone?: HeroTone;
  alignment?: HeroAlignment;
  backgroundImage?: string;
  overlay?: string;
  imageOpacity?: number;
  children?: ReactNode;
}

const RootSolarHero = ({
  title,
  description,
  eyebrow,
  actions,
  tone = "dark",
  alignment = "center",
  backgroundImage,
  overlay = "rgba(15, 23, 42, 0.55)",
  imageOpacity = 0.42,
  children,
}: RootSolarHeroProps) => {
  return (
    <FlareHero
      title={title}
      description={description}
      eyebrow={eyebrow}
      actions={actions}
      tone={tone}
      alignment={alignment}
      backgroundImage={backgroundImage}
      overlay={overlay}
      imageOpacity={imageOpacity}
    >
      {children}
    </FlareHero>
  );
};

export default RootSolarHero;
