import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Label>{t('reminders.dateRange')}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('reminders.startDate')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : t('reminders.selectDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => onStartDateChange(date || null)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {startDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStartDateChange(null)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              {t('reminders.clear')}
            </Button>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('reminders.endDate')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : t('reminders.selectDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => onEndDateChange(date || null)}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {endDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEndDateChange(null)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              {t('reminders.clear')}
            </Button>
          )}
        </div>
      </div>
      {startDate && endDate && startDate > endDate && (
        <p className="text-xs text-destructive">
          {t('reminders.invalidDateRange')}
        </p>
      )}
    </div>
  );
};
