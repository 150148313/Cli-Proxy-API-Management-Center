import { authFilesApi } from '@/services/api';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';

const DEFAULT_AUTO_DELETE_ON_ERROR_STATUSES = [401] as const;
const AUTO_DELETE_REFRESH_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const shouldAutoDeleteAuthFileOnQuotaError = (
  status: number | undefined,
  autoDeleteOnErrorStatuses?: readonly number[]
): boolean => {
  if (typeof status !== 'number') return false;
  const statuses = new Set(autoDeleteOnErrorStatuses ?? DEFAULT_AUTO_DELETE_ON_ERROR_STATUSES);
  return statuses.has(status);
};

export const deleteAuthFilesAndRefresh = async (names: string[]): Promise<Set<string>> => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  const deletedNames = new Set<string>();

  if (uniqueNames.length === 0) return deletedNames;

  const results = await Promise.allSettled(
    uniqueNames.map(async (name) => {
      await authFilesApi.deleteFile(name);
      return name;
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      deletedNames.add(result.value);
    }
  });

  if (deletedNames.size > 0) {
    await wait(AUTO_DELETE_REFRESH_DELAY_MS);
    await triggerHeaderRefresh();
  }

  return deletedNames;
};
