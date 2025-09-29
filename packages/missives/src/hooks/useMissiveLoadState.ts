import {
  useMissivesOverview,
  useMissivesListError,
  useMissivesListLoading,
} from "../state/list/index.ts";

export const useMissiveLoadState = () => {
  const missives = useMissivesOverview();
  const isLoading = useMissivesListLoading();
  const error = useMissivesListError();

  return {
    missives,
    isLoading,
    error,
  } as const;
};

export default useMissiveLoadState;
