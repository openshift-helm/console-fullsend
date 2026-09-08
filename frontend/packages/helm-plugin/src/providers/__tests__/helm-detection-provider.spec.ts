import { renderHook, waitFor } from '@testing-library/react';
import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { FLAG_OPENSHIFT_HELM } from '../../const';
import { useDetectHelmChartRepositories } from '../helm-detection-provider';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sListResource: jest.fn(),
}));

const k8sListResourceMock = k8sListResource as jest.Mock;

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

  it('should not call k8sListResource (no API polling)', () => {
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    expect(k8sListResourceMock).not.toHaveBeenCalled();
  });

  it('should set the flag exactly once even after re-renders', async () => {
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    rerender();
    rerender();
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, true);
  });
});
