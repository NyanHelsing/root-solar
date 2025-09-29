import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

import MissiveList from "./MissiveList.tsx";
import { useQueryParamSlug } from "@root-solar/routing";
import { SENTIMENT_TAG_SLUG } from "../constants.ts";

type MissiveListRouteProps = {
  defaultSentiment?: string | null;
};

const MissiveListRoute = ({ defaultSentiment = null }: MissiveListRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { value: sentiment, setValue: setSentiment } = useQueryParamSlug({
    key: "sentiment",
    defaultValue: defaultSentiment,
  });

  const basePath = useMemo(() => {
    return location.pathname.startsWith("/axioms") ? "/axioms" : "/missives";
  }, [location.pathname]);

  const handleSentimentChange = (next: string | null) => {
    setSentiment(next);

    if (next === SENTIMENT_TAG_SLUG && basePath !== "/axioms") {
      navigate({
        pathname: "/axioms",
        search: next ? `?sentiment=${next}` : undefined,
      }, { replace: true });
      return;
    }

    if (next !== SENTIMENT_TAG_SLUG && basePath === "/axioms") {
      navigate({
        pathname: "/missives",
        search: next ? `?sentiment=${next}` : undefined,
      }, { replace: true });
    }
  };

  return (
    <MissiveList
      sentiment={sentiment}
      onSentimentChanged={handleSentimentChange}
      basePath={basePath}
      showViewAllLink={basePath === "/axioms"}
    />
  );
};

export default MissiveListRoute;

export const AxiomaticMissiveListRoute = () => (
  <MissiveListRoute defaultSentiment={SENTIMENT_TAG_SLUG} />
);
