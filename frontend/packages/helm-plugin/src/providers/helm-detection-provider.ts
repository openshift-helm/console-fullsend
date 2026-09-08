import { useEffect } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { FLAG_OPENSHIFT_HELM } from '../const';

/**
 * Unconditionally enables the Helm feature flag.
 *
 * Previously this hook polled HelmChartRepository / ProjectHelmChartRepository
 * CRDs via k8sListResource and only enabled the flag when enabled instances
 * existed.  That caused the Helm tab to disappear when the CRDs were installed
 * but no instances had been created yet (empty-list ≠ not-installed).
 *
 * Runtime API detection was removed entirely: the Helm plugin is loaded only
 * when the cluster supports Helm, so the flag can always be true.  If Helm
 * support needs to be gated again in the future, detection should distinguish
 * "CRD not installed (404)" from "CRD installed, zero instances."
 */
export const useDetectHelmChartRepositories = (setFeatureFlag: SetFeatureFlag) => {
  useEffect(() => {
    setFeatureFlag(FLAG_OPENSHIFT_HELM, true);
  }, [setFeatureFlag]);
};
