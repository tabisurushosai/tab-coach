export type MessageKey =
  | 'extension_name'
  | 'extension_description'
  | 'cleanup_button'
  | 'undo_button'
  | 'undo_notice'
  | 'whitelist_section_title'
  | 'whitelist_section_hint'
  | 'whitelist_pattern_label'
  | 'whitelist_pattern_placeholder'
  | 'whitelist_note_label'
  | 'whitelist_note_placeholder'
  | 'whitelist_add_button'
  | 'whitelist_remove_button'
  | 'whitelist_empty'
  | 'whitelist_error_empty'
  | 'whitelist_error_duplicate'
  | 'whitelist_error_too_long'
  | 'whitelist_error_limit'
  | 'thresholds_section_title'
  | 'thresholds_section_hint'
  | 'thresholds_yellow_label'
  | 'thresholds_red_label'
  | 'thresholds_save_button'
  | 'thresholds_reset_button'
  | 'thresholds_saved_notice'
  | 'thresholds_error_yellow_invalid'
  | 'thresholds_error_red_invalid'
  | 'thresholds_error_red_not_greater'
  | 'inactive_section_title'
  | 'inactive_section_hint'
  | 'inactive_minutes_label'
  | 'inactive_save_button'
  | 'inactive_reset_button'
  | 'inactive_saved_notice'
  | 'inactive_error_invalid'
  | 'search_placeholder'
  | 'search_clear_label'
  | 'search_no_match'
  | 'archive_button'
  | 'archive_notice'
  | 'archive_section_title'
  | 'archive_section_hint'
  | 'archive_empty'
  | 'archive_count_label'
  | 'archive_open_link_label'
  | 'archive_restore_button'
  | 'archive_restore_label'
  | 'archive_export_button'
  | 'archive_export_empty_notice'
  | 'archive_export_success_notice'
  | 'archive_export_error_notice'
  | 'archive_import_button'
  | 'archive_import_success_notice'
  | 'archive_import_all_duplicate_notice'
  | 'archive_import_error_invalid_json'
  | 'archive_import_error_invalid_shape'
  | 'archive_import_error_unsupported_version'
  | 'archive_import_error_no_entries'
  | 'archive_import_error_too_large'
  | 'archive_import_error_read_failed'
  | 'report_section_title'
  | 'report_section_hint'
  | 'report_current_month_label'
  | 'report_summary_cleanups'
  | 'report_summary_closed'
  | 'report_summary_saved_time'
  | 'report_chart_aria_label'
  | 'report_chart_no_data'
  | 'report_saved_time_zero'
  | 'report_saved_time_format'
  | 'grouping_section_title'
  | 'grouping_section_hint'
  | 'grouping_premium_label'
  | 'grouping_run_button'
  | 'grouping_success_notice'
  | 'grouping_no_candidates_notice'
  | 'grouping_unavailable_notice'
  | 'grouping_error_notice';

export type Locale = 'ja' | 'en';

const PLACEHOLDER_MISSING = (key: string): string => `??${key}??`;

function isChromeI18nAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.i18n !== 'undefined' &&
    typeof chrome.i18n.getMessage === 'function'
  );
}

export function t(key: MessageKey, substitutions?: string | readonly string[]): string {
  if (!isChromeI18nAvailable()) {
    return PLACEHOLDER_MISSING(key);
  }
  const subs = substitutions === undefined ? undefined : (substitutions as string | string[]);
  const message = subs === undefined ? chrome.i18n.getMessage(key) : chrome.i18n.getMessage(key, subs);
  return message === '' ? PLACEHOLDER_MISSING(key) : message;
}

export function getUILocale(): Locale {
  if (!isChromeI18nAvailable() || typeof chrome.i18n.getUILanguage !== 'function') {
    return 'en';
  }
  const lang = chrome.i18n.getUILanguage();
  return lang.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function applyI18nToDom(root: ParentNode = document): void {
  const nodes = root.querySelectorAll<HTMLElement>('[data-i18n]');
  nodes.forEach((el) => {
    const key = el.dataset['i18n'];
    if (!key) return;
    el.textContent = t(key as MessageKey);
  });
  const attrNodes = root.querySelectorAll<HTMLElement>('[data-i18n-attr]');
  attrNodes.forEach((el) => {
    const spec = el.dataset['i18nAttr'];
    if (!spec) return;
    spec.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) return;
      el.setAttribute(attr, t(key as MessageKey));
    });
  });
}
