import packageInfo from '../../package.json';

/**
 * Versi aplikasi tersentralisasi yang bersumber langsung dari package.json
 * dan disinkronkan dengan CHANGELOG.md.
 */
export const APP_VERSION = `v${packageInfo.version}`;
export const RAW_APP_VERSION = packageInfo.version;
