export const USER_STATUS_LABELS: Record<number, string> = {
    1: 'פעיל',
    2: 'חסום',
    3: 'ממתין',
};

export const userStatusLabel = (statusId: number) => USER_STATUS_LABELS[statusId] || `סטטוס ${statusId}`;
