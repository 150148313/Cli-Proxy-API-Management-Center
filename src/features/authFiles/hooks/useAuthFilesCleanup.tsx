import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { authFilesApi } from '@/services/api';
import { useNotificationStore } from '@/stores';

type UseAuthFilesCleanupOptions = {
  disableControls: boolean;
  loadFiles: () => Promise<void>;
  refreshKeyStats: () => Promise<void>;
};

type ApiErrorLike = {
  status?: number;
};

const PREVIEW_FILE_LIMIT = 12;

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  if ('status' in error) return (error as ApiErrorLike).status;
  return undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
};

const buildCleanupPreviewMessage = (
  intro: string,
  listLabel: string,
  files: string[],
  moreLabel: string
): ReactNode => {
  const visibleFiles = files.slice(0, PREVIEW_FILE_LIMIT);
  const remainingCount = Math.max(0, files.length - visibleFiles.length);

  return (
    <div>
      <p style={{ margin: 0 }}>{intro}</p>
      {visibleFiles.length > 0 ? (
        <>
          <p style={{ margin: '12px 0 8px' }}>{listLabel}</p>
          <ul style={{ margin: 0, paddingLeft: 20, maxHeight: 240, overflowY: 'auto' }}>
            {visibleFiles.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          {remainingCount > 0 ? <p style={{ margin: '8px 0 0' }}>{moreLabel}</p> : null}
        </>
      ) : null}
    </div>
  );
};

export function useAuthFilesCleanup(options: UseAuthFilesCleanupOptions) {
  const { disableControls, loadFiles, refreshKeyStats } = options;
  const { t } = useTranslation();
  const { showConfirmation, showNotification } = useNotificationStore();
  const [cleanup401Loading, setCleanup401Loading] = useState(false);

  const handleCleanup401 = useCallback(async () => {
    if (disableControls || cleanup401Loading) return;

    setCleanup401Loading(true);
    try {
      const preview = await authFilesApi.cleanup401(true);

      if (preview.matched <= 0) {
        showNotification(t('auth_files.cleanup_401_none'), 'info');
        return;
      }

      showConfirmation({
        title: t('auth_files.cleanup_401_title'),
        message: buildCleanupPreviewMessage(
          t('auth_files.cleanup_401_confirm', { count: preview.matched }),
          t('auth_files.cleanup_401_list_label'),
          preview.files,
          t('auth_files.cleanup_401_more', {
            count: Math.max(0, preview.files.length - PREVIEW_FILE_LIMIT),
          })
        ),
        variant: 'danger',
        confirmText: t('auth_files.cleanup_401_button'),
        onConfirm: async () => {
          setCleanup401Loading(true);
          try {
            const result = await authFilesApi.cleanup401(false);
            await Promise.all([loadFiles(), refreshKeyStats()]);

            if (result.failed.length === 0) {
              if (result.deleted > 0) {
                showNotification(
                  t('auth_files.cleanup_401_success', { count: result.deleted }),
                  'success'
                );
              } else {
                showNotification(t('auth_files.cleanup_401_none'), 'info');
              }
              return;
            }

            if (result.deleted > 0) {
              showNotification(
                t('auth_files.cleanup_401_partial', {
                  success: result.deleted,
                  failed: result.failed.length,
                }),
                'warning'
              );
              return;
            }

            showNotification(
              t('auth_files.cleanup_401_execute_failed', {
                message: result.failed[0]?.error || t('notification.delete_failed'),
              }),
              'error'
            );
          } catch (error: unknown) {
            const status = getErrorStatus(error);
            if (status === 404 || status === 405) {
              showNotification(t('auth_files.cleanup_401_unsupported'), 'warning');
              return;
            }

            showNotification(
              t('auth_files.cleanup_401_execute_failed', {
                message: getErrorMessage(error, t('notification.delete_failed')),
              }),
              'error'
            );
            throw error;
          } finally {
            setCleanup401Loading(false);
          }
        },
      });
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      if (status === 404 || status === 405) {
        showNotification(t('auth_files.cleanup_401_unsupported'), 'warning');
        return;
      }

      showNotification(
        t('auth_files.cleanup_401_preview_failed', {
          message: getErrorMessage(error, t('notification.refresh_failed')),
        }),
        'error'
      );
    } finally {
      setCleanup401Loading(false);
    }
  }, [cleanup401Loading, disableControls, loadFiles, refreshKeyStats, showConfirmation, showNotification, t]);

  return {
    cleanup401Loading,
    handleCleanup401,
  };
}
