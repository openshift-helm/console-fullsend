import { useEffect } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { FLAG_OPENSHIFT_HELM } from '../const';

export const useDetectHelmChartRepositories = (setFeatureFlag: SetFeatureFlag) => {
  useEffect(() => {
    setFeatureFlag(FLAG_OPENSHIFT_HELM, true);
  }, [setFeatureFlag]);
};
