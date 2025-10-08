import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface WeekdaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

export const WeekdaySelector = ({ selectedDays, onChange }: WeekdaySelectorProps) => {
  const { t } = useTranslation();

  const weekdays = [
    { value: 0, label: t('reminders.weekdays.sunday') },
    { value: 1, label: t('reminders.weekdays.monday') },
    { value: 2, label: t('reminders.weekdays.tuesday') },
    { value: 3, label: t('reminders.weekdays.wednesday') },
    { value: 4, label: t('reminders.weekdays.thursday') },
    { value: 5, label: t('reminders.weekdays.friday') },
    { value: 6, label: t('reminders.weekdays.saturday') },
  ];

  const handleToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  };

  const selectAll = () => {
    onChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t('reminders.repeatDays')}</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            {t('reminders.selectAll')}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:underline"
          >
            {t('reminders.clearAll')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {weekdays.map((day) => (
          <div key={day.value} className="flex items-center space-x-2">
            <Checkbox
              id={`day-${day.value}`}
              checked={selectedDays.includes(day.value)}
              onCheckedChange={() => handleToggle(day.value)}
            />
            <Label
              htmlFor={`day-${day.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {day.label}
            </Label>
          </div>
        ))}
      </div>
      {selectedDays.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {t('reminders.emptyDaysWarning')}
        </p>
      )}
    </div>
  );
};
