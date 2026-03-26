/**
 * Generic hook for quota data fetching and management.
 */

import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthFileItem } from '@/types';
import { useNotificationStore, useQuotaStore } from '@/stores';
import { getStatusFromError } from '@/utils/quota';
import type { QuotaConfig } from './quotaConfigs';
import { deleteAuthFilesAndRefresh, shouldAutoDeleteAuthFileOnQuotaError } from './quotaAutoDelete';

type QuotaScope = 'page' | 'all';

type QuotaUpdater<T> = T | ((prev: T) => T);

type QuotaSetter<T> = (updater: QuotaUpdater<T>) => void;

interface LoadQuotaResult<TData> {
  name: string;
  status: 'success' | 'error';
  data?: TData;
  error?: string;
  errorStatus?: number;
}

export function useQuotaLoader<TState, TData>(config: QuotaConfig<TState, TData>) {
  const { t } = useTranslation();
  const showNotification = useNotificationStore((state) => state.showNotification);
  const quota = useQuotaStore(config.storeSelector);
  const setQuota = useQuotaStore((state) => state[config.storeSetter]) as QuotaSetter<
    Record<string, TState>
  >;

  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadQuota = useCallback(
    async (
      targets: AuthFileItem[],
      scope: QuotaScope,
      setLoading: (loading: boolean, scope?: QuotaScope | null) => void
    ) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      const requestId = ++requestIdRef.current;
      setLoading(true, scope);

      try {
        if (targets.length === 0) return;

        setQuota((prev) => {
          const nextState = { ...prev };
          targets.forEach((file) => {
            nextState[file.name] = config.buildLoadingState();
          });
          return nextState;
        });

        const results = await Promise.all(
          targets.map(async (file): Promise<LoadQuotaResult<TData>> => {
            try {
              const data = await config.fetchQuota(file, t);
              return { name: file.name, status: 'success', data };
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : t('common.unknown_error');
              const errorStatus = getStatusFromError(err);
              return { name: file.name, status: 'error', error: message, errorStatus };
            }
          })
        );
        if (requestId !== requestIdRef.current) return;

        const namesToAutoDelete =
          results
            .filter(
              (result) =>
                result.status === 'error' &&
                shouldAutoDeleteAuthFileOnQuotaError(
                  result.errorStatus,
                  config.autoDeleteOnErrorStatuses
                )
            )
            .map((result) => result.name);
        if (namesToAutoDelete.length > 0) {
          showNotification(
            namesToAutoDelete.length === 1
              ? t('auth_files.quota_auto_delete_single', { name: namesToAutoDelete[0] })
              : t('auth_files.quota_auto_delete_multiple', { count: namesToAutoDelete.length }),
            'warning'
          );
        }
        const deletedNames = await deleteAuthFilesAndRefresh(namesToAutoDelete);

        setQuota((prev) => {
          const nextState = { ...prev };
          results.forEach((result) => {
            if (deletedNames.has(result.name)) {
              delete nextState[result.name];
              return;
            }
            if (result.status === 'success') {
              nextState[result.name] = config.buildSuccessState(result.data as TData);
            } else {
              nextState[result.name] = config.buildErrorState(
                result.error || t('common.unknown_error'),
                result.errorStatus
              );
            }
          });
          return nextState;
        });
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [config, setQuota, showNotification, t]
  );

  return { quota, loadQuota };
}
