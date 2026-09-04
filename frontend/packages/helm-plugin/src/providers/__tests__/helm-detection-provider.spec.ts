import { renderHook, waitFor } from '@testing-library/react';
import { FLAG_OPENSHIFT_HELM } from '../../const';
import { useDetectHelmChartRepositories } from '../helm-detection-provider';

describe('useDetectHelmChartRepositories', () => {
  const setFeatureFlag = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should always set OPENSHIFT_HELM flag to true', async () => {
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, true);
  });
});
