import { renderHook, waitFor } from '@testing-library/react';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import { FLAG_OPENSHIFT_HELM } from '../../const';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models/helm';
import { useDetectHelmChartRepositories } from '../helm-detection-provider';

jest.mock('@console/dynamic-plugin-sdk/src/utils/promise', () => ({
  settleAllPromises: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sListResource: jest.fn(),
}));

const settleAllPromisesMock = settleAllPromises as jest.Mock;
const k8sListResourceMock = k8sListResource as jest.Mock;

describe('useDetectHelmChartRepositories', () => {
  const setFeatureFlag = jest.fn();
  const dummyPromise = Promise.resolve({});

  beforeEach(() => {
    k8sListResourceMock.mockReturnValue(dummyPromise);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call k8sListResource with HelmChartRepositoryModel and ProjectHelmChartRepositoryModel', async () => {
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[[], []], [], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    expect(k8sListResourceMock).toHaveBeenCalledTimes(2);
    expect(k8sListResourceMock.mock.calls[0]).toEqual([
      { model: HelmChartRepositoryModel, queryParams: {} },
    ]);
    expect(k8sListResourceMock.mock.calls[1]).toEqual([
      { model: ProjectHelmChartRepositoryModel, queryParams: {} },
    ]);
  });

  it('should set flag to true when CRDs exist with instances', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[[{ metadata: { name: 'repo1' } }], []], [], []]),
    );
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, true);
  });

  it('should set flag to true when CRDs exist but no instances (empty lists)', async () => {
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[[], []], [], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, true);
  });

  it('should set flag to true when only one CRD API succeeds', async () => {
    // One fulfilled, one rejected
    const error404 = new HttpError('404', 404, { status: 404 } as Response);
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[[]], [error404], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, true);
  });

  it('should set flag to false when all CRD APIs return 404', async () => {
    const error404a = new HttpError('404', 404, { status: 404 } as Response);
    const error404b = new HttpError('404', 404, { status: 404 } as Response);
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error404a, error404b], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, false);
  });

  it('should set flag to undefined on transient (non-404) errors', async () => {
    const error500a = new HttpError('500', 500, { status: 500 } as Response);
    const error500b = new HttpError('500', 500, { status: 500 } as Response);
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error500a, error500b], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, undefined);
  });

  it('should set flag to undefined when errors are mixed non-404 statuses', async () => {
    const error404 = new HttpError('404', 404, { status: 404 } as Response);
    const error500 = new HttpError('500', 500, { status: 500 } as Response);
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error404, error500], []]));
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_OPENSHIFT_HELM, undefined);
  });

  it('should not poll — detection runs only once', async () => {
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[[], []], [], []]));
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await waitFor(() => {
      expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    });
    rerender();
    rerender();
    // k8sListResource called only on the initial render (2 CRD models)
    expect(k8sListResourceMock).toHaveBeenCalledTimes(2);
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
  });
});
