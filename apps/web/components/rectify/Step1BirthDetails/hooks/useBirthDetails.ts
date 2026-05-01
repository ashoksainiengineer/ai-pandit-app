import { useState, useEffect, useCallback, useMemo } from 'react';
import { OffsetPreset } from '@/lib/types';
import { Step1Props } from '../types';
import { OFFSET_PRESETS } from '../constants';
import { getDaysForMonth, isValidDate, convertTo24Hour, parseTimeToParts, sanitizeInput } from '../utils';

export function useBirthDetails({
    data,
    updateData,
    offsetConfig,
    updateOffset,
    spouseData,
    updateSpouse
}: Step1Props) {
    const [showSpouse, setShowSpouse] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Parse date of birth
    const [dobParts, setDobParts] = useState({
        day: data.dateOfBirth?.split('-')[2] || '',
        month: data.dateOfBirth?.split('-')[1] || '',
        year: data.dateOfBirth?.split('-')[0] || ''
    });

    // Parse time with useEffect to sync with external data changes
    const [timeParts, setTimeParts] = useState(() => parseTimeToParts(data.tentativeTime));

    // Sync time parts when data changes externally
    useEffect(() => {
        setTimeParts(parseTimeToParts(data.tentativeTime));
    }, [data.tentativeTime]);

    // Offset state
    const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
    const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 60);

    // Sync offset with parent config
    useEffect(() => {
        if (offsetConfig?.preset) {
            setSelectedOffset(offsetConfig.preset);
        }
        if (offsetConfig?.customMinutes !== undefined) {
            setCustomOffset(offsetConfig.customMinutes);
        }
    }, [offsetConfig?.preset, offsetConfig?.customMinutes]);

    // Spouse date parts
    const [spouseDobParts, setSpouseDobParts] = useState({
        day: spouseData?.dateOfBirth?.split('-')[2] || '',
        month: spouseData?.dateOfBirth?.split('-')[1] || '',
        year: spouseData?.dateOfBirth?.split('-')[0] || ''
    });

    // Spouse time parts
    const [spouseTimeParts, setSpouseTimeParts] = useState(() => parseTimeToParts(spouseData?.birthTime));

    // Sync spouse time when data changes
    useEffect(() => {
        setSpouseTimeParts(parseTimeToParts(spouseData?.birthTime));
    }, [spouseData?.birthTime]);

    // Get available days based on selected month/year
    const availableDays = useMemo(() =>
        getDaysForMonth(dobParts.month, dobParts.year),
        [dobParts.month, dobParts.year]
    );

    const spouseAvailableDays = useMemo(() =>
        getDaysForMonth(spouseDobParts.month, spouseDobParts.year),
        [spouseDobParts.month, spouseDobParts.year]
    );

    // Memoized validation
    const errors = useMemo(() => {
        const newErrors: Record<string, string> = {};

        if (touched.fullName || data.fullName) {
            if (!data.fullName?.trim()) {
                newErrors.fullName = 'Full name is required';
            } else if (data.fullName.trim().length < 2) {
                newErrors.fullName = 'Name must be at least 2 characters';
            }
        }

        if (touched.dateOfBirth || dobParts.day) {
            if (!dobParts.day || !dobParts.month || !dobParts.year) {
                newErrors.dateOfBirth = 'Complete date of birth is required';
            } else if (!isValidDate(dobParts.year, dobParts.month, dobParts.day)) {
                newErrors.dateOfBirth = 'Invalid date (e.g., Feb 30 doesn\'t exist)';
            }
        }

        if (touched.tentativeTime || timeParts.hour) {
            if (!timeParts.hour || !timeParts.minute) {
                newErrors.tentativeTime = 'Approximate birth time is required';
            }
        }

        if (touched.birthPlace || data.birthPlace) {
            if (!data.birthPlace?.trim()) {
                newErrors.birthPlace = 'Birth place is required';
            }
        }

        return newErrors;
    }, [data.fullName, data.birthPlace, dobParts, timeParts, touched]);

    const handleDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
        setTouched(prev => ({ ...prev, dateOfBirth: true }));
        const newParts = { ...dobParts, [part]: value };

        // Reset day if it's invalid for the new month
        if (part === 'month' || part === 'year') {
            const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
            if (parseInt(newParts.day, 10) > maxDays) {
                newParts.day = '';
            }
        }

        setDobParts(newParts);

        if (newParts.year && newParts.month && newParts.day &&
            isValidDate(newParts.year, newParts.month, newParts.day)) {
            updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        }
    }, [dobParts, updateData]);

    const handleTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
        setTouched(prev => ({ ...prev, tentativeTime: true }));
        const newParts = { ...timeParts, [part]: value } as typeof timeParts;
        setTimeParts(newParts);

        if (newParts.hour && newParts.minute) {
            const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
            updateData({ tentativeTime: time24 });
        }
    }, [timeParts, updateData]);

    const handleNameChange = useCallback((value: string) => {
        setTouched(prev => ({ ...prev, fullName: true }));
        updateData({ fullName: sanitizeInput(value) });
    }, [updateData]);

    const handlePlaceChange = useCallback((updates: Record<string, unknown>) => {
        setTouched((prev: Record<string, boolean>) => ({ ...prev, birthPlace: true }));
        updateData(updates);
    }, [updateData]);

    const handleOffsetChange = useCallback((preset: OffsetPreset) => {
        setSelectedOffset(preset);
        const presetData = OFFSET_PRESETS.find(p => p.value === preset);
        if (preset !== 'custom' && presetData) {
            updateOffset?.({ preset, customMinutes: presetData.minutes, description: presetData.label });
        } else {
            updateOffset?.({ preset: 'custom', customMinutes: customOffset, description: `±${customOffset} min` });
        }
    }, [customOffset, updateOffset]);

    const handleCustomOffsetChange = useCallback((valStr: string) => {
        let val = parseInt(valStr, 10);
        if (isNaN(val)) val = 0;
        if (val > 720) val = 720; // Max 12 hours
        setCustomOffset(val);
        updateOffset?.({
            preset: 'custom',
            customMinutes: val,
            description: `±${val} min`
        });
    }, [updateOffset]);

    const handleSpouseDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
        const newParts = { ...spouseDobParts, [part]: value };

        // Reset day if it's invalid for the new month
        if (part === 'month' || part === 'year') {
            const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
            if (parseInt(newParts.day, 10) > maxDays) {
                newParts.day = '';
            }
        }

        setSpouseDobParts(newParts);

        if (newParts.year && newParts.month && newParts.day &&
            isValidDate(newParts.year, newParts.month, newParts.day)) {
            updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        }
    }, [spouseDobParts, updateSpouse]);

    const handleSpouseTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
        const newParts = { ...spouseTimeParts, [part]: value } as typeof spouseTimeParts;
        setSpouseTimeParts(newParts);

        if (newParts.hour && newParts.minute) {
            const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
            updateSpouse?.({ birthTime: time24 });
        }
    }, [spouseTimeParts, updateSpouse]);

    return {
        showSpouse,
        setShowSpouse,
        dobParts,
        timeParts,
        selectedOffset,
        customOffset,
        spouseDobParts,
        spouseTimeParts,
        availableDays,
        spouseAvailableDays,
        errors,
        handleNameChange,
        handlePlaceChange,
        handleDateChange,
        handleTimeChange,
        handleOffsetChange,
        handleCustomOffsetChange,
        handleSpouseDateChange,
        handleSpouseTimeChange
    };
}
