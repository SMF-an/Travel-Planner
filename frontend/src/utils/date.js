const PLAIN_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export const parsePlainDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const match = value.match(PLAIN_DATE_RE);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const formatPlainDate = (value, locale = 'zh-CN') => {
  const date = parsePlainDate(value);
  return date ? date.toLocaleDateString(locale) : '';
};

export const formatPlainDateParts = (value) => {
  const date = parsePlainDate(value);
  if (!date) {
    return { month: '', day: '', weekday: '' };
  }

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    month: `${date.getMonth() + 1}月`,
    day: date.getDate(),
    weekday: weekdays[date.getDay()]
  };
};

export const formatPlainDateKey = (value) => {
  const date = parsePlainDate(value);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatPlainDateWithWeekday = (value) => {
  const parts = formatPlainDateParts(value);
  if (!parts.month) {
    return '';
  }

  return `${parts.month}${parts.day}日 ${parts.weekday}`;
};