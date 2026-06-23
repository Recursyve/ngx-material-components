export type TimePeriod = "AM" | "PM";

export type ParsedTime = {
    hour: number;
    minute: number;
    period: TimePeriod;
};

export type ClockFaceOption = {
    angle: number;
    value: number;
};

export const DEFAULT_MINUTES_GAP = 5;

const TWELVE_HOUR_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const TWENTY_FOUR_HOUR_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function parseTime(value: string | null | undefined): ParsedTime | null {
    const normalized = value?.trim();
    if (!normalized) {
        return null;
    }

    const twelveHourMatch = normalized.match(TWELVE_HOUR_PATTERN);
    if (twelveHourMatch) {
        const hour = Number(twelveHourMatch[1]);
        const minute = Number(twelveHourMatch[2]);
        const period = twelveHourMatch[3].toUpperCase() as TimePeriod;

        if (!isValidTwelveHourTime(hour, minute)) {
            return null;
        }

        return { hour, minute, period };
    }

    const twentyFourHourMatch = normalized.match(TWENTY_FOUR_HOUR_PATTERN);
    if (twentyFourHourMatch) {
        const hour24 = Number(twentyFourHourMatch[1]);
        const minute = Number(twentyFourHourMatch[2]);

        if (hour24 > 23 || minute > 59) {
            return null;
        }

        const period: TimePeriod = hour24 >= 12 ? "PM" : "AM";
        const hour = toTwelveHour(hour24);

        return { hour, minute, period };
    }

    return null;
}

export function formatTime(time: ParsedTime): string {
    return `${time.hour}:${pad(time.minute)} ${time.period}`;
}

export function getDefaultTime(): ParsedTime {
    const now = new Date();
    const hour24 = now.getHours();

    return {
        hour: toTwelveHour(hour24),
        minute: now.getMinutes(),
        period: hour24 >= 12 ? "PM" : "AM"
    };
}

export function resolveTime(value: string | null | undefined): ParsedTime {
    return parseTime(value) ?? getDefaultTime();
}

export function getHourFaceOptions(): ClockFaceOption[] {
    return Array.from({ length: 12 }, (_, index) => {
        const value = index + 1;
        const angle = 30 * value;

        return {
            value,
            angle
        };
    });
}

export function getMinuteFaceOptions(): ClockFaceOption[] {
    const options: ClockFaceOption[] = [];

    for (let minute = 0; minute < 60; minute++) {
        const angle = 6 * minute;

        options.push({
            value: minute,
            angle: angle === 0 ? 360 : angle
        });
    }

    return options;
}

export function isMinuteLabelVisible(minute: number, minutesGap = DEFAULT_MINUTES_GAP): boolean {
    return minute % minutesGap === 0;
}

function isValidTwelveHourTime(hour: number, minute: number): boolean {
    return hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59;
}

function toTwelveHour(hour24: number): number {
    const hour = hour24 % 12;
    return hour === 0 ? 12 : hour;
}

function pad(value: number): string {
    return value.toString().padStart(2, "0");
}
